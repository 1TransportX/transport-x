// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tbxfmpdageigubpvfqto.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGZtcGRhZ2VpZ3VicHZmcXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTUxODUsImV4cCI6MjA2NTQ5MTE4NX0.1ZouECsGGm3l84izz3G1i4kwlOz1GBIMdPA9ZFcO9Ag";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);