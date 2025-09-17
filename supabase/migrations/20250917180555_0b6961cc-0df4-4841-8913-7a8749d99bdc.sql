-- First check existing policies and then update them
-- Update the existing policies to be more restrictive

-- Update pedidos policies
DROP POLICY IF EXISTS "Allow public read access on pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow public delete access on pedidos" ON public.pedidos;

-- Update envios_gls policies  
DROP POLICY IF EXISTS "Allow public read access on envios_gls" ON public.envios_gls;
DROP POLICY IF EXISTS "Allow public delete access on envios_gls" ON public.envios_gls;

-- Create secure policies - no public access to sensitive data
CREATE POLICY "Restrict public access to pedidos" 
ON public.pedidos 
FOR SELECT 
USING (false);

CREATE POLICY "Restrict public access to envios_gls" 
ON public.envios_gls 
FOR SELECT 
USING (false);

-- Allow service role full access for webhooks and admin operations
CREATE POLICY "Service role can manage pedidos" 
ON public.pedidos 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can manage envios_gls" 
ON public.envios_gls 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);