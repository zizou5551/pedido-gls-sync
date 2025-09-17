-- Crear tabla de usuarios personalizados para autenticación simple
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados (para login)
CREATE POLICY "Permitir lectura de usuarios para autenticación" 
ON public.usuarios 
FOR SELECT 
USING (true);

-- Insertar usuario por defecto
INSERT INTO public.usuarios (usuario, password_hash) 
VALUES ('amir', crypt('Fragma2025$', gen_salt('bf')))
ON CONFLICT (usuario) DO NOTHING;

-- Instalar extensión pgcrypto si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;