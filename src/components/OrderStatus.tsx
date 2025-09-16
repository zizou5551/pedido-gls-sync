import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Mock data based on Excel structure
const mockPedidos = [
  {
    id: "IFSES_Matri_17697",
    estado: "PENDIENTE",
    fecha: "2025-08-27",
    nombre: "Alba Chueca Moreno",
    direccion: "Avda. Canaletas, 39, Bl 39, Esc 6, Planta 2",
    poblacion: "Barcelona",
    curso: "Curso OPE CATALUÑA_2025_1er Envío",
    email: "alba-chueca@hotmail.com"
  },
  {
    id: "IFSES_Matri_17698", 
    estado: "ENTREGADO",
    fecha: "2025-08-27",
    nombre: "Lidia Serra Sans",
    direccion: "Carrer del Trull, 25, Puerta 25",
    poblacion: "Vallbona D'anoia",
    curso: "Curso OPE CATALUÑA_2025_1er Envío",
    email: "lidiaserrasans@gmail.com"
  },
  {
    id: "IFSES_Matri_17878",
    estado: "EN REPARTO", 
    fecha: "2025-09-02",
    nombre: "Sarah Cano Alcaide",
    direccion: "Calle Granollers, 81, Bajo 2",
    poblacion: "Cardedeu",
    curso: "Curso OPE CATALUÑA_2025_1er Envío",
    email: "saracanoal@gmail.com"
  }
];

const mockEnviosGLS = [
  {
    fecha: "01/09/2025",
    expedicion: "1167644726",
    destinatario: "LAURA REINA PLA",
    direccion: "Paseo ezequiel gonzalez 32, bloque 1, planta 4, puerta D",
    localidad: "SEGOVIA",
    estado: "FALTA EXPEDICION COMPLETA",
    pedidoId: "IFSES_Matri_17750",
    tracking: "https://mygls.gls-spain.es/e/11013600011564/40002"
  },
  {
    fecha: "03/09/2025",
    expedicion: "1168811831", 
    destinatario: "MARÍA JOSÉ MARTÍN FRAILE",
    direccion: "Calle GARABATO 20, bloque 5, puerta 8",
    localidad: "EL SOBRADILLO",
    estado: "EN REPARTO",
    pedidoId: "IFSES_Matri_17864",
    tracking: "https://mygls.gls-spain.es/e/11013600011620/38107"
  },
  {
    fecha: "03/09/2025",
    expedicion: "1168813709",
    destinatario: "Aileen Martín García", 
    direccion: "Calle General Tacoronte Tejina, 120 Bl A, 2º, I",
    localidad: "Tacoronte",
    estado: "ENTREGADO",
    pedidoId: "IFSES_Matri_17877",
    tracking: "https://mygls.gls-spain.es/e/11013600011635/38356"
  }
];

const getStatusColor = (estado: string) => {
  switch (estado.toUpperCase()) {
    case "ENTREGADO":
      return "bg-success text-success-foreground";
    case "EN REPARTO":
    case "EN DELEGACION DESTINO":
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

  const filteredPedidos = mockPedidos.filter(pedido =>
    pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnvios = mockEnviosGLS.filter(envio =>
    envio.expedicion.includes(searchTerm) ||
    envio.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    envio.pedidoId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Estado de Pedidos
            </TabsTrigger>
            <TabsTrigger value="envios" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Envíos GLS
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
                          {envio.pedidoId}
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(envio.tracking, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
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