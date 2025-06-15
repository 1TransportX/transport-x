export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          break_duration: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          total_hours: number | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          break_duration?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          total_hours?: number | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          break_duration?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          total_hours?: number | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          completed_at: string | null
          completion_mileage: number | null
          completion_odometer: number | null
          completion_recorded_at: string | null
          created_at: string | null
          customer_address: string
          customer_name: string
          customer_phone: string | null
          delivery_number: string
          driver_id: string | null
          fuel_cost: number | null
          fuel_receipt_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          proof_of_delivery: Json | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_mileage?: number | null
          completion_odometer?: number | null
          completion_recorded_at?: string | null
          created_at?: string | null
          customer_address: string
          customer_name: string
          customer_phone?: string | null
          delivery_number: string
          driver_id?: string | null
          fuel_cost?: number | null
          fuel_receipt_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          proof_of_delivery?: Json | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_mileage?: number | null
          completion_odometer?: number | null
          completion_recorded_at?: string | null
          created_at?: string | null
          customer_address?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_number?: string
          driver_id?: string | null
          fuel_cost?: number | null
          fuel_receipt_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          proof_of_delivery?: Json | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_completions: {
        Row: {
          created_at: string | null
          delivery_id: string | null
          driver_id: string | null
          fuel_cost: number | null
          fuel_receipt_url: string | null
          fuel_refilled: boolean | null
          id: string
          mileage_after: number
          mileage_before: number | null
          odometer_reading: number
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_id?: string | null
          driver_id?: string | null
          fuel_cost?: number | null
          fuel_receipt_url?: string | null
          fuel_refilled?: boolean | null
          id?: string
          mileage_after: number
          mileage_before?: number | null
          odometer_reading: number
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string | null
          driver_id?: string | null
          fuel_cost?: number | null
          fuel_receipt_url?: string | null
          fuel_refilled?: boolean | null
          id?: string
          mileage_after?: number
          mileage_before?: number | null
          odometer_reading?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_completions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_completions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_items: {
        Row: {
          created_at: string | null
          delivery_id: string | null
          id: string
          inventory_id: string | null
          quantity: number
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          inventory_id?: string | null
          quantity: number
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          inventory_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_items_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          driver_id: string | null
          fuel_amount: number
          fuel_date: string
          id: string
          location: string | null
          mileage: number | null
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          driver_id?: string | null
          fuel_amount: number
          fuel_date: string
          id?: string
          location?: string | null
          mileage?: number | null
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          driver_id?: string | null
          fuel_amount?: number
          fuel_date?: string
          id?: string
          location?: string | null
          mileage?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          maximum_stock: number | null
          minimum_stock: number | null
          product_name: string
          sku: string
          unit_price: number | null
          updated_at: string | null
          warehouse_location: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          maximum_stock?: number | null
          minimum_stock?: number | null
          product_name: string
          sku: string
          unit_price?: number | null
          updated_at?: string | null
          warehouse_location?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          maximum_stock?: number | null
          minimum_stock?: number | null
          product_name?: string
          sku?: string
          unit_price?: number | null
          updated_at?: string | null
          warehouse_location?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_type: string
          next_service_mileage: number | null
          performed_by: string | null
          service_date: string
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type: string
          next_service_mileage?: number | null
          performed_by?: string | null
          service_date: string
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type?: string
          next_service_mileage?: number | null
          performed_by?: string | null
          service_date?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          employee_id: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          employee_id?: string | null
          first_name?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data: Json
          generated_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          generated_by: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          generated_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          actual_arrival_time: string | null
          created_at: string | null
          delivery_id: string | null
          distance_from_previous: number | null
          duration_from_previous: number | null
          estimated_arrival_time: string | null
          id: string
          route_id: string | null
          status: string | null
          stop_order: number
        }
        Insert: {
          actual_arrival_time?: string | null
          created_at?: string | null
          delivery_id?: string | null
          distance_from_previous?: number | null
          duration_from_previous?: number | null
          estimated_arrival_time?: string | null
          id?: string
          route_id?: string | null
          status?: string | null
          stop_order: number
        }
        Update: {
          actual_arrival_time?: string | null
          created_at?: string | null
          delivery_id?: string | null
          distance_from_previous?: number | null
          duration_from_previous?: number | null
          estimated_arrival_time?: string | null
          id?: string
          route_id?: string | null
          status?: string | null
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string | null
          driver_id: string | null
          estimated_duration: number | null
          id: string
          route_name: string
          start_latitude: number | null
          start_location: string | null
          start_longitude: number | null
          status: string | null
          total_distance: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          estimated_duration?: number | null
          id?: string
          route_name: string
          start_latitude?: number | null
          start_location?: string | null
          start_longitude?: number | null
          status?: string | null
          total_distance?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          estimated_duration?: number | null
          id?: string
          route_name?: string
          start_latitude?: number | null
          start_location?: string | null
          start_longitude?: number | null
          status?: string | null
          total_distance?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_number: string | null
          cost_per_unit: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          inventory_id: string | null
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          performed_by: string | null
          quantity: number
          reference_number: string | null
          supplier_customer: string | null
          total_cost: number | null
        }
        Insert: {
          batch_number?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          inventory_id?: string | null
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          performed_by?: string | null
          quantity: number
          reference_number?: string | null
          supplier_customer?: string | null
          total_cost?: number | null
        }
        Update: {
          batch_number?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          inventory_id?: string | null
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          reference_number?: string | null
          supplier_customer?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assignments: {
        Row: {
          assigned_date: string
          created_at: string | null
          driver_id: string | null
          id: string
          is_active: boolean | null
          unassigned_date: string | null
          vehicle_id: string | null
        }
        Insert: {
          assigned_date: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          unassigned_date?: string | null
          vehicle_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          unassigned_date?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          current_mileage: number | null
          fuel_economy: number | null
          fuel_type: string | null
          id: string
          last_service_date: string | null
          make: string | null
          model: string | null
          next_service_due: number | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at: string | null
          vehicle_number: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          current_mileage?: number | null
          fuel_economy?: number | null
          fuel_type?: string | null
          id?: string
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          next_service_due?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string | null
          vehicle_number: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          current_mileage?: number | null
          fuel_economy?: number | null
          fuel_type?: string | null
          id?: string
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          next_service_due?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string | null
          vehicle_number?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: { admin_email: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_driver_or_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_employee_or_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      delivery_status: "pending" | "in_progress" | "completed" | "cancelled"
      leave_status: "pending" | "approved" | "rejected"
      stock_movement_type:
        | "inbound"
        | "outbound"
        | "damaged"
        | "returned"
        | "adjustment"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "employee" | "driver"
      vehicle_status: "active" | "maintenance" | "retired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      delivery_status: ["pending", "in_progress", "completed", "cancelled"],
      leave_status: ["pending", "approved", "rejected"],
      stock_movement_type: [
        "inbound",
        "outbound",
        "damaged",
        "returned",
        "adjustment",
      ],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["admin", "employee", "driver"],
      vehicle_status: ["active", "maintenance", "retired"],
    },
  },
} as const
