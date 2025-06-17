
-- First, let's systematically drop ALL existing policies on ALL tables
-- This ensures we start with a clean slate

-- Drop all existing policies on all relevant tables
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on routes table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'routes' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.routes', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on route_stops table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'route_stops' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.route_stops', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on user_roles table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on deliveries table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'deliveries' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.deliveries', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on delivery_completions table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'delivery_completions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.delivery_completions', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on vehicle_assignments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'vehicle_assignments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicle_assignments', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on vehicles table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'vehicles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicles', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on fuel_logs table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'fuel_logs' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.fuel_logs', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on maintenance_logs table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'maintenance_logs' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.maintenance_logs', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on tasks table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on reports table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'reports' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on inventory and stock_movements tables (if they exist)
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'inventory' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inventory', policy_record.policyname);
    END LOOP;
    
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'stock_movements' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.stock_movements', policy_record.policyname);
    END LOOP;
END $$;

-- Remove employee role from existing data
DELETE FROM public.user_roles WHERE role = 'employee';

-- Drop warehouse/inventory related tables completely
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.delivery_items CASCADE;

-- Remove employee_id column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS employee_id;

-- Now update the enum with no policies blocking it
ALTER TYPE public.user_role RENAME TO user_role_old;
CREATE TYPE public.user_role AS ENUM ('admin', 'driver');

-- Update user_roles table to use new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.user_role USING role::text::public.user_role;

-- Drop old enum type
DROP TYPE public.user_role_old;

-- Remove employee-related security functions
DROP FUNCTION IF EXISTS public.is_employee_or_admin(uuid);

-- Update remaining security functions
CREATE OR REPLACE FUNCTION public.is_driver_or_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = user_uuid AND role IN ('admin', 'driver'));
$$;

-- Update handle_new_user function to default to driver instead of employee
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
  
  -- Get the role from metadata, default to 'driver' instead of 'employee'
  user_role_val := COALESCE(NEW.raw_user_meta_data ->> 'role', 'driver');
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_val::public.user_role);
  
  RETURN NEW;
END;
$$;

-- Now recreate all essential policies for the admin-driver system
-- User roles policies
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert user roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update user roles" 
  ON public.user_roles 
  FOR UPDATE 
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete user roles" 
  ON public.user_roles 
  FOR DELETE 
  USING (public.is_current_user_admin());

-- Routes policies
CREATE POLICY "Drivers can view their routes and admins can view all"
  ON public.routes FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage routes"
  ON public.routes FOR ALL
  USING (public.is_admin(auth.uid()));

-- Route stops policies
CREATE POLICY "Drivers can view route stops for their routes"
  ON public.route_stops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routes r 
      WHERE r.id = route_id AND (
        r.driver_id = auth.uid() OR 
        public.is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Admins can manage route stops"
  ON public.route_stops FOR ALL
  USING (public.is_admin(auth.uid()));

-- Deliveries policies
CREATE POLICY "Drivers can view their deliveries and admins can view all"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Drivers can update their deliveries and admins can update all"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Vehicle assignments policies
CREATE POLICY "Drivers can view their assignments and admins can view all"
  ON public.vehicle_assignments FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

-- Vehicles policies
CREATE POLICY "Drivers and admins can view vehicles"
  ON public.vehicles FOR SELECT
  USING (public.is_driver_or_admin(auth.uid()));

-- Fuel logs policies
CREATE POLICY "Drivers can view their fuel logs and admins can view all"
  ON public.fuel_logs FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Drivers can create their own fuel logs"
  ON public.fuel_logs FOR INSERT
  WITH CHECK (auth.uid() = driver_id OR public.is_admin(auth.uid()));

-- Maintenance logs policies
CREATE POLICY "Drivers and admins can view maintenance logs"
  ON public.maintenance_logs FOR SELECT
  USING (public.is_driver_or_admin(auth.uid()));

-- Tasks policies
CREATE POLICY "Admins can create tasks for drivers"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Delivery completions policies
CREATE POLICY "Drivers can view their completion records"
  ON public.delivery_completions FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create completion records"
  ON public.delivery_completions FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins can view all completion records"
  ON public.delivery_completions FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Reports policies
CREATE POLICY "Admins can view all reports" 
  ON public.reports 
  FOR SELECT 
  USING (public.is_current_user_admin());

CREATE POLICY "Users can view their own reports" 
  ON public.reports 
  FOR SELECT 
  USING (auth.uid() = generated_by);

CREATE POLICY "Admins can create reports" 
  ON public.reports 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = generated_by AND
    public.is_current_user_admin()
  );

CREATE POLICY "Admins can update reports" 
  ON public.reports 
  FOR UPDATE 
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete reports" 
  ON public.reports 
  FOR DELETE 
  USING (public.is_current_user_admin());
