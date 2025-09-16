import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Webhook llamado desde n8n");

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Leer y validar datos del body
    let body;
    try {
      const rawBody = await req.text();
      console.log("📦 Raw body recibido:", rawBody);
      
      // Intentar parsear JSON
      body = JSON.parse(rawBody);
      console.log("✅ JSON parseado correctamente:", body);
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      console.error("Raw data:", await req.text());
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON format",
          details: parseError.message,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { pedidos, envios } = body;

    // Función para limpiar datos de Excel
    const limpiarTexto = (texto: string | null | undefined): string => {
      if (!texto) return '';
      return texto
        .toString()
        .trim()
        // Quitar comillas dobles problemáticas
        .replace(/^"/, '') // Quitar comilla al inicio
        .replace(/"$/, '') // Quitar comilla al final
        .replace(/"/g, '') // Quitar todas las comillas dobles restantes
        // Limpiar espacios múltiples
        .replace(/\s+/g, ' ')
        .trim();
    };

    let pedidosInsertados = 0;
    let enviosInsertados = 0;

    // Insertar pedidos si existen
    if (pedidos && Array.isArray(pedidos)) {
      for (const pedido of pedidos) {
        // Verificar si el pedido ya existe
        const { data: existingPedido } = await supabase
          .from('pedidos')
          .select('id')
          .eq('id', pedido.id)
          .single();

        if (!existingPedido) {
          // Limpiar y insertar nuevo pedido
          const pedidoLimpio = {
            id: limpiarTexto(pedido.id),
            estado: limpiarTexto(pedido.estado) || 'PENDIENTE',
            fecha: pedido.fecha && pedido.fecha !== '' ? pedido.fecha : new Date().toISOString().split('T')[0],
            nombre: limpiarTexto(pedido.nombre),
            direccion: limpiarTexto(pedido.direccion),
            poblacion: limpiarTexto(pedido.poblacion),
            curso: limpiarTexto(pedido.curso),
            email: limpiarTexto(pedido.email)
          };

          console.log("🧹 Pedido limpiado:", pedidoLimpio);

          const { error } = await supabase
            .from('pedidos')
            .insert(pedidoLimpio);

          if (error) {
            console.error("❌ Error insertando pedido:", error);
          } else {
            pedidosInsertados++;
            console.log("✅ Pedido insertado:", pedido.id);
          }
        } else {
          // Limpiar y actualizar pedido existente
          const pedidoLimpioUpdate = {
            estado: limpiarTexto(pedido.estado) || 'PENDIENTE',
            fecha: pedido.fecha && pedido.fecha !== '' ? pedido.fecha : new Date().toISOString().split('T')[0],
            nombre: limpiarTexto(pedido.nombre),
            direccion: limpiarTexto(pedido.direccion),
            poblacion: limpiarTexto(pedido.poblacion),
            curso: limpiarTexto(pedido.curso),
            email: limpiarTexto(pedido.email)
          };

          const { error } = await supabase
            .from('pedidos')
            .update(pedidoLimpioUpdate)
            .eq('id', pedido.id);

          if (error) {
            console.error("❌ Error actualizando pedido:", error);
          } else {
            console.log("🔄 Pedido actualizado:", pedido.id);
          }
        }
      }
    }

    // Insertar envíos si existen
    if (envios && Array.isArray(envios)) {
      for (const envio of envios) {
        // Verificar si el envío ya existe (por expedición)
        const { data: existingEnvio } = await supabase
          .from('envios_gls')
          .select('expedicion')
          .eq('expedicion', envio.expedicion)
          .single();

        if (!existingEnvio) {
          // Insertar nuevo envío
          const { error } = await supabase
            .from('envios_gls')
            .insert({
              expedicion: envio.expedicion,
              fecha: envio.fecha,
              destinatario: envio.destinatario,
              direccion: envio.direccion,
              localidad: envio.localidad,
              estado: envio.estado || 'PENDIENTE',
              pedido_id: envio.pedido_id,
              tracking: envio.tracking
            });

          if (error) {
            console.error("❌ Error insertando envío:", error);
          } else {
            enviosInsertados++;
            console.log("✅ Envío insertado:", envio.expedicion);
          }
        } else {
          // ACTUALIZAR envío existente (importante para evitar duplicados)
          const { error } = await supabase
            .from('envios_gls')
            .update({
              fecha: envio.fecha,
              destinatario: envio.destinatario,
              direccion: envio.direccion,
              localidad: envio.localidad,
              estado: envio.estado || 'PENDIENTE',
              pedido_id: envio.pedido_id,
              tracking: envio.tracking,
              updated_at: new Date().toISOString() // Actualizar timestamp
            })
            .eq('expedicion', envio.expedicion);

          if (error) {
            console.error("❌ Error actualizando envío:", error);
          } else {
            console.log("🔄 Envío actualizado:", envio.expedicion, "- Nuevo estado:", envio.estado);
          }
        }
      }
    }

    const response = {
      success: true,
      message: "Datos procesados correctamente",
      pedidos_insertados: pedidosInsertados,
      envios_insertados: enviosInsertados,
      timestamp: new Date().toISOString()
    };

    console.log("📊 Resultado:", response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Error en webhook:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});