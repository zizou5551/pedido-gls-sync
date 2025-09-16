import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Eye, Search, Loader2 } from "lucide-react";
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
}

const getStatusColor = (estado: string) => {
  switch (estado.toUpperCase()) {
    case "ENTREGADO":
      return "bg-success text-success-foreground";
    case "EN REPARTO":
    case "EN DELEGACION DESTINO":
    case "PROCESANDO":
      return "bg-info text-info-foreground";
    case "PENDIENTE":
    case "FALTA EXPEDICION COMPLETA":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const OrderStatus = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enviosGLS, setEnviosGLS] = useState<EnvioGLS[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

        setPedidos(pedidosData || []);
        setEnviosGLS(enviosData || []);
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

  const filteredPedidos = pedidos.filter(pedido =>
    pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnvios = enviosGLS.filter(envio =>
    envio.expedicion.includes(searchTerm) ||
    envio.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (envio.pedido_id && envio.pedido_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Sistema de Seguimiento de Pedidos
          </h1>
          <p className="text-muted-foreground">
            Consulta el estado de tus pedidos y envíos en tiempo real
          </p>
        </header>

        <div className="mb-6">
          <div className="flex items-center space-x-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, nombre o expedición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
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
                <Card key={pedido.id} className="w-full py-1">
                  <CardHeader className="py-1 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-primary truncate flex-1 mr-2">
                        {pedido.id}
                      </CardTitle>
                      <Badge className={`${getStatusColor(pedido.estado)} text-xs py-0 px-2 h-5`}>
                        {pedido.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-1 px-3">
                    <div className="grid md:grid-cols-3 gap-2 text-xs">
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
                <Card key={envio.expedicion} className="w-full py-1">
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
                    <div className="grid md:grid-cols-4 gap-2 text-xs items-center">
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
                        <p className="text-muted-foreground truncate">
                          Exp: {envio.expedicion}
                        </p>
                      </div>
                      <div>
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