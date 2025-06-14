
-- Update the handle_new_user function to read role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Get the role from metadata, default to 'employee'
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::user_role);
  
  RETURN NEW;
END;
$$;
