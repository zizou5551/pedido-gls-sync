-- Agregar nuevos campos a la tabla envios_gls
ALTER TABLE public.envios_gls 
ADD COLUMN IF NOT EXISTS bultos INTEGER,
ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS cp_origen TEXT,
ADD COLUMN IF NOT EXISTS cp_destino TEXT,
ADD COLUMN IF NOT EXISTS observacion TEXT,
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE;

-- Crear índice para mejorar búsquedas por observación
CREATE INDEX IF NOT EXISTS idx_envios_gls_observacion ON public.envios_gls(observacion);

-- Actualizar trigger para incluir nuevos campos en la sincronización
CREATE OR REPLACE FUNCTION public.sync_envio_to_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
$function$;