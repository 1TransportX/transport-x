
-- Add latitude and longitude columns to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;

-- Create routes table for optimized route information
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES auth.users,
  vehicle_id UUID REFERENCES public.vehicles(id),
  route_name TEXT NOT NULL,
  start_location TEXT,
  start_latitude NUMERIC,
  start_longitude NUMERIC,
  total_distance NUMERIC,
  estimated_duration INTEGER, -- in minutes
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create route_stops table to maintain delivery order in routes
CREATE TABLE public.route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  actual_arrival_time TIMESTAMP WITH TIME ZONE,
  distance_from_previous NUMERIC,
  duration_from_previous INTEGER, -- in minutes
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for routes table
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routes they're involved in" 
  ON public.routes 
  FOR SELECT 
  USING (
    driver_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'employee'))
  );

CREATE POLICY "Admin and employees can manage routes" 
  ON public.routes 
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'employee'))
  );

-- Add RLS policies for route_stops table
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view route stops for their routes" 
  ON public.route_stops 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.routes r 
      WHERE r.id = route_id AND (
        r.driver_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'employee'))
      )
    )
  );

CREATE POLICY "Admin and employees can manage route stops" 
  ON public.route_stops 
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'employee'))
  );

-- Add indexes for better performance
CREATE INDEX idx_deliveries_coordinates ON public.deliveries(latitude, longitude);
CREATE INDEX idx_routes_driver ON public.routes(driver_id);
CREATE INDEX idx_route_stops_route ON public.route_stops(route_id, stop_order);
