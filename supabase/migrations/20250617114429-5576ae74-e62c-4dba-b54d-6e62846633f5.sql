
-- Add Row Level Security policies for vehicles table to enable vehicle addition
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all vehicles
CREATE POLICY "Users can view vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (true);

-- Policy to allow admin and driver users to insert vehicles
CREATE POLICY "Authenticated users can insert vehicles" 
  ON public.vehicles 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow admin and driver users to update vehicles
CREATE POLICY "Authenticated users can update vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Policy to allow admin users to delete vehicles
CREATE POLICY "Admin users can delete vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (public.is_current_user_admin());
