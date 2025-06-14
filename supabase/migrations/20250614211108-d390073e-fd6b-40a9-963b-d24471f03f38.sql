
-- Add unique constraint to user_roles table to prevent duplicate roles per user
ALTER TABLE public.user_roles ADD CONSTRAINT unique_user_role UNIQUE (user_id);

-- Insert admin role for the user (replace with actual email if different)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.user_role
FROM public.profiles 
WHERE email = 'reddyakarshkumar@gmail.com';
