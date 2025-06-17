
-- Create daily_route_assignments table to track driver assignments for specific dates
CREATE TABLE public.daily_route_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_date DATE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id),
  delivery_ids UUID[] NOT NULL DEFAULT '{}',
  optimized_order INTEGER[] DEFAULT '{}',
  total_distance NUMERIC DEFAULT 0,
  estimated_duration INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Add indexes for better performance
CREATE INDEX idx_daily_route_assignments_date ON public.daily_route_assignments(assignment_date);
CREATE INDEX idx_daily_route_assignments_driver ON public.daily_route_assignments(driver_id);
CREATE INDEX idx_daily_route_assignments_status ON public.daily_route_assignments(status);

-- Enable RLS
ALTER TABLE public.daily_route_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view daily route assignments" 
  ON public.daily_route_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage daily route assignments" 
  ON public.daily_route_assignments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_daily_route_assignments
  BEFORE UPDATE ON public.daily_route_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
