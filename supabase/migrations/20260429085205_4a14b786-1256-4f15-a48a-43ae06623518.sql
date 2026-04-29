UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email IN ('jpivi@fragma.es', 'v.ferreres@amireducacion.com')
  AND email_confirmed_at IS NULL;

INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('a5469705-fc3a-4514-aeb4-bfd913dcb0aa', 'admin'),
  ('3860ed8c-e873-42e9-8fbe-34a1997cd714', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;