-- Actualizar la función para manejar diferentes formatos de ID
CREATE OR REPLACE FUNCTION public.sync_envio_to_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar la tabla pedidos con la información del envío
  -- Manejar tanto el formato "=IFSES_Matri_XXXX" como "IFSES_Matri_XXXX"
  UPDATE public.pedidos 
  SET 
    tracking_gls = NEW.tracking,
    estado_envio = NEW.estado,
    expedicion_gls = NEW.expedicion,
    updated_at = now()
  WHERE id = NEW.pedido_id OR id = '=' || NEW.pedido_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Sincronizar datos existentes con la lógica corregida
UPDATE public.pedidos 
SET 
  tracking_gls = envios_gls.tracking,
  estado_envio = envios_gls.estado,
  expedicion_gls = envios_gls.expedicion,
  updated_at = now()
FROM public.envios_gls 
WHERE pedidos.id = envios_gls.pedido_id OR pedidos.id = '=' || envios_gls.pedido_id;