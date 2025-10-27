import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, adminKey } = await req.json()
    
    // Simple security check
    const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (adminKey !== expectedKey) {
      throw new Error('No autorizado')
    }

    if (!email || !password) {
      throw new Error('Email y password son requeridos')
    }

    // Borrar adminKey del request
    const { email: userEmail, password: userPassword } = { email, password }

    // Crear cliente de Supabase con service role key para admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Crear usuario con email confirmado automáticamente
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // Auto-confirmar email
    })

    if (createError) {
      throw createError
    }

    console.log('Usuario creado:', user.user?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario creado exitosamente',
        userId: user.user?.id,
        email: user.user?.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
