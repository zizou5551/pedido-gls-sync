-- Asignar rol de admin al usuario produccion@fragma.es
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'produccion@fragma.es'
ON CONFLICT (user_id, role) DO NOTHING;