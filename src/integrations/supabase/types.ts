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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      builds: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          role: string | null
          ship_instance_id: string | null
          user_ship_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          role?: string | null
          ship_instance_id?: string | null
          user_ship_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          role?: string | null
          ship_instance_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "builds_ship_instance_id_fkey"
            columns: ["ship_instance_id"]
            isOneToOne: false
            referencedRelation: "ship_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          career: string | null
          created_at: string
          faction: string | null
          id: string
          level: number | null
          name: string
          notes: string | null
          species: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career?: string | null
          created_at?: string
          faction?: string | null
          id?: string
          level?: number | null
          name: string
          notes?: string | null
          species?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career?: string | null
          created_at?: string
          faction?: string | null
          id?: string
          level?: number | null
          name?: string
          notes?: string | null
          species?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loadouts: {
        Row: {
          build_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          build_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          build_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loadouts_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ship_classes: {
        Row: {
          created_at: string
          faction: string | null
          id: string
          name: string
          ship_type: string | null
          slug: string
          tier: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          faction?: string | null
          id?: string
          name: string
          ship_type?: string | null
          slug: string
          tier?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          faction?: string | null
          id?: string
          name?: string
          ship_type?: string | null
          slug?: string
          tier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ship_instances: {
        Row: {
          character_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          registry: string | null
          ship_class_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          registry?: string | null
          ship_class_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          registry?: string | null
          ship_class_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ship_instances_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ship_instances_ship_class_id_fkey"
            columns: ["ship_class_id"]
            isOneToOne: false
            referencedRelation: "ship_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_ships: {
        Row: {
          aft_weapon_slots: number | null
          base_hull: number | null
          base_shields: number | null
          bridge_officer_stations: Json | null
          created_at: string
          data_version: string | null
          description: string | null
          engineering_console_slots: number | null
          experimental_weapon_slot: boolean | null
          faction: string | null
          fore_weapon_slots: number | null
          hangar_bays: number | null
          hull_modifier: number | null
          id: string
          image_url: string | null
          impulse_modifier: number | null
          inertia: number | null
          name: string
          science_console_slots: number | null
          shield_modifier: number | null
          ship_class: string | null
          ship_trait: string | null
          source_reference: string | null
          source_key: string | null
          source_url: string | null
          verified_at: string | null
          special_console: string | null
          special_mechanics: string | null
          special_weapons: string | null
          tactical_console_slots: number | null
          tier: string | null
          turn_rate: number | null
          universal_console_slots: number | null
          updated_at: string
        }
        Insert: {
          aft_weapon_slots?: number | null
          base_hull?: number | null
          base_shields?: number | null
          bridge_officer_stations?: Json | null
          created_at?: string
          data_version?: string | null
          description?: string | null
          engineering_console_slots?: number | null
          experimental_weapon_slot?: boolean | null
          faction?: string | null
          fore_weapon_slots?: number | null
          hangar_bays?: number | null
          hull_modifier?: number | null
          id?: string
          image_url?: string | null
          impulse_modifier?: number | null
          inertia?: number | null
          name: string
          science_console_slots?: number | null
          shield_modifier?: number | null
          ship_class?: string | null
          ship_trait?: string | null
          source_reference?: string | null
          special_console?: string | null
          special_mechanics?: string | null
          special_weapons?: string | null
          tactical_console_slots?: number | null
          tier?: string | null
          turn_rate?: number | null
          universal_console_slots?: number | null
          updated_at?: string
        }
        Update: {
          aft_weapon_slots?: number | null
          base_hull?: number | null
          base_shields?: number | null
          bridge_officer_stations?: Json | null
          created_at?: string
          data_version?: string | null
          description?: string | null
          engineering_console_slots?: number | null
          experimental_weapon_slot?: boolean | null
          faction?: string | null
          fore_weapon_slots?: number | null
          hangar_bays?: number | null
          hull_modifier?: number | null
          id?: string
          image_url?: string | null
          impulse_modifier?: number | null
          inertia?: number | null
          name?: string
          science_console_slots?: number | null
          shield_modifier?: number | null
          ship_class?: string | null
          ship_trait?: string | null
          source_reference?: string | null
          special_console?: string | null
          special_mechanics?: string | null
          special_weapons?: string | null
          tactical_console_slots?: number | null
          tier?: string | null
          turn_rate?: number | null
          universal_console_slots?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sto_ship_catalog_imports: {
        Row: {
          id: string
          source_key: string
          source_url: string | null
          payload: Json
          status: string
          imported_by: string | null
          created_at: string
          applied_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          source_key: string
          source_url?: string | null
          payload: Json
          status?: string
          imported_by?: string | null
          created_at?: string
          applied_at?: string | null
        }
        Update: {
          id?: string
          source_key?: string
          source_url?: string | null
          payload?: Json
          status?: string
          imported_by?: string | null
          created_at?: string
          applied_at?: string | null
          error_message?: string | null
        }
        Relationships: []
      }
      user_ships: {
        Row: {
          character_id: string
          created_at: string
          current_build_id: string | null
          custom_name: string
          date_acquired: string | null
          id: string
          notes: string | null
          ownership_status: string
          sto_ship_id: string
          t6_upgraded: boolean
          t6x_upgraded: boolean
          t6x2_upgraded: boolean
          theme_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          current_build_id?: string | null
          custom_name: string
          date_acquired?: string | null
          id?: string
          notes?: string | null
          ownership_status?: string
          sto_ship_id: string
          t6_upgraded?: boolean
          t6x_upgraded?: boolean
          t6x2_upgraded?: boolean
          theme_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          current_build_id?: string | null
          custom_name?: string
          date_acquired?: string | null
          id?: string
          notes?: string | null
          ownership_status?: string
          sto_ship_id?: string
          t6_upgraded?: boolean
          t6x_upgraded?: boolean
          t6x2_upgraded?: boolean
          theme_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ships_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ships_current_build_id_fkey"
            columns: ["current_build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ships_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sto_ship_catalogue_audit: {
        Row: {
          id: string
          name: string
          ship_class: string | null
          faction: string | null
          tier: string | null
          source_key: string | null
          source_url: string | null
          source_reference: string | null
          data_version: string | null
          verified_at: string | null
          classification_complete: boolean
          mobility_complete: boolean
          layout_complete: boolean
          seating_complete: boolean
          provenance_complete: boolean
          stowiki_verified: boolean
        }
        Insert: never
        Update: never
        Relationships: []
      }
      sto_build_readiness_audit: {
        Row: {
          build_id: string
          user_id: string
          build_name: string
          status: string
          user_ship_id: string | null
          ship_name: string | null
          sto_ship_id: string | null
          catalogue_ship_name: string | null
          source_key: string | null
          verified_at: string | null
          ship_instance_complete: boolean
          catalogue_link_complete: boolean
          ship_definition_verified: boolean
          loadout_count: number
          active_loadout_count: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      apply_sto_ship_catalog_import: {
        Args: { p_import_id: string }
        Returns: number
      }
      validate_sto_ship_catalog_import: {
        Args: { p_import_id: string }
        Returns: string
      }

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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
