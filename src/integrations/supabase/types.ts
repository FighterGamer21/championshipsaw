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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bans: {
        Row: {
          banned_until: string | null
          created_at: string
          created_by: string | null
          discord_username: string | null
          id: string
          ign: string
          reason: string
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          created_by?: string | null
          discord_username?: string | null
          id?: string
          ign: string
          reason?: string
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          created_by?: string | null
          discord_username?: string | null
          id?: string
          ign?: string
          reason?: string
        }
        Relationships: []
      }
      eliminations: {
        Row: {
          created_at: string
          day: number
          id: string
          player_id: string
          reason: string | null
          round_name: string
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          player_id: string
          reason?: string | null
          round_name: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          player_id?: string
          reason?: string | null
          round_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "eliminations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          can_attend_all_days: boolean
          checked_in_at: string | null
          current_day: number
          current_round: string | null
          discord_username: string
          id: string
          ign: string
          minecraft_version: string
          registered_at: string
          status: Database["public"]["Enums"]["player_status"]
          timezone: string
        }
        Insert: {
          can_attend_all_days?: boolean
          checked_in_at?: string | null
          current_day?: number
          current_round?: string | null
          discord_username: string
          id?: string
          ign: string
          minecraft_version: string
          registered_at?: string
          status?: Database["public"]["Enums"]["player_status"]
          timezone: string
        }
        Update: {
          can_attend_all_days?: boolean
          checked_in_at?: string | null
          current_day?: number
          current_round?: string | null
          discord_username?: string
          id?: string
          ign?: string
          minecraft_version?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["player_status"]
          timezone?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          banner_url: string | null
          category: Database["public"]["Enums"]["post_category"]
          content: string
          created_at: string
          excerpt: string
          id: string
          is_featured: boolean
          is_published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["post_category"]
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["post_category"]
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          created_at: string
          day: number
          ended_at: string | null
          id: string
          round_name: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          day: number
          ended_at?: string | null
          id?: string
          round_name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          day?: number
          ended_at?: string | null
          id?: string
          round_name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          api_key: string | null
          current_day: number
          current_round: string | null
          discord_link: string | null
          event_name: string
          event_start_at: string | null
          event_status: string
          footer_text: string
          homepage_subtitle: string
          homepage_title: string
          id: number
          max_registrations: number | null
          prize_details: string
          registration_open: boolean
          rules_text: string
          server_ip: string
          store_link: string | null
          updated_at: string
          visible_sections: Json
        }
        Insert: {
          api_key?: string | null
          current_day?: number
          current_round?: string | null
          discord_link?: string | null
          event_name?: string
          event_start_at?: string | null
          event_status?: string
          footer_text?: string
          homepage_subtitle?: string
          homepage_title?: string
          id?: number
          max_registrations?: number | null
          prize_details?: string
          registration_open?: boolean
          rules_text?: string
          server_ip?: string
          store_link?: string | null
          updated_at?: string
          visible_sections?: Json
        }
        Update: {
          api_key?: string | null
          current_day?: number
          current_round?: string | null
          discord_link?: string | null
          event_name?: string
          event_start_at?: string | null
          event_status?: string
          footer_text?: string
          homepage_subtitle?: string
          homepage_title?: string
          id?: number
          max_registrations?: number | null
          prize_details?: string
          registration_open?: boolean
          rules_text?: string
          server_ip?: string
          store_link?: string | null
          updated_at?: string
          visible_sections?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      claim_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _uid: string }; Returns: boolean }
      is_ign_banned: { Args: { _ign: string }; Returns: boolean }
      is_moderator_or_above: { Args: { _uid: string }; Returns: boolean }
      is_owner: { Args: { _uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner"
      player_status:
        | "REGISTERED"
        | "CHECKED_IN"
        | "ALIVE"
        | "QUALIFIED"
        | "ELIMINATED"
        | "SEMI_FINALIST"
        | "FINALIST"
        | "TOP_3"
        | "CHAMPION"
        | "DISQUALIFIED"
        | "SPECTATOR"
        | "BANNED"
      post_category:
        | "announcement"
        | "event_update"
        | "result"
        | "rule_update"
        | "prize_update"
        | "maintenance"
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
      app_role: ["admin", "moderator", "user", "owner"],
      player_status: [
        "REGISTERED",
        "CHECKED_IN",
        "ALIVE",
        "QUALIFIED",
        "ELIMINATED",
        "SEMI_FINALIST",
        "FINALIST",
        "TOP_3",
        "CHAMPION",
        "DISQUALIFIED",
        "SPECTATOR",
        "BANNED",
      ],
      post_category: [
        "announcement",
        "event_update",
        "result",
        "rule_update",
        "prize_update",
        "maintenance",
      ],
    },
  },
} as const
