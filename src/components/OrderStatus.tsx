import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Eye, Search, Loader2, Filter, X, Trash2, CalendarIcon, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

// Función para normalizar texto (sin tildes, minúsculas)
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Tipos para TypeScript
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
  bultos?: number | null;
  peso?: number | null;
  cp_origen?: string | null;
  cp_destino?: string | null;
  observacion?: string | null;
  fecha_actualizacion?: string | null;
}

const getStatusColor = (estado: string) => {
  switch (estado.toUpperCase()) {
    case "ENTREGADO":
      return "bg-success text-success-foreground";
    case "EN REPARTO":
    case "EN DELEGACION DESTINO":
    case "PROCESANDO":
    case "GRABADO":
    case "ALMACENADO":
    case "RECEPCIONADO EN PS GLS":
    case "NUEVOS DATOS":
      return "bg-info text-info-foreground";
    case "PENDIENTE":
    case "FALTA EXPEDICION COMPLETA":
    case "FACILITADA SOLUCION POR EL CLIENTE":
    case "INCIDENCIA":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const OrderStatus = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enviosGLS, setEnviosGLS] = useState<EnvioGLS[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [selectedEnvios, setSelectedEnvios] = useState<string[]>([]);
  const { toast } = useToast();

  const deletePedido = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Pedido eliminado",
        description: "El pedido se ha eliminado correctamente",
      });
      
      // Actualizar los datos
      setPedidos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive",
      });
    }
  };

  const deleteEnvio = async (expedicion: string) => {
    try {
      const { error } = await supabase
        .from('envios_gls')
        .delete()
        .eq('expedicion', expedicion);
      
      if (error) throw error;
      
      toast({
        title: "Envío eliminado",
        description: "El envío se ha eliminado correctamente",
      });
      
      // Actualizar los datos
      setEnviosGLS(prev => prev.filter(e => e.expedicion !== expedicion));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el envío",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedPedidos = async () => {
    if (selectedPedidos.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .in('id', selectedPedidos);
      
      if (error) throw error;
      
      toast({
        title: "Pedidos eliminados",
        description: `Se han eliminado ${selectedPedidos.length} pedidos correctamente`,
      });
      
      setPedidos(prev => prev.filter(p => !selectedPedidos.includes(p.id)));
      setSelectedPedidos([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los pedidos",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedEnvios = async () => {
    if (selectedEnvios.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('envios_gls')
        .delete()
        .in('expedicion', selectedEnvios);
      
      if (error) throw error;
      
      toast({
        title: "Envíos eliminados",
        description: `Se han eliminado ${selectedEnvios.length} envíos correctamente`,
      });
      
      setEnviosGLS(prev => prev.filter(e => !selectedEnvios.includes(e.expedicion)));
      setSelectedEnvios([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los envíos",
        variant: "destructive",
      });
    }
  };

  const toggleSelectPedido = (id: string) => {
    setSelectedPedidos(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const toggleSelectEnvio = (expedicion: string) => {
    setSelectedEnvios(prev => 
      prev.includes(expedicion) 
        ? prev.filter(e => e !== expedicion)
        : [...prev, expedicion]
    );
  };

  const toggleSelectAllPedidos = () => {
    if (selectedPedidos.length === filteredPedidos.length) {
      setSelectedPedidos([]);
    } else {
      setSelectedPedidos(filteredPedidos.map(p => p.id));
    }
  };

  const toggleSelectAllEnvios = () => {
    if (selectedEnvios.length === filteredEnvios.length) {
      setSelectedEnvios([]);
    } else {
      setSelectedEnvios(filteredEnvios.map(e => e.expedicion));
    }
  };

  const exportPedidosToExcel = () => {
    const data = filteredPedidos.map(pedido => ({
      'ID Pedido': pedido.id,
      'Nombre': pedido.nombre,
      'Email': pedido.email,
      'Dirección': pedido.direccion,
      'Población': pedido.poblacion,
      'Curso': pedido.curso,
      'Fecha': pedido.fecha,
      'Estado': pedido.estado,
      'Estado Envío': pedido.estado_envio || '',
      'Expedición GLS': pedido.expedicion_gls || '',
      'Tracking GLS': pedido.tracking_gls || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    
    const fileName = `pedidos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Exportación exitosa",
      description: `Se han exportado ${filteredPedidos.length} pedidos a Excel`,
    });
  };

  const exportEnviosToExcel = () => {
    const data = filteredEnvios.map(envio => ({
      'Expedición': envio.expedicion,
      'Destinatario': envio.destinatario,
      'Dirección': envio.direccion,
      'Localidad': envio.localidad,
      'ID Pedido': envio.pedido_id || '',
      'Fecha': envio.fecha,
      'Estado': envio.estado,
      'Tracking': envio.tracking || '',
      'Bultos': envio.bultos || '',
      'Peso (kg)': envio.peso || '',
      'CP Origen': envio.cp_origen || '',
      'CP Destino': envio.cp_destino || '',
      'Observación': envio.observacion || '',
      'Fecha Actualización': envio.fecha_actualizacion || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Envíos GLS');
    
    const fileName = `envios_gls_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Exportación exitosa",
      description: `Se han exportado ${filteredEnvios.length} envíos a Excel`,
    });
  };

  // Cargar datos desde Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar TODOS los pedidos (sin límite de 1000)
        let allPedidos: Pedido[] = [];
        let fromPedidos = 0;
        const chunkSize = 1000;
        let hasMorePedidos = true;

        while (hasMorePedidos) {
          const { data: pedidosChunk, error: pedidosError } = await supabase
            .from('pedidos')
            .select('*')
            .order('fecha', { ascending: false })
            .range(fromPedidos, fromPedidos + chunkSize - 1);

          if (pedidosError) throw pedidosError;
          
          if (pedidosChunk && pedidosChunk.length > 0) {
            allPedidos = [...allPedidos, ...pedidosChunk];
            fromPedidos += chunkSize;
            hasMorePedidos = pedidosChunk.length === chunkSize;
          } else {
            hasMorePedidos = false;
          }
        }

        // Cargar TODOS los envíos GLS (sin límite de 1000)
        let allEnvios: EnvioGLS[] = [];
        let fromEnvios = 0;
        let hasMoreEnvios = true;

        while (hasMoreEnvios) {
          const { data: enviosChunk, error: enviosError } = await supabase
            .from('envios_gls')
            .select('*')
            .order('fecha', { ascending: false })
            .range(fromEnvios, fromEnvios + chunkSize - 1);

          if (enviosError) throw enviosError;
          
          if (enviosChunk && enviosChunk.length > 0) {
            allEnvios = [...allEnvios, ...enviosChunk];
            fromEnvios += chunkSize;
            hasMoreEnvios = enviosChunk.length === chunkSize;
          } else {
            hasMoreEnvios = false;
          }
        }

        console.log("🔍 DEBUG: Datos cargados:", {
          totalPedidos: allPedidos.length,
          totalEnvios: allEnvios.length,
          enviosConObservacion: allEnvios.filter(e => e.observacion)?.length || 0,
          primerasObservaciones: allEnvios.slice(0, 5)?.map(e => e.observacion) || []
        });

        setPedidos(allPedidos);
        setEnviosGLS(allEnvios);
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredPedidos = pedidos.filter(pedido => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    const matchesSearch = normalizeText(pedido.id).includes(normalizedSearchTerm) ||
                         normalizeText(pedido.nombre).includes(normalizedSearchTerm) ||
                         normalizeText(pedido.curso).includes(normalizedSearchTerm);
    
    // Filtrar por fecha (comparando solo la fecha, sin tiempo)
    const matchesDate = (() => {
      if (!dateFilter) return true;
      
      const filterDateStr = format(dateFilter, 'yyyy-MM-dd');
      const pedidoDate = new Date(pedido.fecha);
      const pedidoDateStr = format(pedidoDate, 'yyyy-MM-dd');
      
      return pedidoDateStr === filterDateStr;
    })();
    
    // Filtrar por estado - revisar tanto el estado del pedido como del envío
    const matchesEstado = (() => {
      if (selectedEstado === "") return true;
      
      const esEntregadoPedido = pedido.estado_envio?.toUpperCase().includes('ENTREGADO') || 
                               pedido.estado?.toUpperCase().includes('ENTREGADO');
      
      const esEntregadoEnvio = enviosGLS.some(envio => 
        (envio.pedido_id === pedido.id || 
         envio.pedido_id === pedido.id.replace('=', '') ||
         ('=' + envio.pedido_id) === pedido.id) && 
        normalizeText(envio.estado).includes("entregado")
      );
      
      const esEntregado = esEntregadoPedido || esEntregadoEnvio;
      
      // Debug logging para ver qué está pasando
      if (selectedEstado === "ENTREGADO") {
        console.log(`🔍 FILTRO ENTREGADOS - Pedido ${pedido.id}:`, {
          esEntregadoPedido,
          esEntregadoEnvio,
          esEntregado,
          estado_pedido: pedido.estado,
          estado_envio: pedido.estado_envio,
          enviosRelacionados: enviosGLS.filter(e => 
            e.pedido_id === pedido.id || 
            e.pedido_id === pedido.id.replace('=', '') ||
            ('=' + e.pedido_id) === pedido.id
          ).map(e => ({ estado: e.estado, expedicion: e.expedicion })),
          resultadoFiltro: selectedEstado === "ENTREGADO" ? esEntregado : !esEntregado
        });
      }
      
      // CORRECCIÓN: Retornar correctamente según el filtro seleccionado
      if (selectedEstado === "ENTREGADO") {
        return esEntregado; // Solo mostrar si está entregado
      } else if (selectedEstado === "PENDIENTE") {
        return !esEntregado; // Solo mostrar si NO está entregado
      }
      
      return true;
    })();
    
    return matchesSearch && matchesDate && matchesEstado;
  });

  const filteredEnvios = enviosGLS.filter(envio => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    const matchesSearch = normalizeText(envio.expedicion).includes(normalizedSearchTerm) ||
                         normalizeText(envio.destinatario).includes(normalizedSearchTerm) ||
                         (envio.pedido_id && normalizeText(envio.pedido_id).includes(normalizedSearchTerm)) ||
                         (envio.observacion && normalizeText(envio.observacion).includes(normalizedSearchTerm));
    
    // Filtro por estado
    const matchesEstado = selectedEstado === "" ||
                         ((selectedEstado === "ENTREGADO" && normalizeText(envio.estado).includes("entregado")) ||
                          (selectedEstado === "PENDIENTE" && !normalizeText(envio.estado).includes("entregado")));
    
    return matchesSearch && matchesEstado;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Pedidos AMIR
          </h1>
          <p className="text-muted-foreground">
            Consulta el estado de tus pedidos y envíos en tiempo real
          </p>
        </header>

        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, nombre, curso, expedición, observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por Estado:</span>
            <Button
              variant={selectedEstado === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedEstado("")}
              className="text-xs"
            >
              Todos los estados
            </Button>
            <Button
              variant={selectedEstado === "ENTREGADO" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedEstado("ENTREGADO")}
              className="text-xs"
            >
              ENTREGADOS
              {selectedEstado === "ENTREGADO" && (
                <X className="h-3 w-3 ml-1" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEstado("");
                }} />
              )}
            </Button>
            <Button
              variant={selectedEstado === "PENDIENTE" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedEstado("PENDIENTE")}
              className="text-xs"
            >
              PENDIENTES
              {selectedEstado === "PENDIENTE" && (
                <X className="h-3 w-3 ml-1" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEstado("");
                }} />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por Fecha:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs justify-start",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dateFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateFilter(undefined)}
                className="text-xs"
              >
                <X className="h-3 w-3" />
                Limpiar fecha
              </Button>
            )}
          </div>
          
          {(selectedEstado || dateFilter) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              {selectedEstado && (
                <Badge variant="secondary" className="text-xs">
                  Estado: {selectedEstado}
                </Badge>
              )}
              {dateFilter && (
                <Badge variant="secondary" className="text-xs">
                  Fecha: {format(dateFilter, "dd/MM/yyyy", { locale: es })}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="pedidos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pedidos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Estado de Pedidos ({filteredPedidos.length})
            </TabsTrigger>
            <TabsTrigger value="envios" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Envíos GLS ({filteredEnvios.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="mt-6">
            {filteredPedidos.length > 0 && (
              <div className="mb-4 flex items-center gap-4 p-4 bg-card rounded-lg border flex-wrap">
                <Checkbox
                  checked={selectedPedidos.length === filteredPedidos.length}
                  onCheckedChange={toggleSelectAllPedidos}
                  className="mr-2"
                />
                <span className="text-sm font-medium">
                  Seleccionar todos ({selectedPedidos.length} de {filteredPedidos.length})
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPedidosToExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar a Excel
                  </Button>
                  {selectedPedidos.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedPedidos}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar seleccionados ({selectedPedidos.length})
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="grid gap-1">
              {filteredPedidos.map((pedido) => {
                // Verificar si está entregado tanto en el pedido como en los envíos relacionados
                const esEntregadoPedido = pedido.estado_envio?.toUpperCase().includes('ENTREGADO') || 
                                         pedido.estado?.toUpperCase().includes('ENTREGADO');
                
                const esEntregadoEnvio = enviosGLS.some(envio => 
                  (envio.pedido_id === pedido.id || 
                   envio.pedido_id === pedido.id.replace('=', '') ||
                   ('=' + envio.pedido_id) === pedido.id) && 
                  normalizeText(envio.estado).includes("entregado")
                );
                
                const esEntregado = esEntregadoPedido || esEntregadoEnvio;
                const esPendiente = !esEntregado;
                const bgClass = esEntregado ? 'bg-green-600 text-white' : esPendiente ? 'bg-red-600 text-white' : 'bg-card/50';
                
                return (
                <Card key={pedido.id} className={`w-full py-2 ${bgClass} hover:opacity-90 transition-all`}>
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          checked={selectedPedidos.includes(pedido.id)}
                          onCheckedChange={() => toggleSelectPedido(pedido.id)}
                        />
                        <CardTitle className="text-sm text-primary flex-1 mr-2 break-words">
                          {pedido.id}
                        </CardTitle>
                      </div>
                      <Badge className={`${getStatusColor(pedido.estado_envio || pedido.estado)} text-xs py-0 px-2 h-5`}>
                        {pedido.estado_envio || pedido.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                   <CardContent className="py-2 px-3">
                    <div className="grid md:grid-cols-4 gap-2 text-xs">
                       <div>
                      <p className="font-medium break-words">
                        {pedido.nombre}
                      </p>
                      <p className="break-words opacity-80">
                        {pedido.poblacion}
                      </p>
                       </div>
                       <div>
                      <p className="break-words opacity-80">
                        {pedido.email}
                      </p>
                      <p className="opacity-80">
                        {pedido.fecha}
                      </p>
                       </div>
                       <div className="hidden md:block">
                      <p className="break-words opacity-80">
                        {pedido.curso}
                      </p>
                         {pedido.estado_envio && (
                           <Badge className={`${getStatusColor(pedido.estado_envio)} text-xs mt-1`}>
                             {pedido.estado_envio}
                           </Badge>
                         )}
                      </div>
                       <div className="flex flex-col items-end gap-1">
                         {pedido.expedicion_gls && (
                        <p className="text-xs opacity-80">
                          Exp: {pedido.expedicion_gls}
                        </p>
                         )}
                         <div className="flex gap-1">
                           {pedido.tracking_gls && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={`h-6 px-2 text-xs ${(esEntregado || esPendiente) ? 'text-black border-black hover:bg-black hover:text-white' : ''}`}
                                onClick={() => window.open(pedido.tracking_gls!, '_blank')}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver GLS
                             </Button>
                           )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`h-6 px-2 text-xs ${(esEntregado || esPendiente) ? 'text-black border-black hover:bg-black hover:text-white' : 'text-destructive hover:text-destructive'}`}
                              onClick={() => deletePedido(pedido.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                         </div>
                       </div>
                    </div>
                  </CardContent>
                  </Card>
                 );
               })}
            </div>
          </TabsContent>

          <TabsContent value="envios" className="mt-6">
            {filteredEnvios.length > 0 && (
              <div className="mb-4 flex items-center gap-4 p-4 bg-card rounded-lg border flex-wrap">
                <Checkbox
                  checked={selectedEnvios.length === filteredEnvios.length}
                  onCheckedChange={toggleSelectAllEnvios}
                  className="mr-2"
                />
                <span className="text-sm font-medium">
                  Seleccionar todos ({selectedEnvios.length} de {filteredEnvios.length})
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportEnviosToExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar a Excel
                  </Button>
                  {selectedEnvios.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedEnvios}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar seleccionados ({selectedEnvios.length})
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="grid gap-1">
              {filteredEnvios.map((envio) => (
                <Card key={envio.expedicion} className="w-full py-2 bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          checked={selectedEnvios.includes(envio.expedicion)}
                          onCheckedChange={() => toggleSelectEnvio(envio.expedicion)}
                        />
                        <CardTitle className="text-sm text-primary flex-1 mr-2 break-words">
                          {envio.expedicion}
                        </CardTitle>
                      </div>
                      <Badge className={`${getStatusColor(envio.estado)} text-xs py-0 px-2 h-5`}>
                        {envio.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                      <div className="grid md:grid-cols-5 gap-2 text-xs items-start">
                        <div>
                          <p className="font-medium text-foreground break-words">
                            {envio.destinatario}
                          </p>
                          <p className="text-muted-foreground break-words">
                            {envio.localidad}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground break-words">
                            {envio.pedido_id}
                          </p>
                          <p className="text-muted-foreground">
                            {envio.fecha}
                          </p>
                        </div>
                       <div className="hidden md:block">
                         <div className="space-y-1">
                           {envio.bultos && (
                             <p className="text-muted-foreground text-xs">
                               Bultos: {envio.bultos}
                             </p>
                           )}
                           {envio.peso && (
                             <p className="text-muted-foreground text-xs">
                               Peso: {envio.peso} kg
                             </p>
                           )}
                           {envio.cp_origen && (
                             <p className="text-muted-foreground text-xs">
                               CP Origen: {envio.cp_origen}
                             </p>
                           )}
                           {envio.cp_destino && (
                             <p className="text-muted-foreground text-xs">
                               CP Destino: {envio.cp_destino}
                             </p>
                           )}
                         </div>
                       </div>
                         <div className="hidden md:block">
                           <p className="text-muted-foreground break-words text-xs">
                             Exp: {envio.expedicion}
                           </p>
                           {envio.observacion && (
                             <p className="text-muted-foreground break-words text-xs leading-relaxed">
                               {envio.observacion}
                             </p>
                           )}
                         </div>
                       <div className="flex gap-1 justify-end">
                         {envio.tracking && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-6 px-2 text-xs"
                             onClick={() => window.open(envio.tracking!, '_blank')}
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             Ver
                           </Button>
                         )}
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                           onClick={() => deleteEnvio(envio.expedicion)}
                         >
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};