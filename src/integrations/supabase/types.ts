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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          group_size: number
          id: string
          notes: string | null
          qr_code_data: string | null
          status: string
          user_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          group_size?: number
          id?: string
          notes?: string | null
          qr_code_data?: string | null
          status?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          group_size?: number
          id?: string
          notes?: string | null
          qr_code_data?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_capacity: {
        Row: {
          current_count: number
          date: string
          id: string
          max_capacity: number
        }
        Insert: {
          current_count?: number
          date: string
          id?: string
          max_capacity?: number
        }
        Update: {
          current_count?: number
          date?: string
          id?: string
          max_capacity?: number
        }
        Relationships: []
      }
      hiker_locations: {
        Row: {
          altitude: number | null
          id: string
          latitude: number
          longitude: number
          session_id: string
          timestamp: string
        }
        Insert: {
          altitude?: number | null
          id?: string
          latitude: number
          longitude: number
          session_id: string
          timestamp?: string
        }
        Update: {
          altitude?: number | null
          id?: string
          latitude?: number
          longitude?: number
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiker_locations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "hiker_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      hiker_sessions: {
        Row: {
          booking_id: string | null
          created_at: string
          end_time: string | null
          id: string
          start_time: string
          status: string
          total_distance_km: number | null
          trail_zone_id: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string
          total_distance_km?: number | null
          trail_zone_id?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string
          total_distance_km?: number | null
          trail_zone_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiker_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiker_sessions_trail_zone_id_fkey"
            columns: ["trail_zone_id"]
            isOneToOne: false
            referencedRelation: "trail_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          emergency_contact: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          emergency_contact?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          emergency_contact?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          review_text: string
          reviewer_name: string
          trail_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text?: string
          reviewer_name?: string
          trail_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text?: string
          reviewer_name?: string
          trail_name?: string
          user_id?: string
        }
        Relationships: []
      }
      trail_reports: {
        Row: {
          condition: string
          created_at: string
          description: string | null
          id: string
          ranger_id: string
          zone_id: string
        }
        Insert: {
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          ranger_id: string
          zone_id: string
        }
        Update: {
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          ranger_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_reports_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "trail_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_zones: {
        Row: {
          coordinates_json: Json
          created_at: string
          description: string | null
          difficulty: string
          elevation_meters: number | null
          id: string
          max_capacity: number
          name: string
          status: string
        }
        Insert: {
          coordinates_json?: Json
          created_at?: string
          description?: string | null
          difficulty?: string
          elevation_meters?: number | null
          id?: string
          max_capacity?: number
          name: string
          status?: string
        }
        Update: {
          coordinates_json?: Json
          created_at?: string
          description?: string | null
          difficulty?: string
          elevation_meters?: number | null
          id?: string
          max_capacity?: number
          name?: string
          status?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "ranger" | "hiker"
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
      app_role: ["admin", "ranger", "hiker"],
    },
  },
} as const
