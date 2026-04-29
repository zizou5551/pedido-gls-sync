INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('b944533d-70d7-409c-bbef-68d56893bfee', 'admin'),
  ('4195d7c8-f237-47da-a650-879c5a6603c4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;