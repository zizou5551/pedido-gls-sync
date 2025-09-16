-- Agregar campos para información de envío GLS a la tabla pedidos
ALTER TABLE public.pedidos 
ADD COLUMN tracking_gls TEXT,
ADD COLUMN estado_envio TEXT,
ADD COLUMN expedicion_gls TEXT;

-- Crear función para actualizar automáticamente los datos de envío en pedidos
CREATE OR REPLACE FUNCTION public.sync_envio_to_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar la tabla pedidos con la información del envío
  UPDATE public.pedidos 
  SET 
    tracking_gls = NEW.tracking,
    estado_envio = NEW.estado,
    expedicion_gls = NEW.expedicion,
    updated_at = now()
  WHERE id = NEW.pedido_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Crear trigger para sincronizar automáticamente cuando se inserte o actualice un envío
CREATE TRIGGER sync_envio_insert_update
  AFTER INSERT OR UPDATE ON public.envios_gls
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_envio_to_pedido();

-- Sincronizar datos existentes
UPDATE public.pedidos 
SET 
  tracking_gls = envios_gls.tracking,
  estado_envio = envios_gls.estado,
  expedicion_gls = envios_gls.expedicion,
  updated_at = now()
FROM public.envios_gls 
WHERE pedidos.id = envios_gls.pedido_id;