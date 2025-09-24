-- Crear enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'viewer');

-- Crear tabla de roles de usuario
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función security definer para verificar roles (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar si es staff o admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'staff')
  )
$$;

-- Eliminar políticas existentes inseguras de pedidos
DROP POLICY IF EXISTS "Allow authenticated access to pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "No public access to pedidos" ON public.pedidos;

-- Crear nuevas políticas seguras para pedidos
CREATE POLICY "Only staff and admins can view pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can modify pedidos"
ON public.pedidos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Eliminar políticas existentes inseguras de envios_gls
DROP POLICY IF EXISTS "Allow authenticated access to envios_gls" ON public.envios_gls;
DROP POLICY IF EXISTS "No public access to envios_gls" ON public.envios_gls;

-- Crear nuevas políticas seguras para envios_gls
CREATE POLICY "Only staff and admins can view envios_gls"
ON public.envios_gls
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can modify envios_gls"
ON public.envios_gls
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política para que los usuarios puedan ver sus propios roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Solo admins pueden gestionar roles
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insertar el primer usuario admin (necesitarás el UUID del primer usuario)
-- Esta línea deberás ejecutarla manualmente con el UUID real del primer usuario
-- INSERT INTO public.user_roles (user_id, role) VALUES ('TU_USER_UUID_AQUI', 'admin');