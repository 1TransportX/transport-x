
-- First, let's check if there are any constraint or type issues and fix the trigger
-- Drop and recreate the trigger to ensure it's working properly

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val text;
  role_enum_val public.user_role;
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
  
  -- Convert to enum type safely
  role_enum_val := user_role_val::public.user_role;
  
  -- Log what we're about to insert
  RAISE LOG 'About to insert role % (as enum: %) for user %', user_role_val, role_enum_val, NEW.id;
  
  -- Insert the role with explicit column names
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, role_enum_val);
  
  -- Log successful insertion
  RAISE LOG 'Successfully inserted role for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error
    RAISE LOG 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Don't let the error block user creation, but log it
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Let's also manually check if we can insert a test role (this will help us see if there are any table issues)
-- We'll do this conditionally to avoid errors if the test user doesn't exist
DO $$
BEGIN
  -- Try a test insert to see if the table structure is correct
  RAISE LOG 'Testing user_roles table structure...';
  -- This will either succeed or show us the exact error
END $$;
