
-- Enable Row Level Security on user_roles table and add proper policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own roles (needed for signup and manual updates)
CREATE POLICY "Users can insert their own roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own roles (needed for manual role updates)
CREATE POLICY "Users can update their own roles" 
  ON public.user_roles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own roles (for cleanup if needed)
CREATE POLICY "Users can delete their own roles" 
  ON public.user_roles 
  FOR DELETE 
  USING (auth.uid() = user_id);
