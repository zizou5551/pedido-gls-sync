import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw, CheckCircle2, Clock, Truck, AlertCircle,
  Package, MapPin, Inbox,
} from "lucide-react";

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

type StatusCategory = "entregado" | "transito" | "pendiente" | "incidencia";

function getCategory(estado: string): StatusCategory {
  const s = (estado ?? "").toUpperCase().trim();
  if (s.includes("ENTREGADO")) return "entregado";
  if (
    s === "EN REPARTO" || s === "EN DELEGACION DESTINO" ||
    s === "GRABADO" || s === "ALMACENADO" || s === "MANIFESTADA" ||
    s === "NUEVOS DATOS" || s === "RECEPCIONADO EN PS GLS"
  ) return "transito";
  if (s === "EN DEVOLUCION" || s === "AUSENTE" || s === "INCIDENCIA" ||
      s === "FALTA EXPEDICION COMPLETA") return "incidencia";
  return "pendiente";
}

const CATEGORY_STYLES: Record<StatusCategory, {
  badge: string;
  rowBorder: string;
  rowBg: string;
  icon: React.ReactNode;
  label: (e: string) => string;
}> = {
  entregado: {
    badge: "bg-red-100 text-red-700 border-red-300",
    rowBorder: "border-l-red-500",
    rowBg: "hover:bg-red-50/40",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: () => "Entregado",
  },
  transito: {
    badge: "bg-green-100 text-green-700 border-green-300",
    rowBorder: "border-l-green-500",
    rowBg: "hover:bg-green-50/40",
    icon: <Truck className="h-3.5 w-3.5" />,
    label: (e) => {
      const s = e.toUpperCase();
      if (s === "EN REPARTO") return "En Reparto";
      if (s === "EN DELEGACION DESTINO") return "En Delegación";
      if (s === "GRABADO") return "Grabado";
      if (s === "ALMACENADO") return "Almacenado";
      if (s === "MANIFESTADA") return "Manifestada";
      return e;
    },
  },
  pendiente: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
    rowBorder: "border-l-yellow-400",
    rowBg: "hover:bg-yellow-50/40",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: () => "Pendiente",
  },
  incidencia: {
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    rowBorder: "border-l-orange-500",
    rowBg: "hover:bg-orange-50/40",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: (e) => e || "Incidencia",
  },
};

function StatusBadge({ estado }: { estado: string }) {
  const cat = getCategory(estado);
  const s = CATEGORY_STYLES[cat];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
      {s.icon}
      {s.label(estado)}
    </span>
  );
}

