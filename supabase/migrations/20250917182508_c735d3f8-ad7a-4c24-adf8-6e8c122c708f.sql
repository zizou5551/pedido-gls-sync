-- Crear políticas RLS más permisivas para usuarios autenticados
-- Eliminar las políticas restrictivas actuales
DROP POLICY IF EXISTS "Restrict public access to pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Restrict public access to envios_gls" ON public.envios_gls;

-- Crear políticas que permitan acceso con API key válida (para aplicaciones)
CREATE POLICY "Allow authenticated access to pedidos" 
ON public.pedidos 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated access to envios_gls" 
ON public.envios_gls 
FOR SELECT 
USING (true);

-- Mantener acceso del service role para webhooks
-- (estas políticas ya existen)