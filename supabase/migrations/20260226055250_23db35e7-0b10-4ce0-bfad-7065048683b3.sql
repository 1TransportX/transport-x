
-- ========================
-- Create enum
-- ========================
CREATE TYPE public.app_role AS ENUM ('admin', 'driver');

-- ========================
-- 1. user_roles table (FIRST - needed by has_role)
-- ========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'driver',
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 2. profiles table
-- ========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  department TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 3. vehicles table
-- ========================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL UNIQUE,
  make TEXT, model TEXT, year INTEGER, fuel_type TEXT,
  current_mileage NUMERIC DEFAULT 0, fuel_economy NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  last_service_date DATE, next_service_due NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 4. vehicle_assignments
-- ========================
CREATE TABLE public.vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT CURRENT_DATE, unassigned_date DATE,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view assignments" ON public.vehicle_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assignments" ON public.vehicle_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert assignments" ON public.vehicle_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 5. deliveries
-- ========================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT NOT NULL, customer_name TEXT NOT NULL, customer_address TEXT NOT NULL,
  customer_phone TEXT, scheduled_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT, vehicle_id UUID REFERENCES public.vehicles(id), driver_id UUID REFERENCES auth.users(id),
  latitude NUMERIC, longitude NUMERIC, completed_at TIMESTAMPTZ,
  completion_mileage NUMERIC, completion_odometer NUMERIC,
  fuel_receipt_url TEXT, fuel_cost NUMERIC, completion_recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view deliveries" ON public.deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage deliveries" ON public.deliveries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers can insert own deliveries" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update own deliveries" ON public.deliveries FOR UPDATE TO authenticated USING (auth.uid() = driver_id);

-- ========================
-- 6. delivery_completions
-- ========================
CREATE TABLE public.delivery_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  mileage_before NUMERIC, mileage_after NUMERIC, odometer_reading NUMERIC,
  fuel_refilled BOOLEAN DEFAULT false, fuel_cost NUMERIC, fuel_receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view completions" ON public.delivery_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers can insert completions" ON public.delivery_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins can manage completions" ON public.delivery_completions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 7. daily_route_assignments
-- ========================
CREATE TABLE public.daily_route_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_date DATE NOT NULL, driver_id UUID NOT NULL REFERENCES auth.users(id),
  delivery_ids UUID[] DEFAULT '{}', optimized_order INTEGER[] DEFAULT '{}',
  total_distance NUMERIC DEFAULT 0, estimated_duration NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view route assignments" ON public.daily_route_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage route assignments" ON public.daily_route_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert route assignments" ON public.daily_route_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 8. leave_requests
-- ========================
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
  reason TEXT, status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Users can view own leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage leave requests" ON public.leave_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 9. tasks
-- ========================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES auth.users(id), assigned_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);
CREATE POLICY "Admins can view all tasks" ON public.tasks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update assigned tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);
CREATE POLICY "Admins can manage all tasks" ON public.tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 10. attendance
-- ========================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(), clock_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 11. maintenance_logs
-- ========================
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, service_date DATE, description TEXT,
  performed_by TEXT, cost NUMERIC, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view maintenance logs" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage maintenance logs" ON public.maintenance_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert maintenance logs" ON public.maintenance_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 12. fuel_logs
-- ========================
CREATE TABLE public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id), driver_id UUID REFERENCES auth.users(id),
  fuel_date DATE NOT NULL, fuel_amount NUMERIC DEFAULT 0, cost NUMERIC DEFAULT 0,
  mileage NUMERIC, location TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view fuel logs" ON public.fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers can insert fuel logs" ON public.fuel_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins can manage fuel logs" ON public.fuel_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- 13. reports
-- ========================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, data JSONB, generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Authenticated users can view reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- updated_at trigger function
-- ========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_route_assignments_updated_at BEFORE UPDATE ON public.daily_route_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- Auto-create profile + role on signup
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'driver'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- Storage bucket
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('fuel-receipts', 'fuel-receipts', true);
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fuel-receipts');
CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'fuel-receipts');
