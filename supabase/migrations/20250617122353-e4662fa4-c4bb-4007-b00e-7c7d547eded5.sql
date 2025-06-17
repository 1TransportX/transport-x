
-- Fix the vehicle_assignments RLS policies to allow proper insertions
DROP POLICY IF EXISTS "Users can view vehicle assignments" ON public.vehicle_assignments;
DROP POLICY IF EXISTS "Admins can manage vehicle assignments" ON public.vehicle_assignments;
DROP POLICY IF EXISTS "Drivers can view their assignments" ON public.vehicle_assignments;

-- Create proper RLS policies for vehicle_assignments
CREATE POLICY "Admins can manage all vehicle assignments" 
  ON public.vehicle_assignments 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Drivers can view their own assignments" 
  ON public.vehicle_assignments 
  FOR SELECT 
  USING (driver_id = auth.uid() OR public.is_admin(auth.uid()));

-- Ensure admins can insert vehicle assignments
CREATE POLICY "Admins can insert vehicle assignments" 
  ON public.vehicle_assignments 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- Ensure admins can update vehicle assignments  
CREATE POLICY "Admins can update vehicle assignments" 
  ON public.vehicle_assignments 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

-- Ensure admins can delete vehicle assignments
CREATE POLICY "Admins can delete vehicle assignments" 
  ON public.vehicle_assignments 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));
