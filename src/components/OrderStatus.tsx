import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Eye, Search, Loader2, Filter, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedComunidad, setSelectedComunidad] = useState<string>("");
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>("");
  const [selectedModalidad, setSelectedModalidad] = useState<string>("");
  const [comunidades, setComunidades] = useState<string[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enviosGLS, setEnviosGLS] = useState<EnvioGLS[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Cargar datos desde Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar pedidos
        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('*')
          .order('fecha', { ascending: false });

        if (pedidosError) throw pedidosError;

        // Cargar envíos GLS
        const { data: enviosData, error: enviosError } = await supabase
          .from('envios_gls')
          .select('*')
          .order('fecha', { ascending: false });

        if (enviosError) throw enviosError;

        // Extraer filtros inteligentes basados en patrones de observación
        const comunidadesOPE = [...new Set(
          enviosData?.filter(envio => envio.observacion)
                     .map(envio => {
                       const obs = envio.observacion!;
                       if (obs.includes('OPE Extremadura')) return 'OPE Extremadura';
                       if (obs.includes('OPE CANARIAS')) return 'OPE CANARIAS';
                       if (obs.includes('OPE Aragón')) return 'OPE Aragón';
                       if (obs.includes('OPE CATALUÑA')) return 'OPE CATALUÑA';
                       if (obs.includes('OPE SESCAM')) return 'OPE SESCAM';
                       if (obs.includes('OPE SERMAS')) return 'OPE SERMAS';
                       if (obs.includes('OPE GALICIA')) return 'OPE GALICIA';
                       if (obs.includes('OPE C. VALENCIANA')) return 'OPE C. VALENCIANA';
                       return null;
                     })
                     .filter(Boolean) || []
        )].sort();

        const especialidades = [...new Set(
          enviosData?.filter(envio => envio.observacion)
                     .map(envio => {
                       const obs = envio.observacion!;
                       if (obs.includes('OPE ENFERMERIA')) return 'ENFERMERIA';
                       if (obs.includes('OPE PSICOLOGIA')) return 'PSICOLOGIA';
                       if (obs.includes('OPE PSIQUIATRIA')) return 'PSIQUIATRIA';
                       if (obs.includes('OPE MEDICINA DE FAMILIA Y COMUNITARIA')) return 'MEDICINA DE FAMILIA';
                       if (obs.includes('OPE DIGESTIVO') || obs.includes('OPE  DIGESTIVO')) return 'DIGESTIVO';
                       if (obs.includes('OPE MEDICINA INTERNA')) return 'MEDICINA INTERNA';
                       if (obs.includes('OPE OFTALMOLOGIA')) return 'OFTALMOLOGIA';
                       if (obs.includes('OPE CARDIOLOGIA')) return 'CARDIOLOGIA';
                       if (obs.includes('OPE GINECOLOGÍA Y OBSTETRICIA')) return 'GINECOLOGÍA Y OBSTETRICIA';
                       return null;
                     })
                     .filter(Boolean) || []
        )].sort();

        const modalidades = [...new Set(
          enviosData?.filter(envio => envio.observacion)
                     .map(envio => {
                       const obs = envio.observacion!;
                       if (obs.includes('1er Envío')) return '1er Envío';
                       if (obs.includes('2º Envío') || obs.includes('2ºEnvio')) return '2º Envío';
                       if (obs.includes('Refuerzo_2025')) return 'Refuerzo 2025';
                       if (obs.includes('Inicio Enero_25')) return 'Inicio Enero 2025';
                       if (obs.includes('Inicio Marzo_25')) return 'Inicio Marzo 2025';
                       if (obs.includes('Inicio Octubre')) return 'Inicio Octubre 2025';
                       if (obs.includes('PNA 26')) return 'PNA 26';
                       return null;
                     })
                     .filter(Boolean) || []
        )].sort();

        // Usar comunidades como filtro principal y especialidades como secundario
        const cursosUnicos = comunidadesOPE;
        const opeUnicos = especialidades;

        setPedidos(pedidosData || []);
        setEnviosGLS(enviosData || []);
        setComunidades(comunidadesOPE);
        setEspecialidades(especialidades);
        setModalidades(modalidades);
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
    const matchesSearch = pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por comunidad basándose en la observación del envío correspondiente
    const matchesComunidad = selectedComunidad === "" || 
                            enviosGLS.some(envio => 
                              (envio.pedido_id === pedido.id || 
                               envio.pedido_id === pedido.id.replace('=', '') ||
                               ('=' + envio.pedido_id) === pedido.id) && 
                              envio.observacion && 
                              envio.observacion.includes(selectedComunidad)
                            );
    
    // Filtrar por especialidad
    const matchesEspecialidad = selectedEspecialidad === "" ||
                               enviosGLS.some(envio => 
                                 (envio.pedido_id === pedido.id || 
                                  envio.pedido_id === pedido.id.replace('=', '') ||
                                  ('=' + envio.pedido_id) === pedido.id) && 
                                 envio.observacion && 
                                 envio.observacion.includes(selectedEspecialidad)
                               );
    
    return matchesSearch && matchesComunidad && matchesEspecialidad;
  });

  const filteredEnvios = enviosGLS.filter(envio => {
    const matchesSearch = envio.expedicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         envio.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (envio.pedido_id && envio.pedido_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro por comunidad
    const matchesComunidad = selectedComunidad === "" || 
                            (envio.observacion && envio.observacion.includes(selectedComunidad));
    
    // Filtro por especialidad
    const matchesEspecialidad = selectedEspecialidad === "" || 
                               (envio.observacion && envio.observacion.includes(selectedEspecialidad));
    
    // Filtro por modalidad
    const matchesModalidad = selectedModalidad === "" ||
                            (envio.observacion && envio.observacion.includes(selectedModalidad));
    
    return matchesSearch && matchesComunidad && matchesEspecialidad && matchesModalidad;
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
              placeholder="Buscar por ID, nombre o expedición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por Comunidad/OPE:</span>
            <Button
              variant={selectedComunidad === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedComunidad("")}
              className="text-xs"
            >
              Todas las comunidades
            </Button>
            {comunidades.map((comunidad) => (
              <Button
                key={comunidad}
                variant={selectedComunidad === comunidad ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedComunidad(comunidad)}
                className="text-xs"
                title={comunidad}
              >
                {comunidad.replace('OPE ', '')}
                {selectedComunidad === comunidad && (
                  <X className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComunidad("");
                  }} />
                )}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por Especialidad:</span>
            <Button
              variant={selectedEspecialidad === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedEspecialidad("")}
              className="text-xs"
            >
              Todas las especialidades
            </Button>
            {especialidades.map((especialidad) => (
              <Button
                key={especialidad}
                variant={selectedEspecialidad === especialidad ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEspecialidad(especialidad)}
                className="text-xs"
                title={especialidad}
              >
                {especialidad}
                {selectedEspecialidad === especialidad && (
                  <X className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEspecialidad("");
                  }} />
                )}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por Modalidad:</span>
            <Button
              variant={selectedModalidad === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModalidad("")}
              className="text-xs"
            >
              Todas las modalidades
            </Button>
            {modalidades.map((modalidad) => (
              <Button
                key={modalidad}
                variant={selectedModalidad === modalidad ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedModalidad(modalidad)}
                className="text-xs"
                title={modalidad}
              >
                {modalidad}
                {selectedModalidad === modalidad && (
                  <X className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModalidad("");
                  }} />
                )}
              </Button>
            ))}
          </div>
          
          {(selectedComunidad || selectedEspecialidad || selectedModalidad) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              {selectedComunidad && (
                <Badge variant="secondary" className="text-xs">
                  Comunidad: {selectedComunidad.replace('OPE ', '')}
                </Badge>
              )}
              {selectedEspecialidad && (
                <Badge variant="secondary" className="text-xs">
                  Especialidad: {selectedEspecialidad}
                </Badge>
              )}
              {selectedModalidad && (
                <Badge variant="secondary" className="text-xs">
                  Modalidad: {selectedModalidad}
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
            <div className="grid gap-1">
              {filteredPedidos.map((pedido) => (
                <Card key={pedido.id} className="w-full py-1 bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader className="py-1 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-primary truncate flex-1 mr-2">
                        {pedido.id}
                      </CardTitle>
                      <Badge className={`${getStatusColor(pedido.estado_envio || pedido.estado)} text-xs py-0 px-2 h-5`}>
                        {pedido.estado_envio || pedido.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                   <CardContent className="py-1 px-3">
                    <div className="grid md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-foreground truncate">
                          {pedido.nombre}
                        </p>
                        <p className="text-muted-foreground truncate">
                          {pedido.poblacion}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground truncate">
                          {pedido.email}
                        </p>
                        <p className="text-muted-foreground">
                          {pedido.fecha}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-muted-foreground truncate">
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
                           <p className="text-xs text-muted-foreground">
                             Exp: {pedido.expedicion_gls}
                           </p>
                         )}
                         <div className="flex gap-1">
                           {pedido.tracking_gls && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-6 px-2 text-xs"
                               onClick={() => window.open(pedido.tracking_gls!, '_blank')}
                             >
                               <Eye className="h-3 w-3 mr-1" />
                               Tracking GLS
                             </Button>
                           )}
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             className="h-6 px-2 text-xs"
                             onClick={() => deletePedido(pedido.id)}
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="envios" className="mt-6">
            <div className="grid gap-1">
              {filteredEnvios.map((envio) => (
                <Card key={envio.expedicion} className="w-full py-1 bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader className="py-1 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-primary truncate flex-1 mr-2">
                        Expedición: {envio.expedicion}
                      </CardTitle>
                      <Badge className={`${getStatusColor(envio.estado)} text-xs py-0 px-2 h-5`}>
                        {envio.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-1 px-3">
                     <div className="grid md:grid-cols-5 gap-2 text-xs items-center">
                       <div>
                         <p className="font-medium text-foreground truncate">
                           {envio.destinatario}
                         </p>
                         <p className="text-muted-foreground truncate">
                           {envio.localidad}
                         </p>
                       </div>
                       <div>
                         <p className="text-muted-foreground truncate">
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
                          <p className="text-muted-foreground truncate text-xs">
                            Exp: {envio.expedicion}
                          </p>
                          {envio.observacion && (
                            <p className="text-muted-foreground truncate text-xs">
                              {envio.observacion.length > 30 
                                ? envio.observacion.substring(0, 30) + '...' 
                                : envio.observacion}
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
                           variant="destructive" 
                           size="sm" 
                           className="h-6 px-2 text-xs"
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