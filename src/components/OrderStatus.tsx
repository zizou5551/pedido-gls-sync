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
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedOpe, setSelectedOpe] = useState<string>("");
  const [cursos, setCursos] = useState<string[]>([]);
  const [opeOptions, setOpeOptions] = useState<string[]>([]);
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

        // Extraer opciones de filtrado desde observaciones
        const cursosUnicos = [...new Set(
          enviosData?.filter(envio => envio.observacion)
                     .map(envio => {
                       const obs = envio.observacion!;
                       
                       // Extraer información de cursos específicos
                       if (obs.includes('OPE Extremadura')) return 'OPE Extremadura';
                       if (obs.includes('OPE CANARIAS')) return 'OPE CANARIAS';
                       if (obs.includes('OPE Aragón')) return 'OPE Aragón';
                       if (obs.includes('OPE CATALUÑA')) return 'OPE CATALUÑA';
                       if (obs.includes('OPE SESCAM')) return 'OPE SESCAM';
                       if (obs.includes('OPE SERMAS')) return 'OPE SERMAS';
                       if (obs.includes('OPE GALICIA')) return 'OPE GALICIA';
                       if (obs.includes('OPE C. VALENCIANA')) return 'OPE C. VALENCIANA';
                       
                       // Extraer especialidades médicas
                       if (obs.includes('OPE ENFERMERIA')) return 'OPE ENFERMERIA';
                       if (obs.includes('OPE PSIQUIATRIA')) return 'OPE PSIQUIATRIA';
                       if (obs.includes('OPE CARDIOLOGIA')) return 'OPE CARDIOLOGIA';
                       if (obs.includes('OPE GINECOLOGÍA Y OBSTETRICIA')) return 'OPE GINECOLOGÍA Y OBSTETRICIA';
                       if (obs.includes('OPE PSICOLOGIA')) return 'OPE PSICOLOGIA';
                       if (obs.includes('OPE MEDICINA DE FAMILIA Y COMUNITARIA')) return 'OPE MEDICINA DE FAMILIA Y COMUNITARIA';
                       if (obs.includes('OPE  DIGESTIVO')) return 'OPE DIGESTIVO';
                       if (obs.includes('OPE OFTALMOLOGIA')) return 'OPE OFTALMOLOGIA';
                       
                       return null;
                     })
                     .filter(Boolean) || []
        )].sort();

        // Para mantener compatibilidad, también extraer cursos de comunidades
        const opeUnicos = [...new Set(
          enviosData?.filter(envio => envio.observacion)
                     .map(envio => {
                       const obs = envio.observacion!;
                       
                       // Extraer comunidades autónomas
                       if (obs.includes('Extremadura')) return 'Extremadura';
                       if (obs.includes('CANARIAS')) return 'Canarias';
                       if (obs.includes('Aragón')) return 'Aragón';
                       if (obs.includes('CATALUÑA')) return 'Cataluña';
                       if (obs.includes('SESCAM')) return 'Castilla-La Mancha';
                       if (obs.includes('SERMAS')) return 'Madrid';
                       if (obs.includes('GALICIA')) return 'Galicia';
                       if (obs.includes('C. VALENCIANA')) return 'C. Valenciana';
                       
                       return null;
                     })
                     .filter(Boolean) || []
        )].sort();

        setPedidos(pedidosData || []);
        setEnviosGLS(enviosData || []);
        setCursos(cursosUnicos);
        setOpeOptions(opeUnicos);
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
    
    // Filtrar por curso basándose en la observación del envío correspondiente
    const matchesCurso = selectedCurso === "" || 
                        enviosGLS.some(envio => 
                          (envio.pedido_id === pedido.id || 
                           envio.pedido_id === pedido.id.replace('=', '') ||
                           ('=' + envio.pedido_id) === pedido.id) && 
                          envio.observacion && 
                          envio.observacion.includes(selectedCurso)
                        );
    
    return matchesSearch && matchesCurso;
  });

  const filteredEnvios = enviosGLS.filter(envio => {
    const matchesSearch = envio.expedicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         envio.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (envio.pedido_id && envio.pedido_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro por curso basándose en la observación
    const matchesCurso = selectedCurso === "" || 
                        (envio.observacion && envio.observacion.includes(selectedCurso));
    
    // Filtro por comunidad autónoma usando la observación
    const matchesOpe = selectedOpe === "" || 
                      (envio.observacion && (
                        (selectedOpe === 'Extremadura' && envio.observacion.includes('Extremadura')) ||
                        (selectedOpe === 'Canarias' && envio.observacion.includes('CANARIAS')) ||
                        (selectedOpe === 'Aragón' && envio.observacion.includes('Aragón')) ||
                        (selectedOpe === 'Cataluña' && envio.observacion.includes('CATALUÑA')) ||
                        (selectedOpe === 'Castilla-La Mancha' && envio.observacion.includes('SESCAM')) ||
                        (selectedOpe === 'Madrid' && envio.observacion.includes('SERMAS')) ||
                        (selectedOpe === 'Galicia' && envio.observacion.includes('GALICIA')) ||
                        (selectedOpe === 'C. Valenciana' && envio.observacion.includes('C. VALENCIANA'))
                      ));
    
    return matchesSearch && matchesCurso && matchesOpe;
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
            <span className="text-sm text-muted-foreground">Filtrar por OPE/Especialidad:</span>
            <Button
              variant={selectedCurso === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCurso("")}
              className="text-xs"
            >
              Todos los cursos
            </Button>
            {cursos.map((curso) => (
              <Button
                key={curso}
                variant={selectedCurso === curso ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCurso(curso)}
                className="text-xs"
              >
                {curso}
                {selectedCurso === curso && (
                  <X className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCurso("");
                  }} />
                )}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por Comunidad:</span>
            <Button
              variant={selectedOpe === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedOpe("")}
              className="text-xs"
            >
              Todas las OPE
            </Button>
            {opeOptions.map((ope) => (
              <Button
                key={ope}
                variant={selectedOpe === ope ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOpe(ope)}
                className="text-xs"
              >
                {ope}
                {selectedOpe === ope && (
                  <X className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOpe("");
                  }} />
                )}
              </Button>
            ))}
          </div>
          
          {selectedCurso && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                Filtrando por: {selectedCurso}
              </Badge>
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