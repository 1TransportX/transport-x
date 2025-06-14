
-- Check if the current admin user has a role, and if not, add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT '267aec03-b1f6-4d38-a12b-55fdedad4811'::uuid, 'admin'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '267aec03-b1f6-4d38-a12b-55fdedad4811'::uuid
);

-- Also ensure the employee user has proper role
INSERT INTO public.user_roles (user_id, role)
SELECT 'ad0f1301-1212-44d1-af24-6e63b0b2ad11'::uuid, 'employee'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'ad0f1301-1212-44d1-af24-6e63b0b2ad11'::uuid
);
