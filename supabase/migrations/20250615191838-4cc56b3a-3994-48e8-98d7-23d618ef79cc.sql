
-- Create storage bucket for fuel receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('fuel-receipts', 'fuel-receipts', true);

-- Create storage policies for fuel receipts
CREATE POLICY "Users can upload fuel receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fuel-receipts');

CREATE POLICY "Users can view fuel receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'fuel-receipts');

CREATE POLICY "Users can update fuel receipts" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fuel-receipts');

CREATE POLICY "Users can delete fuel receipts" ON storage.objects
  FOR DELETE USING (bucket_id = 'fuel-receipts');

-- Add completion tracking columns to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN completion_mileage INTEGER,
ADD COLUMN completion_odometer INTEGER,
ADD COLUMN fuel_receipt_url TEXT,
ADD COLUMN fuel_cost NUMERIC,
ADD COLUMN completion_recorded_at TIMESTAMP WITH TIME ZONE;

-- Create delivery completion logs table for tracking
CREATE TABLE public.delivery_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users,
  vehicle_id UUID REFERENCES public.vehicles(id),
  mileage_before INTEGER,
  mileage_after INTEGER NOT NULL,
  odometer_reading INTEGER NOT NULL,
  fuel_refilled BOOLEAN DEFAULT false,
  fuel_cost NUMERIC,
  fuel_receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on delivery_completions
ALTER TABLE public.delivery_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their completion records" 
  ON public.delivery_completions 
  FOR SELECT 
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create completion records" 
  ON public.delivery_completions 
  FOR INSERT 
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admin can view all completion records" 
  ON public.delivery_completions 
  FOR SELECT 
  USING (public.is_current_user_admin());

-- Create trigger to update vehicle mileage when delivery is completed
CREATE OR REPLACE FUNCTION update_vehicle_mileage_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the vehicle's current mileage with the completion odometer reading
  UPDATE public.vehicles 
  SET current_mileage = NEW.odometer_reading,
      updated_at = now()
  WHERE id = NEW.vehicle_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_mileage
  AFTER INSERT ON public.delivery_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_mileage_on_completion();
