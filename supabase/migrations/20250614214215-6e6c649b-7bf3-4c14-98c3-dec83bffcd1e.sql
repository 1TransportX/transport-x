
-- Check if we need to add any missing columns or improve the vehicle assignment structure
-- Add GPS tracking columns to attendance table for better location tracking
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id);

-- Create an index for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_attendance_location ON public.attendance(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_vehicle_user ON public.attendance(vehicle_id, user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_active ON public.vehicle_assignments(driver_id, vehicle_id) WHERE is_active = true;

-- Add RLS policies for vehicle assignments
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vehicle assignments" 
  ON public.vehicle_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage vehicle assignments" 
  ON public.vehicle_assignments 
  FOR ALL 
  USING (public.is_current_user_admin());

CREATE POLICY "Drivers can view their assignments" 
  ON public.vehicle_assignments 
  FOR SELECT 
  USING (driver_id = auth.uid());
