-- Crear tabla para pedidos
CREATE TABLE public.pedidos (
  id TEXT PRIMARY KEY,
  estado TEXT NOT NULL,
  fecha DATE NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  poblacion TEXT NOT NULL,
  curso TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para envíos GLS
CREATE TABLE public.envios_gls (
  expedicion TEXT PRIMARY KEY,
  fecha DATE NOT NULL,
  destinatario TEXT NOT NULL,
  direccion TEXT NOT NULL,
  localidad TEXT NOT NULL,
  estado TEXT NOT NULL,
  pedido_id TEXT,
  tracking TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Opcional: referencia al pedido
  FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE SET NULL
);

-- Habilitar Row Level Security (importante para seguridad)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios_gls ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para permitir lectura (ajustaremos cuando añadamos autenticación)
CREATE POLICY "Allow public read access on pedidos"
ON public.pedidos FOR SELECT
USING (true);

CREATE POLICY "Allow public read access on envios_gls" 
ON public.envios_gls FOR SELECT
USING (true);

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para actualizar timestamps automáticamente
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_envios_gls_updated_at
  BEFORE UPDATE ON public.envios_gls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar los datos de ejemplo
INSERT INTO public.pedidos (id, estado, fecha, nombre, direccion, poblacion, curso, email) VALUES
('IFSES_Matri_17697', 'PENDIENTE', '2025-08-27', 'Alba Chueca Moreno', 'Avda. Canaletas, 39, Bl 39, Esc 6, Planta 2', 'Barcelona', 'Curso OPE CATALUÑA_2025_1er Envío', 'alba-chueca@hotmail.com'),
('IFSES_Matri_17698', 'ENTREGADO', '2025-08-27', 'Lidia Serra Sans', 'Carrer del Trull, 25, Puerta 25', 'Vallbona D''anoia', 'Curso OPE CATALUÑA_2025_1er Envío', 'lidiaserrasans@gmail.com'),
('IFSES_Matri_17878', 'EN REPARTO', '2025-09-02', 'Sarah Cano Alcaide', 'Calle Granollers, 81, Bajo 2', 'Cardedeu', 'Curso OPE CATALUÑA_2025_1er Envío', 'saracanoal@gmail.com');

INSERT INTO public.envios_gls (expedicion, fecha, destinatario, direccion, localidad, estado, pedido_id, tracking) VALUES
('1167644726', '2025-09-01', 'LAURA REINA PLA', 'Paseo ezequiel gonzalez 32, bloque 1, planta 4, puerta D', 'SEGOVIA', 'FALTA EXPEDICION COMPLETA', 'IFSES_Matri_17750', 'https://mygls.gls-spain.es/e/11013600011564/40002'),
('1168811831', '2025-09-03', 'MARÍA JOSÉ MARTÍN FRAILE', 'Calle GARABATO 20, bloque 5, puerta 8', 'EL SOBRADILLO', 'EN REPARTO', 'IFSES_Matri_17864', 'https://mygls.gls-spain.es/e/11013600011620/38107'),
('1168813709', '2025-09-03', 'Aileen Martín García', 'Calle General Tacoronte Tejina, 120 Bl A, 2º, I', 'Tacoronte', 'ENTREGADO', 'IFSES_Matri_17877', 'https://mygls.gls-spain.es/e/11013600011635/38356');