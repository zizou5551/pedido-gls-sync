import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

export const WebhookTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  // Datos de ejemplo para probar
  const ejemploData = {
    pedidos: [
      {
        id: "TEST_001",
        estado: "PENDIENTE",
        fecha: "2025-09-16",
        nombre: "Prueba Test",
        direccion: "Calle Test 123",
        poblacion: "Madrid",
        curso: "Curso de Prueba",
        email: "test@example.com"
      }
    ],
    envios: [
      {
        expedicion: "TEST12345",
        fecha: "2025-09-16",
        destinatario: "PRUEBA DESTINATARIO",
        direccion: "Calle Test 123",
        localidad: "MADRID",
        estado: "EN REPARTO",
        pedido_id: "TEST_001",
        tracking: "https://ejemplo-tracking.com"
      }
    ]
  };

  const probarWebhook = async () => {
    setIsLoading(true);
    setResponse("");

    try {
      console.log("🔄 Enviando datos al webhook...");
      
      const webhookUrl = "https://xfozelfdjlaaeihpuruz.supabase.co/functions/v1/webhook-pedidos";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ejemploData),
      });

      const result = await response.json();
      
      console.log("📥 Respuesta del webhook:", result);
      setResponse(JSON.stringify(result, null, 2));

      if (result.success) {
        toast({
          title: "✅ Webhook exitoso",
          description: `${result.pedidos_insertados} pedidos y ${result.envios_insertados} envíos procesados`,
        });
      } else {
        toast({
          title: "❌ Error en webhook",
          description: result.error || "Error desconocido",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("💥 Error:", error);
      setResponse(`Error: ${error.message}`);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Prueba de Webhook n8n
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Simula lo que hará n8n cuando envíe datos a tu webhook
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">URL del Webhook:</h4>
          <code className="text-sm bg-muted p-2 rounded block">
            https://xfozelfdjlaaeihpuruz.supabase.co/functions/v1/webhook-pedidos
          </code>
        </div>

        <div>
          <h4 className="font-medium mb-2">Datos que se enviarán:</h4>
          <Textarea 
            value={JSON.stringify(ejemploData, null, 2)}
            readOnly
            className="font-mono text-sm h-40"
          />
        </div>

        <Button 
          onClick={probarWebhook}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Probar Webhook
            </>
          )}
        </Button>

        {response && (
          <div>
            <h4 className="font-medium mb-2">Respuesta del servidor:</h4>
            <Textarea 
              value={response}
              readOnly
              className="font-mono text-sm h-32"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};