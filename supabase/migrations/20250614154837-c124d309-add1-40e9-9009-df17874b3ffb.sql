-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'employee', 'driver');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.delivery_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.vehicle_status AS ENUM ('active', 'maintenance', 'retired');
CREATE TYPE public.stock_movement_type AS ENUM ('inbound', 'outbound', 'damaged', 'returned', 'adjustment');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  department TEXT,
  employee_id TEXT UNIQUE,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_duration INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_by UUID REFERENCES public.profiles(id),
  status task_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT UNIQUE NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  fuel_type TEXT,
  current_mileage INTEGER DEFAULT 0,
  status vehicle_status DEFAULT 'active',
  last_service_date DATE,
  next_service_due INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_assignments table
CREATE TABLE public.vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id),
  assigned_date DATE NOT NULL,
  unassigned_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone TEXT,
  driver_id UUID REFERENCES public.profiles(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  status delivery_status DEFAULT 'pending',
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  proof_of_delivery JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_logs table
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  service_date DATE NOT NULL,
  next_service_mileage INTEGER,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fuel_logs table
CREATE TABLE public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id),
  fuel_amount DECIMAL(6,2) NOT NULL,
  cost DECIMAL(8,2),
  mileage INTEGER,
  fuel_date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_price DECIMAL(10,2),
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER,
  warehouse_location TEXT,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type stock_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reference_number TEXT,
  batch_number TEXT,
  expiry_date DATE,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  supplier_customer TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_items table
CREATE TABLE public.delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES public.inventory(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = user_uuid AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_employee_or_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = user_uuid AND role IN ('admin', 'employee'));
$$;

CREATE OR REPLACE FUNCTION public.is_driver_or_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = user_uuid AND role IN ('admin', 'driver'));
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile and admins can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile and admins can update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Admins can view user roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance and admins can view all"
  ON public.attendance FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance and admins can update all"
  ON public.attendance FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can view their assigned tasks and admins can view all"
  ON public.tasks FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR public.is_admin(auth.uid()));

CREATE POLICY "Admins and employees can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Assigned users and admins can update tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR public.is_admin(auth.uid()));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests and admins can view all"
  ON public.leave_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests and admins can update all"
  ON public.leave_requests FOR UPDATE
  USING ((auth.uid() = user_id AND status = 'pending') OR public.is_admin(auth.uid()));

-- RLS Policies for vehicles
CREATE POLICY "Drivers and admins can view vehicles"
  ON public.vehicles FOR SELECT
  USING (public.is_driver_or_admin(auth.uid()));

CREATE POLICY "Admins can insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update vehicles"
  ON public.vehicles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for vehicle_assignments
CREATE POLICY "Drivers can view their assignments and admins can view all"
  ON public.vehicle_assignments FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert vehicle assignments"
  ON public.vehicle_assignments FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update vehicle assignments"
  ON public.vehicle_assignments FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete vehicle assignments"
  ON public.vehicle_assignments FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for deliveries
CREATE POLICY "Drivers can view their deliveries and admins can view all"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can create deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Drivers can update their deliveries and admins can update all"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

-- RLS Policies for maintenance_logs
CREATE POLICY "Drivers and admins can view maintenance logs"
  ON public.maintenance_logs FOR SELECT
  USING (public.is_driver_or_admin(auth.uid()));

CREATE POLICY "Admins can insert maintenance logs"
  ON public.maintenance_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update maintenance logs"
  ON public.maintenance_logs FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete maintenance logs"
  ON public.maintenance_logs FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for fuel_logs
CREATE POLICY "Drivers can view their fuel logs and admins can view all"
  ON public.fuel_logs FOR SELECT
  USING (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Drivers can create their own fuel logs"
  ON public.fuel_logs FOR INSERT
  WITH CHECK (auth.uid() = driver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can update fuel logs"
  ON public.fuel_logs FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for inventory
CREATE POLICY "Employees and admins can view inventory"
  ON public.inventory FOR SELECT
  USING (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins can insert inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update inventory"
  ON public.inventory FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete inventory"
  ON public.inventory FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for stock_movements
CREATE POLICY "Employees and admins can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Employees and admins can create stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins can update stock movements"
  ON public.stock_movements FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for delivery_items
CREATE POLICY "Users can view delivery items based on delivery access"
  ON public.delivery_items FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM public.deliveries d 
      WHERE d.id = delivery_id 
      AND (auth.uid() = d.driver_id OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can insert delivery items"
  ON public.delivery_items FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update delivery items"
  ON public.delivery_items FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete delivery items"
  ON public.delivery_items FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Create trigger function for profile creation
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

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles 
  SET role = 'admin' 
  WHERE user_id = (
    SELECT id FROM public.profiles WHERE email = admin_email
  );
END;
$$;
