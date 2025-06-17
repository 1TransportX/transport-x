
export interface Employee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  department: string | null;
  hire_date: string | null;
  is_active: boolean;
  role: 'admin' | 'driver';
  created_at?: string;
  updated_at?: string;
}
