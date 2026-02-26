export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_route_assignments: {
        Row: {
          assignment_date: string
          created_at: string | null
          created_by: string | null
          delivery_ids: string[] | null
          driver_id: string
          estimated_duration: number | null
          id: string
          optimized_order: number[] | null
          status: string | null
          total_distance: number | null
          updated_at: string | null
        }
        Insert: {
          assignment_date: string
          created_at?: string | null
          created_by?: string | null
          delivery_ids?: string[] | null
          driver_id: string
          estimated_duration?: number | null
          id?: string
          optimized_order?: number[] | null
          status?: string | null
          total_distance?: number | null
          updated_at?: string | null
        }
        Update: {
          assignment_date?: string
          created_at?: string | null
          created_by?: string | null
          delivery_ids?: string[] | null
          driver_id?: string
          estimated_duration?: number | null
          id?: string
          optimized_order?: number[] | null
          status?: string | null
          total_distance?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          scheduled_date: string | null
          status: string | null
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
          scheduled_date?: string | null
          status?: string | null
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
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
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
          delivery_id: string
          driver_id: string
          fuel_cost: number | null
          fuel_receipt_url: string | null
          fuel_refilled: boolean | null
          id: string
          mileage_after: number | null
          mileage_before: number | null
          odometer_reading: number | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_id: string
          driver_id: string
          fuel_cost?: number | null
          fuel_receipt_url?: string | null
          fuel_refilled?: boolean | null
          id?: string
          mileage_after?: number | null
          mileage_before?: number | null
          odometer_reading?: number | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string
          driver_id?: string
          fuel_cost?: number | null
          fuel_receipt_url?: string | null
          fuel_refilled?: boolean | null
          id?: string
          mileage_after?: number | null
          mileage_before?: number | null
          odometer_reading?: number | null
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
      fuel_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          driver_id: string | null
          fuel_amount: number | null
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
          fuel_amount?: number | null
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
          fuel_amount?: number | null
          fuel_date?: string
          id?: string
          location?: string | null
          mileage?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          status: string | null
          user_id: string
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
          status?: string | null
          user_id: string
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
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_type: string
          performed_by: string | null
          service_date: string | null
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type: string
          performed_by?: string | null
          service_date?: string | null
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type?: string
          performed_by?: string | null
          service_date?: string | null
          vehicle_id?: string
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
          created_at: string | null
          data: Json | null
          generated_by: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          generated_by?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          generated_by?: string | null
          id?: string
          title?: string
        }
        Relationships: []
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_assignments: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          unassigned_date: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          unassigned_date?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          unassigned_date?: string | null
          vehicle_id?: string
        }
        Relationships: [
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "driver"],
    },
  },
} as const
