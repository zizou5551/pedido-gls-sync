import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

import {
  Search, X, Trash2, CalendarIcon, FileSpreadsheet,
  RefreshCw, ExternalLink, CheckCircle2, Clock, Truck,
  AlertCircle, Package,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Pedido {
  id: string;
  estado: string;
  fecha: string;
  nombre: string;
  direccion: string;
  poblacion: string;
  curso: string;
  email: string;
  tracking_gls?: string | null;
  estado_envio?: string | null;
  expedicion_gls?: string | null;
}

interface EnvioGLS {
  expedicion: string;
  fecha: string;
  destinatario: string;
  direccion: string;
  localidad: string;
  estado: string;
  pedido_id: string | null;
  tracking: string | null;
  fecha_actualizacion?: string | null;
  observacion?: string | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
type StatusCfg = { color: string; bg: string; icon: React.ReactNode; label: string };

const STATUS_MAP: Record<string, StatusCfg> = {
  ENTREGADO: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Entregado" },
  "ENTREGADO EN PARCELSHOP": { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Entregado (PShop)" },
  "EN REPARTO": { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <Truck className="h-3 w-3" />, label: "En Reparto" },
  "EN DELEGACION DESTINO": { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <Truck className="h-3 w-3" />, label: "En Delegación" },
  GRABADO: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <Clock className="h-3 w-3" />, label: "Grabado" },
  ALMACENADO: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <Clock className="h-3 w-3" />, label: "Almacenado" },
  MANIFESTADA: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="h-3 w-3" />, label: "Manifestada" },
  PENDIENTE: { color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: <Package className="h-3 w-3" />, label: "Pendiente" },
  "EN DEVOLUCION": { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <AlertCircle className="h-3 w-3" />, label: "En Devolución" },
  AUSENTE: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <AlertCircle className="h-3 w-3" />, label: "Ausente" },
  INCIDENCIA: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <AlertCircle className="h-3 w-3" />, label: "Incidencia" },
};

function getStatusCfg(estado: string): StatusCfg {
  const key = (estado ?? "").toUpperCase().trim();
  return STATUS_MAP[key] ?? {
    color: "text-slate-500", bg: "bg-slate-50 border-slate-200",
    icon: <Package className="h-3 w-3" />, label: estado || "Sin datos",
  };
}

