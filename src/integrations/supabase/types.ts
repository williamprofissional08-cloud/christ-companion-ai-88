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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          content: Json
          created_at: string
          day: string
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          day: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          day?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          content: string | null
          created_at: string
          id: string
          kind: string
          reference: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          reference: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          reference?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          slug: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          kind: string
          slug: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          slug?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          progress: number
          target: number
          title: string
          unit: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          target?: number
          title: string
          unit?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          target?: number
          title?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_days: {
        Row: {
          day: string
          habits: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          day: string
          habits?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          habits?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          answered: boolean
          content: string
          created_at: string
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          answered?: boolean
          content?: string
          created_at?: string
          id?: string
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          answered?: boolean
          content?: string
          created_at?: string
          id?: string
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_progress: {
        Row: {
          completed_days: number[]
          id: string
          notes: Json
          plan_slug: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_days?: number[]
          id?: string
          notes?: Json
          plan_slug: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_days?: number[]
          id?: string
          notes?: Json
          plan_slug?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      track_progress: {
        Row: {
          checkpoints: Json
          completed_steps: number[]
          id: string
          reviews: Json
          started_at: string
          track_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checkpoints?: Json
          completed_steps?: number[]
          id?: string
          reviews?: Json
          started_at?: string
          track_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checkpoints?: Json
          completed_steps?: number[]
          id?: string
          reviews?: Json
          started_at?: string
          track_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          challenge_type: string
          created_at: string
          daily_goal: string | null
          interests: string[]
          onboarding_completed: boolean
          reading_minutes: number
          reminder_paused_until: string | null
          reminder_repeat: string
          reminder_time: string
          reminders_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          daily_goal?: string | null
          interests?: string[]
          onboarding_completed?: boolean
          reading_minutes?: number
          reminder_paused_until?: string | null
          reminder_repeat?: string
          reminder_time?: string
          reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          daily_goal?: string | null
          interests?: string[]
          onboarding_completed?: boolean
          reading_minutes?: number
          reminder_paused_until?: string | null
          reminder_repeat?: string
          reminder_time?: string
          reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
