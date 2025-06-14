
-- Create policies that don't already exist
CREATE POLICY "Admins and employees can view inventory" 
  ON public.inventory 
  FOR SELECT 
  USING (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins and employees can insert inventory" 
  ON public.inventory 
  FOR INSERT 
  WITH CHECK (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins and employees can update inventory" 
  ON public.inventory 
  FOR UPDATE 
  USING (public.is_employee_or_admin(auth.uid()));

-- Enable RLS on stock_movements table if not already enabled
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for stock movements
CREATE POLICY "Admins and employees can view stock movements" 
  ON public.stock_movements 
  FOR SELECT 
  USING (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins and employees can insert stock movements" 
  ON public.stock_movements 
  FOR INSERT 
  WITH CHECK (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins and employees can update stock movements" 
  ON public.stock_movements 
  FOR UPDATE 
  USING (public.is_employee_or_admin(auth.uid()));

CREATE POLICY "Admins can delete stock movements" 
  ON public.stock_movements 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));
