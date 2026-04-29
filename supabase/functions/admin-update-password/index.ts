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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado: falta token')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Cliente con el JWT del llamante para verificar identidad
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !userData.user) throw new Error('No autorizado: usuario inválido')

    // Verificar que el llamante es admin
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)

    const isAdmin = roles?.some((r: any) => r.role === 'admin')
    if (!isAdmin) throw new Error('No autorizado: requiere rol admin')

    const { updates } = await req.json()
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('updates debe ser un array no vacío')
    }

    const results: any[] = []
    for (const u of updates) {
      const { email, password } = u
      if (!email || !password) {
        results.push({ email, success: false, error: 'email y password requeridos' })
        continue
      }
      // Buscar usuario por email
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
      if (listErr) {
        results.push({ email, success: false, error: listErr.message })
        continue
      }
      const target = list.users.find((x: any) => x.email?.toLowerCase() === email.toLowerCase())
      if (!target) {
        results.push({ email, success: false, error: 'usuario no encontrado' })
        continue
      }
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(target.id, { password })
      if (updErr) {
        results.push({ email, success: false, error: updErr.message })
      } else {
        results.push({ email, success: true, userId: target.id })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