function StatusBadge({ estado }: { estado: string }) {
  const cfg = getStatusCfg(estado);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Metric card — clickable to filter
// ---------------------------------------------------------------------------
interface MetricCardProps {
  label: string;
  value: number;
  total?: number;
  colorClass: string;
  bgClass: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function MetricCard({ label, value, total, colorClass, bgClass, icon, active, onClick }: MetricCardProps) {
  const pct = total ? Math.round((value / total) * 100) : null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-4 transition-all w-full bg-white",
        "hover:shadow-md hover:-translate-y-0.5",
        active ? "ring-2 ring-primary shadow-sm" : "shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
          {pct !== null && (
            <p className="text-xs text-muted-foreground mt-0.5">{pct}% del total</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass} flex-shrink-0`}>{icon}</div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const normalizeText = (t: string) =>
  (t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try { return format(new Date(d), "dd/MM/yyyy", { locale: es }); }
  catch { return d; }
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  try { return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }); }
  catch { return d; }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const OrderStatus = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ENTREGADO" | "EN_TRANSITO" | "PENDIENTE">("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enviosGLS, setEnviosGLS] = useState<EnvioGLS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Lookup: pedido_id → GLS shipment
  const envioMap = new Map<string, EnvioGLS>();
  for (const e of enviosGLS) {
    if (e.pedido_id) envioMap.set(e.pedido_id.trim(), e);
  }

  const loadData = useCallback(async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const chunk = 1000;

      let allPedidos: Pedido[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("pedidos").select("*").order("fecha", { ascending: false })
          .range(from, from + chunk - 1);
        if (error) throw error;
        if (!data?.length) break;
        allPedidos = [...allPedidos, ...data];
        if (data.length < chunk) break;
        from += chunk;
      }

      let allEnvios: EnvioGLS[] = [];
      from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("envios_gls").select("*").order("fecha", { ascending: false })
          .range(from, from + chunk - 1);
        if (error) throw error;
        if (!data?.length) break;
        allEnvios = [...allEnvios, ...data];
        if (data.length < chunk) break;
        from += chunk;
      }

      setPedidos(allPedidos);
      setEnviosGLS(allEnvios);
      setLastUpdate(new Date());
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const t = setInterval(() => loadData(true), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Derived data helpers
  // ---------------------------------------------------------------------------
  const getEnvio = (pedido: Pedido): EnvioGLS | undefined => {
    const id = pedido.id.trim();
    return envioMap.get(id) ?? envioMap.get(id.replace("=", "")) ?? envioMap.get("=" + id);
  };

  const getEffectiveStatus = (pedido: Pedido): string => {
    const e = getEnvio(pedido);
    return e?.estado || pedido.estado_envio || pedido.estado || "PENDIENTE";
  };

  const getTrackingUrl = (pedido: Pedido): string | null => {
    const e = getEnvio(pedido);
    return e?.tracking || pedido.tracking_gls || null;
  };

  const getLastStatusDate = (pedido: Pedido): string => {
    const e = getEnvio(pedido);
    return formatDateTime(e?.fecha_actualizacion || pedido.fecha);
  };

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------
  const total = pedidos.length;
  const entregados = pedidos.filter(p => normalizeText(getEffectiveStatus(p)).includes("entregado")).length;
  const enTransito = pedidos.filter(p => {
    const s = getEffectiveStatus(p).toUpperCase();
    return !normalizeText(s).includes("entregado") && s !== "PENDIENTE" && s !== "";
  }).length;
  const pendientes = pedidos.filter(p => {
    const s = getEffectiveStatus(p).toUpperCase();
    return s === "PENDIENTE" || s === "";
  }).length;

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filtered = pedidos.filter(p => {
    const s = normalizeText(searchTerm);
    const matchSearch = !s
      || normalizeText(p.id).includes(s)
      || normalizeText(p.nombre).includes(s)
      || normalizeText(p.curso).includes(s)
      || normalizeText(p.email).includes(s)
      || normalizeText(p.poblacion).includes(s);

    const matchDate = !dateFilter
      || formatDate(p.fecha) === format(dateFilter, "dd/MM/yyyy");

    const status = getEffectiveStatus(p);
    const isDelivered = normalizeText(status).includes("entregado");
    const isPending = status.toUpperCase() === "PENDIENTE" || status === "";
    const matchEstado = statusFilter === ""
      || (statusFilter === "ENTREGADO" && isDelivered)
      || (statusFilter === "EN_TRANSITO" && !isDelivered && !isPending)
      || (statusFilter === "PENDIENTE" && isPending);

    return matchSearch && matchDate && matchEstado;
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const deletePedido = async (id: string) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el pedido", variant: "destructive" });
      return;
    }
    setPedidos(prev => prev.filter(p => p.id !== id));
    toast({ title: "Pedido eliminado" });
  };

  const exportToExcel = () => {
    const data = filtered.map(p => ({
      "ID Pedido": p.id,
      "Nombre": p.nombre,
      "Email": p.email,
      "Población": p.poblacion,
      "Curso": p.curso,
      "Fecha Solicitud": formatDate(p.fecha),
      "Estado Envío": getEffectiveStatus(p),
      "Última Actualización": getLastStatusDate(p),
      "Expedición GLS": p.expedicion_gls ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `pedidos_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
    toast({ title: "Exportado", description: `${filtered.length} pedidos exportados a Excel` });
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Cargando pedidos...</p>
      </div>
    );
  }

  const STATUS_FILTERS = [
    { key: "" as const, label: "Todos", count: total },
    { key: "ENTREGADO" as const, label: "Entregados", count: entregados },
    { key: "EN_TRANSITO" as const, label: "En tránsito", count: enTransito },
    { key: "PENDIENTE" as const, label: "Pendientes", count: pendientes },
  ];

  return (
    <div className="space-y-5">

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total pedidos" value={total}
          colorClass="text-slate-700" bgClass="bg-slate-100"
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          label="Entregados" value={entregados} total={total}
          colorClass="text-emerald-700" bgClass="bg-emerald-100"
          icon={<CheckCircle2 className="h-4 w-4" />}
          active={statusFilter === "ENTREGADO"}
          onClick={() => setStatusFilter(statusFilter === "ENTREGADO" ? "" : "ENTREGADO")}
        />
        <MetricCard
          label="En tránsito" value={enTransito} total={total}
          colorClass="text-blue-700" bgClass="bg-blue-100"
          icon={<Truck className="h-4 w-4" />}
          active={statusFilter === "EN_TRANSITO"}
          onClick={() => setStatusFilter(statusFilter === "EN_TRANSITO" ? "" : "EN_TRANSITO")}
        />
        <MetricCard
          label="Pendientes" value={pendientes} total={total}
          colorClass="text-amber-700" bgClass="bg-amber-100"
          icon={<Clock className="h-4 w-4" />}
          active={statusFilter === "PENDIENTE"}
          onClick={() => setStatusFilter(statusFilter === "PENDIENTE" ? "" : "PENDIENTE")}
        />
      </div>

      {/* ── Filter bar ── */}
      <Card>
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ID o curso..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status pill filters */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    statusFilter === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {label}
                  <span className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                    statusFilter === key ? "bg-white/20" : "bg-muted"
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={dateFilter ? "default" : "outline"} size="sm" className="h-9 gap-1.5 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Fecha solicitud"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {dateFilter && (
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setDateFilter(undefined)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span> de {total} pedidos
              {lastUpdate && (
                <span className="ml-2 opacity-60">
                  · actualizado a las {format(lastUpdate, "HH:mm", { locale: es })}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportToExcel}>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Exportar Excel
              </Button>
              <Button
                variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => loadData(true)} disabled={refreshing}
                title="Actualizar datos"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4 text-xs font-semibold text-muted-foreground w-[150px]">ID Pedido</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Alumno</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground hidden md:table-cell">Curso</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground hidden lg:table-cell">Solicitud</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Estado del envío</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground hidden md:table-cell">Última actualización</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-25" />
                      <p className="text-sm">No hay pedidos que coincidan con los filtros</p>
                      {(searchTerm || statusFilter || dateFilter) && (
                        <Button
                          variant="link" size="sm" className="text-xs h-auto p-0"
                          onClick={() => { setSearchTerm(""); setStatusFilter(""); setDateFilter(undefined); }}
                        >
                          Limpiar todos los filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(pedido => {
                  const status = getEffectiveStatus(pedido);
                  const trackingUrl = getTrackingUrl(pedido);

                  return (
                    <TableRow key={pedido.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">

                      {/* ID */}
                      <TableCell className="pl-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{pedido.id}</span>
                      </TableCell>

                      {/* Alumno */}
                      <TableCell className="py-3">
                        <p className="font-medium text-sm leading-snug">{pedido.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{pedido.poblacion}</p>
                      </TableCell>

                      {/* Curso */}
                      <TableCell className="py-3 hidden md:table-cell max-w-[200px]">
                        <p className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-2">{pedido.curso}</p>
                      </TableCell>

                      {/* Fecha solicitud */}
                      <TableCell className="py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(pedido.fecha)}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-3">
                        <StatusBadge estado={status} />
                      </TableCell>

                      {/* Última actualización */}
                      <TableCell className="py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {getLastStatusDate(pedido)}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-0.5">
                          {trackingUrl && (
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                              title="Ver seguimiento GLS"
                              onClick={() => window.open(trackingUrl, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Eliminar pedido"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este pedido?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará el pedido <span className="font-semibold text-foreground">{pedido.id}</span> de{" "}
                                  <span className="font-semibold text-foreground">{pedido.nombre}</span>.
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deletePedido(pedido.id)}
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
