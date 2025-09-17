-- Remove existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access on pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow public delete access on pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow public read access on envios_gls" ON public.envios_gls;
DROP POLICY IF EXISTS "Allow public delete access on envios_gls" ON public.envios_gls;

-- Create secure RLS policies for pedidos table
-- Only authenticated users can read their own orders (if we had user_id)
-- For now, no public access to sensitive customer data
CREATE POLICY "No public access to pedidos" 
ON public.pedidos 
FOR ALL 
USING (false);

-- Create secure RLS policies for envios_gls table  
-- No public access to sensitive shipping data
CREATE POLICY "No public access to envios_gls" 
ON public.envios_gls 
FOR ALL 
USING (false);

-- Allow service role to manage all data (for webhooks and admin functions)
-- This ensures webhooks can still insert/update data using service role key
CREATE POLICY "Service role full access on pedidos" 
ON public.pedidos 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role full access on envios_gls" 
ON public.envios_gls 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);