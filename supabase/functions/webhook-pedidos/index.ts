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
          details: (parseError as Error).message,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Detectar si es formato individual o array
    let pedidos, envios;
    
    if (body.pedidos || body.envios) {
      // Formato original con arrays
      ({ pedidos, envios } = body);
    } else if (body.expedicion && body.fecha) {
      // Formato individual de n8n - convertir a array
      envios = [body];
      pedidos = [];
      console.log("🔄 Formato individual detectado, convertido a array");
    } else {
      console.error("❌ Formato de datos no reconocido:", body);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Formato de datos no válido",
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

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

    // Procesar pedidos usando UPSERT para evitar duplicados
    if (pedidos && Array.isArray(pedidos)) {
      for (const pedido of pedidos) {
        // Limpiar datos del pedido
        const pedidoLimpio = {
          id: limpiarTexto(pedido.id),
          estado: limpiarTexto(pedido.estado) || 'PENDIENTE',
          fecha: pedido.fecha && pedido.fecha !== '' ? pedido.fecha : new Date().toISOString().split('T')[0],
          nombre: limpiarTexto(pedido.nombre),
          direccion: limpiarTexto(pedido.direccion),
          poblacion: limpiarTexto(pedido.poblacion),
          curso: limpiarTexto(pedido.curso),
          email: limpiarTexto(pedido.email),
          updated_at: new Date().toISOString()
        };

        console.log("🧹 Pedido limpiado:", pedidoLimpio);

        // UPSERT: Insertar si no existe, actualizar si existe
        const { error } = await supabase
          .from('pedidos')
          .upsert(pedidoLimpio, {
            onConflict: 'id',
            ignoreDuplicates: false // Esto fuerza la actualización si ya existe
          });

        if (error) {
          console.error("❌ Error procesando pedido:", error);
        } else {
          pedidosInsertados++;
          console.log("✅ Pedido procesado (insertado/actualizado):", pedido.id, "- Estado:", pedidoLimpio.estado);
        }
      }
    }

    // Procesar envíos usando UPSERT para evitar duplicados
    if (envios && Array.isArray(envios)) {
      for (const envio of envios) {
        // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
        let fechaISO;
        if (envio.fecha && envio.fecha.trim() && envio.fecha !== '-') {
          const dateParts = envio.fecha.split('/');
          if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
            fechaISO = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          } else {
            fechaISO = new Date().toISOString().split('T')[0];
          }
        } else {
          fechaISO = new Date().toISOString().split('T')[0];
        }
        
        // Convertir fecha de actualización si existe
        let fechaActualizacionISO = null;
        if (envio.fechaActualizacion && envio.fechaActualizacion.trim() && envio.fechaActualizacion !== '-') {
          const updateParts = envio.fechaActualizacion.split('/');
          if (updateParts.length === 3 && updateParts[0] && updateParts[1] && updateParts[2]) {
            fechaActualizacionISO = `${updateParts[2]}-${updateParts[1].padStart(2, '0')}-${updateParts[0].padStart(2, '0')}`;
          }
        }

        // DEBUG: Verificar qué valor tiene observacion en el envío original
        console.log("🔍 DEBUG - Datos del envío original:", {
          expedicion: envio.expedicion,
          observacion_raw: envio.observacion,
          observacion_type: typeof envio.observacion,
          observacion_length: envio.observacion ? envio.observacion.length : 'null/undefined'
        });

        // Preparar datos del envío para UPSERT
        const envioData = {
          expedicion: envio.expedicion,
          fecha: fechaISO,
          destinatario: envio.destinatario,
          direccion: envio.direccion,
          localidad: envio.localidad,
          estado: envio.estado || 'PENDIENTE',
          pedido_id: envio.pedido_id,
          tracking: envio.tracking,
          bultos: envio.bultos && envio.bultos !== '-' ? parseInt(envio.bultos) : null,
          peso: envio.kgs && envio.kgs !== '-' ? parseFloat(envio.kgs) : null,
          cp_origen: envio.cp_org && envio.cp_org !== '-' ? envio.cp_org : null,
          cp_destino: envio.cp_dst && envio.cp_dst !== '-' ? envio.cp_dst : null,
          observacion: limpiarTexto(envio.observacion) || null,
          fecha_actualizacion: fechaActualizacionISO,
          updated_at: new Date().toISOString()
        };

        console.log("🔍 DEBUG - Valor final de observacion que se guardará:", envioData.observacion);

        console.log("📦 Procesando envío:", envio.expedicion, "- Estado:", envio.estado);

        // UPSERT: Insertar si no existe, actualizar si existe (basado en expedicion)
        const { error } = await supabase
          .from('envios_gls')
          .upsert(envioData, {
            onConflict: 'expedicion',
            ignoreDuplicates: false // Esto fuerza la actualización si ya existe
          });

        if (error) {
          console.error("❌ Error procesando envío:", error);
        } else {
          enviosInsertados++;
          console.log("✅ Envío procesado (insertado/actualizado):", envio.expedicion, "- Estado:", envio.estado);
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