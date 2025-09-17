-- Eliminar completamente la tabla usuarios ya que no se está usando
-- El sistema usa autenticación local con localStorage, no necesita BD

-- Eliminar la política pública que expone las credenciales
DROP POLICY IF EXISTS "Permitir lectura de usuarios para autenticación" ON public.usuarios;

-- Eliminar la tabla usuarios completamente - no se está usando
DROP TABLE IF EXISTS public.usuarios;