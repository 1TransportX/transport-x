
-- Let's check and fix the trigger function to properly handle the role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val text;
BEGIN
  -- Insert into profiles first
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Get the role from metadata, default to 'employee'
  user_role_val := COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee');
  
  -- Log the role we're trying to insert (this will appear in Postgres logs)
  RAISE LOG 'Inserting role % for user %', user_role_val, NEW.id;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_val::public.user_role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Still return NEW so user creation doesn't fail
    RETURN NEW;
END;
$$;
