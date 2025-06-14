
-- Set Akarsh Reddy as admin by updating their role in the user_roles table
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'reddyakarshkumar@gmail.com'
);

-- If no role exists for this user, insert one
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles 
WHERE email = 'reddyakarshkumar@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = public.profiles.id
);
