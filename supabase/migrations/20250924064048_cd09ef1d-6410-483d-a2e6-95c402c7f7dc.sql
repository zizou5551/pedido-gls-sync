-- Limpiar roles duplicados del usuario
DELETE FROM public.user_roles 
WHERE user_id = '4b16b056-b092-4d2d-89e2-09a9fb3a823b' AND role = 'staff';

-- Asegurar que solo tenga rol admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('4b16b056-b092-4d2d-89e2-09a9fb3a823b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;