function MetricCard({
  label, value, total, icon, badgeClass, borderClass, active, onClick,
}: {
  label: string; value: number; total?: number;
  icon: React.ReactNode; badgeClass: string; borderClass: string;
  active?: boolean; onClick?: () => void;
}) {
  const pct = total ? Math.round((value / total) * 100) : null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-white rounded-2xl border-l-4 p-5 shadow-sm transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        borderClass,
        active && "ring-2 ring-offset-1 ring-primary"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {pct !== null && (
            <p className="text-xs text-muted-foreground mt-1">{pct}% del total</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badgeClass}`}>
          {icon}
        </div>
      </div>
    </button>
  );
}

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

export const OrderStatus = () => {
  const [activeTab, setActiveTab] = useState<"pedidos" | "envios">("pedidos");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "entregado" | "transito" | "pendiente" | "incidencia">("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enviosGLS, setEnviosGLS] = useState<EnvioGLS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedPedidos, setSelectedPedidos] = useState<Set<string>>(new Set());
  const [selectedEnvios, setSelectedEnvios] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const envioMap = new Map<string, EnvioGLS>();
  for (const e of enviosGLS) {
    if (e.pedido_id) envioMap.set(e.pedido_id.trim(), e);
  }

  const loadData = useCallback(async (silent = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !user) {
        setPedidos([]);
        setEnviosGLS([]);
        setLastUpdate(null);
        return;
      }

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
      setSelectedPedidos(new Set());
      setSelectedEnvios(new Set());
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
  }, [authLoading, user, loadData]);

  useEffect(() => {
    if (authLoading || !user) return;
    const t = setInterval(() => loadData(true), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [authLoading, user, loadData]);

  // Derived helpers
  const getEnvio = (p: Pedido) => {
    const id = p.id.trim();
    return envioMap.get(id) ?? envioMap.get(id.replace("=", "")) ?? envioMap.get("=" + id);
  };
  const getEffectiveStatus = (p: Pedido) => {
    const e = getEnvio(p);
    return e?.estado || p.estado_envio || p.estado || "PENDIENTE";
  };
  const getTrackingUrl = (p: Pedido) => {
    const e = getEnvio(p);
    return e?.tracking || p.tracking_gls || null;
  };
  const getLastStatusDate = (p: Pedido) => {
    const e = getEnvio(p);
    return formatDateTime(e?.fecha_actualizacion || p.fecha);
  };

  // Metrics
  const total = pedidos.length;
  const counts = { entregado: 0, transito: 0, pendiente: 0, incidencia: 0 };
  for (const p of pedidos) counts[getCategory(getEffectiveStatus(p))]++;

  // Filter pedidos
  const filteredPedidos = pedidos.filter(p => {
    const s = normalizeText(searchTerm);
    const matchSearch = !s
      || normalizeText(p.id).includes(s)
      || normalizeText(p.nombre).includes(s)
      || normalizeText(p.curso).includes(s)
      || normalizeText(p.email).includes(s)
      || normalizeText(p.poblacion).includes(s);

    const matchDate = !dateFilter
      || formatDate(p.fecha) === format(dateFilter, "dd/MM/yyyy");

    const matchMonth = !monthFilter || (() => {
      try {
        const d = new Date(p.fecha);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthFilter;
      } catch { return false; }
    })();

    const cat = getCategory(getEffectiveStatus(p));
    const matchEstado = !statusFilter || cat === statusFilter;

    return matchSearch && matchDate && matchMonth && matchEstado;
  });

  // Filter envios
  const filteredEnvios = enviosGLS.filter(e => {
    const s = normalizeText(searchTerm);
    const matchSearch = !s
      || normalizeText(e.expedicion).includes(s)
      || normalizeText(e.destinatario).includes(s)
      || normalizeText(e.localidad).includes(s)
      || normalizeText(e.pedido_id ?? "").includes(s);

    const matchDate = !dateFilter
      || formatDate(e.fecha) === format(dateFilter, "dd/MM/yyyy");

    const matchMonth = !monthFilter || (() => {
      try {
        const d = new Date(e.fecha);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthFilter;
      } catch { return false; }
    })();

    const cat = getCategory(e.estado);
    const matchEstado = !statusFilter || cat === statusFilter;

    return matchSearch && matchDate && matchMonth && matchEstado;
  });

  // Selection helpers - Pedidos
  const allPedidosSelected = filteredPedidos.length > 0 && filteredPedidos.every(p => selectedPedidos.has(p.id));
  const somePedidosSelected = selectedPedidos.size > 0;

  const toggleSelectAllPedidos = () => {
    if (allPedidosSelected) {
      setSelectedPedidos(new Set());
    } else {
      setSelectedPedidos(new Set(filteredPedidos.map(p => p.id)));
    }
  };

  const togglePedido = (id: string) => {
    setSelectedPedidos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Selection helpers - Envios
  const allEnviosSelected = filteredEnvios.length > 0 && filteredEnvios.every(e => selectedEnvios.has(e.expedicion));
  const someEnviosSelected = selectedEnvios.size > 0;

  const toggleSelectAllEnvios = () => {
    if (allEnviosSelected) {
      setSelectedEnvios(new Set());
    } else {
      setSelectedEnvios(new Set(filteredEnvios.map(e => e.expedicion)));
    }
  };

  const toggleEnvio = (expedicion: string) => {
    setSelectedEnvios(prev => {
      const next = new Set(prev);
      next.has(expedicion) ? next.delete(expedicion) : next.add(expedicion);
      return next;
    });
  };

  // Actions
  const deletePedido = async (id: string) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el pedido", variant: "destructive" });
      return;
    }
    setPedidos(prev => prev.filter(p => p.id !== id));
    setSelectedPedidos(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast({ title: "Pedido eliminado" });
  };

  const bulkDeletePedidos = async () => {
    if (selectedPedidos.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedPedidos);
      const { error } = await supabase.from("pedidos").delete().in("id", ids);
      if (error) throw error;
      setPedidos(prev => prev.filter(p => !selectedPedidos.has(p.id)));
      toast({ title: "Pedidos eliminados", description: `${ids.length} pedidos eliminados correctamente` });
      setSelectedPedidos(new Set());
    } catch {
      toast({ title: "Error", description: "No se pudieron eliminar los pedidos", variant: "destructive" });
    } finally {
      setBulkDeleting(false);
    }
  };

  const deleteEnvio = async (expedicion: string) => {
    const { error } = await supabase.from("envios_gls").delete().eq("expedicion", expedicion);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el envío", variant: "destructive" });
      return;
    }
    setEnviosGLS(prev => prev.filter(e => e.expedicion !== expedicion));
    setSelectedEnvios(prev => { const n = new Set(prev); n.delete(expedicion); return n; });
    toast({ title: "Envío eliminado" });
  };

  const bulkDeleteEnvios = async () => {
    if (selectedEnvios.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedEnvios);
      const { error } = await supabase.from("envios_gls").delete().in("expedicion", ids);
      if (error) throw error;
      setEnviosGLS(prev => prev.filter(e => !selectedEnvios.has(e.expedicion)));
      toast({ title: "Envíos eliminados", description: `${ids.length} envíos eliminados correctamente` });
      setSelectedEnvios(new Set());
    } catch {
      toast({ title: "Error", description: "No se pudieron eliminar los envíos", variant: "destructive" });
    } finally {
      setBulkDeleting(false);
    }
  };

  const exportToExcel = () => {
    if (activeTab === "pedidos") {
      const data = filteredPedidos.map(p => ({
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
      toast({ title: "Exportado", description: `${filteredPedidos.length} pedidos exportados` });
    } else {
      const data = filteredEnvios.map(e => ({
        "Expedición": e.expedicion,
        "Destinatario": e.destinatario,
        "Dirección": e.direccion,
        "Localidad": e.localidad,
        "Estado": e.estado,
        "Fecha": formatDate(e.fecha),
        "Pedido ID": e.pedido_id ?? "",
        "Tracking": e.tracking ?? "",
        "Observación": e.observacion ?? "",
        "Última Actualización": formatDateTime(e.fecha_actualizacion),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Envíos");
      XLSX.writeFile(wb, `envios_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
      toast({ title: "Exportado", description: `${filteredEnvios.length} envíos exportados` });
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando datos...</p>
      </div>
    );
  }

  const METRIC_CARDS = [
    {
      key: "" as const,
      label: "Total Pedidos",
      value: total,
      icon: <Package className="h-6 w-6 text-slate-600" />,
      badgeClass: "bg-slate-100",
      borderClass: "border-l-slate-400",
    },
    {
      key: "entregado" as const,
      label: "Entregados",
      value: counts.entregado,
      icon: <CheckCircle2 className="h-6 w-6 text-red-600" />,
      badgeClass: "bg-red-100",
      borderClass: "border-l-red-500",
    },
    {
      key: "transito" as const,
      label: "En Tránsito",
      value: counts.transito,
      icon: <Truck className="h-6 w-6 text-green-600" />,
      badgeClass: "bg-green-100",
      borderClass: "border-l-green-500",
    },
    {
      key: "pendiente" as const,
      label: "Pendientes",
      value: counts.pendiente,
      icon: <Clock className="h-6 w-6 text-yellow-600" />,
      badgeClass: "bg-yellow-100",
      borderClass: "border-l-yellow-400",
    },
  ];

  const currentSelected = activeTab === "pedidos" ? selectedPedidos : selectedEnvios;

  return (
    <div className="space-y-6">

      {/* ── Tab switcher ── */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "pedidos" ? "default" : "outline"}
          onClick={() => { setActiveTab("pedidos"); setSelectedPedidos(new Set()); setSelectedEnvios(new Set()); }}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Pedidos
        </Button>
        <Button
          variant={activeTab === "envios" ? "default" : "outline"}
          onClick={() => { setActiveTab("envios"); setSelectedPedidos(new Set()); setSelectedEnvios(new Set()); }}
          className="gap-2"
        >
          <Inbox className="h-4 w-4" />
          Entrada de Pedidos
        </Button>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map(card => (
          <MetricCard
            key={card.key}
            label={card.label}
            value={card.value}
            total={card.key !== "" ? total : undefined}
            icon={card.icon}
            badgeClass={card.badgeClass}
            borderClass={card.borderClass}
            active={statusFilter === card.key}
            onClick={() => setStatusFilter(statusFilter === card.key ? "" : card.key)}
          />
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          Entregado
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          En tránsito
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          Pendiente
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
          Incidencia
        </div>
      </div>

      {/* ── Filter bar ── */}
      <Card className="shadow-sm">
        <CardContent className="py-4 px-5 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "pedidos" ? "Buscar por nombre, ID, curso o población..." : "Buscar por expedición, destinatario o localidad..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-muted/30"
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "" as const, label: "Todos", count: activeTab === "pedidos" ? total : enviosGLS.length },
                { key: "entregado" as const, label: "Entregados", count: counts.entregado, color: "text-red-600 border-red-300 bg-red-50" },
                { key: "transito" as const, label: "En tránsito", count: counts.transito, color: "text-green-600 border-green-300 bg-green-50" },
                { key: "pendiente" as const, label: "Pendientes", count: counts.pendiente, color: "text-yellow-600 border-yellow-300 bg-yellow-50" },
                { key: "incidencia" as const, label: "Incidencias", count: counts.incidencia, color: "text-orange-600 border-orange-300 bg-orange-50" },
              ].map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    statusFilter === key
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : color
                        ? `${color} hover:opacity-80`
                        : "bg-white text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {label}
                  <span className={cn("ml-1.5 font-bold", statusFilter === key ? "opacity-80" : "")}>
                    ({count})
                  </span>
                </button>
              ))}
            </div>

            {/* Date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={dateFilter ? "default" : "outline"} size="sm" className="h-10 gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Filtrar por fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {dateFilter && (
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => setDateFilter(undefined)}>
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Month filter */}
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className={cn(
                "h-10 rounded-md border px-3 text-sm bg-background",
                monthFilter ? "border-primary text-primary font-semibold" : "border-input text-muted-foreground"
              )}
            >
              <option value="">Todos los meses</option>
              {(() => {
                const months = new Set<string>();
                const source = activeTab === "pedidos" ? pedidos : enviosGLS;
                for (const item of source) {
                  try {
                    const d = new Date("fecha" in item ? item.fecha : "");
                    if (!isNaN(d.getTime())) {
                      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                    }
                  } catch { /* skip */ }
                }
                return Array.from(months).sort().reverse().map(m => {
                  const [y, mo] = m.split("-");
                  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                  return <option key={m} value={m}>{monthNames[parseInt(mo) - 1]} {y}</option>;
                });
              })()}
            </select>
            {monthFilter && (
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => setMonthFilter("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status row */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-semibold text-foreground">{activeTab === "pedidos" ? filteredPedidos.length : filteredEnvios.length}</span>
                {" "}de{" "}
                <span className="font-semibold text-foreground">{activeTab === "pedidos" ? total : enviosGLS.length}</span>
                {" "}{activeTab === "pedidos" ? "pedidos" : "envíos"}
                {lastUpdate && (
                  <span className="ml-2 text-xs opacity-60">
                    · Última actualización: {format(lastUpdate, "HH:mm", { locale: es })}
                  </span>
                )}
              </p>
              {currentSelected.size > 0 && (
                <span className="text-sm font-semibold text-primary">
                  ({currentSelected.size} seleccionados)
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Bulk delete button */}
              {currentSelected.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2" disabled={bulkDeleting}>
                      <Trash2 className="h-4 w-4" />
                      Eliminar {currentSelected.size} {activeTab === "pedidos" ? "pedidos" : "envíos"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar {currentSelected.size} {activeTab === "pedidos" ? "pedidos" : "envíos"}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminarán <span className="font-semibold text-foreground">{currentSelected.size}</span> {activeTab === "pedidos" ? "pedidos" : "envíos"} seleccionados.
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={activeTab === "pedidos" ? bulkDeletePedidos : bulkDeleteEnvios}
                      >
                        Sí, eliminar todos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button variant="outline" size="sm" className="gap-2" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                variant="outline" size="sm" className="gap-2"
                onClick={() => loadData(true)} disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Pedidos Table ── */}
      {activeTab === "pedidos" && (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-2 border-slate-200">
                  <TableHead className="pl-3 py-3 w-[50px]">
                    <Checkbox
                      checked={allPedidosSelected}
                      onCheckedChange={toggleSelectAllPedidos}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide w-[155px]">
                    ID Pedido
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Alumno
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden md:table-cell">
                    Curso
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden lg:table-cell">
                    Fecha
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Estado
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden md:table-cell">
                    Actualización
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide text-center">
                    Seguimiento
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="font-medium">No se encontraron pedidos</p>
                        <p className="text-sm opacity-70">Prueba a ajustar los filtros de búsqueda</p>
                        {(searchTerm || statusFilter || dateFilter) && (
                          <Button
                            variant="outline" size="sm"
                            onClick={() => { setSearchTerm(""); setStatusFilter(""); setDateFilter(undefined); }}
                          >
                            Limpiar todos los filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPedidos.map(pedido => {
                    const status = getEffectiveStatus(pedido);
                    const cat = getCategory(status);
                    const styles = CATEGORY_STYLES[cat];
                    const trackingUrl = getTrackingUrl(pedido);

                    return (
                      <TableRow
                        key={pedido.id}
                        className={cn(
                          "border-l-4 transition-colors",
                          styles.rowBorder,
                          styles.rowBg,
                          selectedPedidos.has(pedido.id) && "bg-primary/5"
                        )}
                      >
                        <TableCell className="pl-3 py-4">
                          <Checkbox
                            checked={selectedPedidos.has(pedido.id)}
                            onCheckedChange={() => togglePedido(pedido.id)}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {pedido.id}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="font-semibold text-sm text-slate-800">{pedido.nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{pedido.poblacion}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell max-w-[200px]">
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{pedido.curso}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell">
                          <p className="text-xs text-slate-500">{formatDate(pedido.fecha)}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge estado={status} />
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell">
                          <p className="text-xs text-slate-500">{getLastStatusDate(pedido)}</p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {trackingUrl ? (
                            <Button
                              size="sm"
                              className="gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold px-3"
                              onClick={() => window.open(trackingUrl, "_blank")}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Ver envío
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin tracking</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 pr-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este pedido?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará el pedido{" "}
                                  <span className="font-semibold text-foreground">{pedido.id}</span>{" "}
                                  de <span className="font-semibold text-foreground">{pedido.nombre}</span>.
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
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Envíos (Entrada de Pedidos) Table ── */}
      {activeTab === "envios" && (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-2 border-slate-200">
                  <TableHead className="pl-3 py-3 w-[50px]">
                    <Checkbox
                      checked={allEnviosSelected}
                      onCheckedChange={toggleSelectAllEnvios}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Expedición
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Destinatario
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden md:table-cell">
                    Dirección
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden md:table-cell">
                    Localidad
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden lg:table-cell">
                    Fecha
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Estado
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hidden lg:table-cell">
                    Observación
                  </TableHead>
                  <TableHead className="py-3 text-xs font-bold text-slate-600 uppercase tracking-wide text-center">
                    Seguimiento
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnvios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Inbox className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="font-medium">No se encontraron envíos</p>
                        <p className="text-sm opacity-70">Prueba a ajustar los filtros de búsqueda</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnvios.map(envio => {
                    const cat = getCategory(envio.estado);
                    const styles = CATEGORY_STYLES[cat];

                    return (
                      <TableRow
                        key={envio.expedicion}
                        className={cn(
                          "border-l-4 transition-colors",
                          styles.rowBorder,
                          styles.rowBg,
                          selectedEnvios.has(envio.expedicion) && "bg-primary/5"
                        )}
                      >
                        <TableCell className="pl-3 py-4">
                          <Checkbox
                            checked={selectedEnvios.has(envio.expedicion)}
                            onCheckedChange={() => toggleEnvio(envio.expedicion)}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {envio.expedicion}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="font-semibold text-sm text-slate-800">{envio.destinatario}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell max-w-[200px]">
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{envio.direccion}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell">
                          <p className="text-xs text-slate-500">{envio.localidad}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell">
                          <p className="text-xs text-slate-500">{formatDate(envio.fecha)}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge estado={envio.estado} />
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell max-w-[200px]">
                          <p className="text-xs text-slate-500 line-clamp-2">{envio.observacion || "—"}</p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {envio.tracking ? (
                            <Button
                              size="sm"
                              className="gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold px-3"
                              onClick={() => window.open(envio.tracking!, "_blank")}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Ver envío
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin tracking</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 pr-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este envío?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará el envío con expedición{" "}
                                  <span className="font-semibold text-foreground">{envio.expedicion}</span>{" "}
                                  de <span className="font-semibold text-foreground">{envio.destinatario}</span>.
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteEnvio(envio.expedicion)}
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};
