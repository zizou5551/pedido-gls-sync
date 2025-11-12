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
    const { email, password, adminKey, role } = await req.json()
    
    // Simple security check
    const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (adminKey !== expectedKey) {
      throw new Error('No autorizado')
    }

    if (!email || !password) {
      throw new Error('Email y password son requeridos')
    }

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
      email,
      password,
      email_confirm: true, // Auto-confirmar email
    })

    if (createError) {
      throw createError
    }

    console.log('Usuario creado:', user.user?.id)

    // Asignar rol si se proporcionó
    if (role && user.user?.id) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.user.id,
          role: role
        })

      if (roleError) {
        console.error('Error asignando rol:', roleError)
        throw new Error(`Usuario creado pero error al asignar rol: ${roleError.message}`)
      }

      console.log('Rol asignado:', role)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: role ? `Usuario creado exitosamente con rol ${role}` : 'Usuario creado exitosamente',
        userId: user.user?.id,
        email: user.user?.email,
        role: role || null
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
