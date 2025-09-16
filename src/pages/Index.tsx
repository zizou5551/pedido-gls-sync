import { OrderStatus } from "@/components/OrderStatus";
import { WebhookTest } from "@/components/WebhookTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="p-4">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Ver Pedidos</TabsTrigger>
          <TabsTrigger value="test">Probar Webhook</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <OrderStatus />
        </TabsContent>
        
        <TabsContent value="test">
          <div className="py-8">
            <WebhookTest />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
