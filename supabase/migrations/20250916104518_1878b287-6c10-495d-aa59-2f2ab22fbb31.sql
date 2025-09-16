-- Create delete policies for pedidos table
CREATE POLICY "Allow public delete access on pedidos" 
ON public.pedidos 
FOR DELETE 
USING (true);

-- Create delete policies for envios_gls table  
CREATE POLICY "Allow public delete access on envios_gls"
ON public.envios_gls
FOR DELETE
USING (true);