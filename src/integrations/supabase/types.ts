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
      boff_ability_catalog: {
        Row: {
          canonical_key: string
          career: string | null
          created_at: string
          data_quality_notes: string | null
          data_quality_status: string
          data_version: string | null
          description: string | null
          description_long: string | null
          id: string
          name: string
          properties: Json | null
          rank1: string | null
          rank1_info: string | null
          rank2: string | null
          rank2_info: string | null
          rank3: string | null
          rank3_info: string | null
          region: string | null
          source_reference: string | null
          updated_at: string
        }
        Insert: {
          canonical_key: string
          career?: string | null
          created_at?: string
          data_quality_notes?: string | null
          data_quality_status?: string
          data_version?: string | null
          description?: string | null
          description_long?: string | null
          id?: string
          name: string
          properties?: Json | null
          rank1?: string | null
          rank1_info?: string | null
          rank2?: string | null
          rank2_info?: string | null
          rank3?: string | null
          rank3_info?: string | null
          region?: string | null
          source_reference?: string | null
          updated_at?: string
        }
        Update: {
          canonical_key?: string
          career?: string | null
          created_at?: string
          data_quality_notes?: string | null
          data_quality_status?: string
          data_version?: string | null
          description?: string | null
          description_long?: string | null
          id?: string
          name?: string
          properties?: Json | null
          rank1?: string | null
          rank1_info?: string | null
          rank2?: string | null
          rank2_info?: string | null
          rank3?: string | null
          rank3_info?: string | null
          region?: string | null
          source_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      boff_catalog: {
        Row: {
          ability_data: Json
          account_unlock: boolean | null
          acquisition_method: string | null
          canonical_key: string | null
          career: string | null
          character_bound: boolean | null
          created_at: string
          currency_cost: number | null
          currency_type: string | null
          data_quality_notes: string | null
          data_quality_status: string | null
          data_version: string | null
          domain: string
          faction_restriction: string | null
          gender_restriction: string | null
          id: string
          item_family: string | null
          level_requirement: number | null
          name: string
          properties: Json | null
          rank: string | null
          reputation_name: string | null
          source_group: string | null
          source_name: string | null
          source_reference: string | null
          source_type: string | null
          specialization: string | null
          species_restriction: string | null
          updated_at: string
        }
        Insert: {
          ability_data?: Json
          account_unlock?: boolean | null
          acquisition_method?: string | null
          canonical_key?: string | null
          career?: string | null
          character_bound?: boolean | null
          created_at?: string
          currency_cost?: number | null
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          data_version?: string | null
          domain?: string
          faction_restriction?: string | null
          gender_restriction?: string | null
          id?: string
          item_family?: string | null
          level_requirement?: number | null
          name: string
          properties?: Json | null
          rank?: string | null
          reputation_name?: string | null
          source_group?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          specialization?: string | null
          species_restriction?: string | null
          updated_at?: string
        }
        Update: {
          ability_data?: Json
          account_unlock?: boolean | null
          acquisition_method?: string | null
          canonical_key?: string | null
          career?: string | null
          character_bound?: boolean | null
          created_at?: string
          currency_cost?: number | null
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          data_version?: string | null
          domain?: string
          faction_restriction?: string | null
          gender_restriction?: string | null
          id?: string
          item_family?: string | null
          level_requirement?: number | null
          name?: string
          properties?: Json | null
          rank?: string | null
          reputation_name?: string | null
          source_group?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          specialization?: string | null
          species_restriction?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      build_doffs: {
        Row: {
          active: boolean
          assignment: string | null
          build_id: string
          created_at: string | null
          department: string | null
          doff_id: string | null
          id: string
          name: string
          notes: string | null
          specialization: string | null
        }
        Insert: {
          active?: boolean
          assignment?: string | null
          build_id: string
          created_at?: string | null
          department?: string | null
          doff_id?: string | null
          id?: string
          name: string
          notes?: string | null
          specialization?: string | null
        }
        Update: {
          active?: boolean
          assignment?: string | null
          build_id?: string
          created_at?: string | null
          department?: string | null
          doff_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "build_doffs_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_doffs_doff_id_fkey"
            columns: ["doff_id"]
            isOneToOne: false
            referencedRelation: "doff_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      build_ground_loadouts: {
        Row: {
          armor: Json | null
          build_id: string
          created_at: string | null
          devices: Json | null
          ground_traits: Json
          id: string
          is_active: boolean
          kit: Json | null
          kit_modules: Json | null
          name: string
          notes: string | null
          personal_shield: Json | null
          specializations: Json
          updated_at: string | null
          user_id: string
          weapon_1: Json | null
          weapon_2: Json | null
        }
        Insert: {
          armor?: Json | null
          build_id: string
          created_at?: string | null
          devices?: Json | null
          ground_traits?: Json
          id?: string
          is_active?: boolean
          kit?: Json | null
          kit_modules?: Json | null
          name: string
          notes?: string | null
          personal_shield?: Json | null
          specializations?: Json
          updated_at?: string | null
          user_id: string
          weapon_1?: Json | null
          weapon_2?: Json | null
        }
        Update: {
          armor?: Json | null
          build_id?: string
          created_at?: string | null
          devices?: Json | null
          ground_traits?: Json
          id?: string
          is_active?: boolean
          kit?: Json | null
          kit_modules?: Json | null
          name?: string
          notes?: string | null
          personal_shield?: Json | null
          specializations?: Json
          updated_at?: string | null
          user_id?: string
          weapon_1?: Json | null
          weapon_2?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "build_ground_loadouts_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
        ]
      }
      build_readiness_checks: {
        Row: {
          build_id: string
          check_key: string
          checked_at: string
          detail: string | null
          domain: string | null
          id: string
          passed: boolean
        }
        Insert: {
          build_id: string
          check_key: string
          checked_at?: string
          detail?: string | null
          domain?: string | null
          id?: string
          passed?: boolean
        }
        Update: {
          build_id?: string
          check_key?: string
          checked_at?: string
          detail?: string | null
          domain?: string | null
          id?: string
          passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "build_readiness_checks_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
        ]
      }
      build_versions: {
        Row: {
          build_id: string
          created_at: string
          id: string
          snapshot: Json
          summary: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          build_id: string
          created_at?: string
          id?: string
          snapshot: Json
          summary?: string | null
          user_id?: string
          version_number: number
        }
        Update: {
          build_id?: string
          created_at?: string
          id?: string
          snapshot?: Json
          summary?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "build_versions_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
        ]
      }
      builds: {
        Row: {
          acquisition_needs: Json
          archived: boolean
          build_domain: string
          captain_setup: Json | null
          character_id: string | null
          completion_percent: number
          created_at: string
          duty_officer_notes: string | null
          ground_loadout: Json
          id: string
          is_complete: boolean
          last_validated_at: string | null
          name: string
          notes: string | null
          readiness_mode: string
          readiness_notes: string | null
          role: string | null
          ship_instance_id: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          user_ship_id: string | null
          version: number
        }
        Insert: {
          acquisition_needs?: Json
          archived?: boolean
          build_domain?: string
          captain_setup?: Json | null
          character_id?: string | null
          completion_percent?: number
          created_at?: string
          duty_officer_notes?: string | null
          ground_loadout?: Json
          id?: string
          is_complete?: boolean
          last_validated_at?: string | null
          name: string
          notes?: string | null
          readiness_mode?: string
          readiness_notes?: string | null
          role?: string | null
          ship_instance_id?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          user_ship_id?: string | null
          version?: number
        }
        Update: {
          acquisition_needs?: Json
          archived?: boolean
          build_domain?: string
          captain_setup?: Json | null
          character_id?: string | null
          completion_percent?: number
          created_at?: string
          duty_officer_notes?: string | null
          ground_loadout?: Json
          id?: string
          is_complete?: boolean
          last_validated_at?: string | null
          name?: string
          notes?: string | null
          readiness_mode?: string
          readiness_notes?: string | null
          role?: string | null
          ship_instance_id?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          user_ship_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "builds_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builds_ship_instance_id_fkey"
            columns: ["ship_instance_id"]
            isOneToOne: false
            referencedRelation: "ship_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builds_user_ship_id_fkey"
            columns: ["user_ship_id"]
            isOneToOne: false
            referencedRelation: "user_ships"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_validation_runs: {
        Row: {
          created_at: string
          dataset: string
          duplicate_key_rows: number
          id: string
          missing_description_rows: number
          missing_source_rows: number
          notes: string | null
          review_rows: number
          total_rows: number
          verified_rows: number
        }
        Insert: {
          created_at?: string
          dataset: string
          duplicate_key_rows?: number
          id?: string
          missing_description_rows?: number
          missing_source_rows?: number
          notes?: string | null
          review_rows: number
          total_rows: number
          verified_rows: number
        }
        Update: {
          created_at?: string
          dataset?: string
          duplicate_key_rows?: number
          id?: string
          missing_description_rows?: number
          missing_source_rows?: number
          notes?: string | null
          review_rows?: number
          total_rows?: number
          verified_rows?: number
        }
        Relationships: []
      }
      character_boffs: {
        Row: {
          active: boolean
          boff_id: string
          character_id: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          boff_id: string
          character_id: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          boff_id?: string
          character_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_boffs_boff_id_fkey"
            columns: ["boff_id"]
            isOneToOne: false
            referencedRelation: "boff_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_boffs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_bridge_officers: {
        Row: {
          abilities: Json
          active: boolean
          career: string | null
          character_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          rank: string | null
          specialization: string | null
          species: string | null
          traits: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          abilities?: Json
          active?: boolean
          career?: string | null
          character_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          rank?: string | null
          specialization?: string | null
          species?: string | null
          traits?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          abilities?: Json
          active?: boolean
          career?: string | null
          character_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          rank?: string | null
          specialization?: string | null
          species?: string | null
          traits?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_bridge_officers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_doffs: {
        Row: {
          active: boolean
          character_id: string
          created_at: string | null
          doff_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          character_id: string
          created_at?: string | null
          doff_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          character_id?: string
          created_at?: string | null
          doff_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_doffs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_doffs_doff_id_fkey"
            columns: ["doff_id"]
            isOneToOne: false
            referencedRelation: "doff_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      character_duty_officers: {
        Row: {
          active: boolean
          character_id: string
          created_at: string
          duty_officer_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          character_id: string
          created_at?: string
          duty_officer_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          character_id?: string
          created_at?: string
          duty_officer_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_duty_officers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_duty_officers_duty_officer_id_fkey"
            columns: ["duty_officer_id"]
            isOneToOne: false
            referencedRelation: "duty_officer_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      character_reputations: {
        Row: {
          character_id: string
          created_at: string
          daily_claimed: boolean
          id: string
          notes: string | null
          progress: number
          reputation_name: string
          tier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          daily_claimed?: boolean
          id?: string
          notes?: string | null
          progress?: number
          reputation_name: string
          tier?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          daily_claimed?: boolean
          id?: string
          notes?: string | null
          progress?: number
          reputation_name?: string
          tier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_reputations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_ship_unlocks: {
        Row: {
          character_id: string
          created_at: string
          id: string
          name: string
          source_name: string | null
          sto_ship_id: string
          unlock_type: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          name: string
          source_name?: string | null
          sto_ship_id: string
          unlock_type: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          name?: string
          source_name?: string | null
          sto_ship_id?: string
          unlock_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_ship_unlocks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_ship_unlocks_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_catalogue_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_ship_unlocks_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_data_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_ship_unlocks_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
        ]
      }
      character_trait_slot_unlocks: {
        Row: {
          character_id: string
          created_at: string
          id: string
          notes: string | null
          slot_group: string
          source: string
          unlocked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          notes?: string | null
          slot_group: string
          source: string
          unlocked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          slot_group?: string
          source?: string
          unlocked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_trait_slot_unlocks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_traits: {
        Row: {
          active: boolean
          availability: string | null
          availability_type: string | null
          character_id: string
          created_at: string
          domain: string | null
          id: string
          notes: string | null
          slot_group: string | null
          slot_index: number | null
          source: string | null
          source_name: string | null
          source_type: string | null
          trait_category: string | null
          trait_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          availability?: string | null
          availability_type?: string | null
          character_id: string
          created_at?: string
          domain?: string | null
          id?: string
          notes?: string | null
          slot_group?: string | null
          slot_index?: number | null
          source?: string | null
          source_name?: string | null
          source_type?: string | null
          trait_category?: string | null
          trait_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          availability?: string | null
          availability_type?: string | null
          character_id?: string
          created_at?: string
          domain?: string | null
          id?: string
          notes?: string | null
          slot_group?: string | null
          slot_index?: number | null
          source?: string | null
          source_name?: string | null
          source_type?: string | null
          trait_category?: string | null
          trait_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_traits_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_traits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "trait_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          career: string | null
          created_at: string
          elite_captain: boolean
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
          elite_captain?: boolean
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
          elite_captain?: boolean
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
      doff_catalog: {
        Row: {
          ability_data: Json | null
          created_at: string | null
          data_quality_notes: string | null
          data_quality_status: string | null
          department: string | null
          domain: string | null
          id: string
          name: string
          rank: string | null
          source_name: string | null
          source_reference: string | null
          source_type: string | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          ability_data?: Json | null
          created_at?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          department?: string | null
          domain?: string | null
          id?: string
          name: string
          rank?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          ability_data?: Json | null
          created_at?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          department?: string | null
          domain?: string | null
          id?: string
          name?: string
          rank?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      duty_officer_catalog: {
        Row: {
          ability_text: string | null
          acquisition_method: string | null
          career_restriction: string | null
          created_at: string
          currency_cost: number | null
          currency_type: string | null
          data_quality_notes: string | null
          data_quality_status: string | null
          department: string | null
          duty_type: string | null
          effect_text: string | null
          faction_restriction: string | null
          id: string
          name: string
          properties: Json | null
          rarity: string | null
          source_group: string | null
          source_name: string | null
          source_reference: string | null
          source_type: string | null
          specialization: string | null
          species_restriction: string | null
          updated_at: string
        }
        Insert: {
          ability_text?: string | null
          acquisition_method?: string | null
          career_restriction?: string | null
          created_at?: string
          currency_cost?: number | null
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          department?: string | null
          duty_type?: string | null
          effect_text?: string | null
          faction_restriction?: string | null
          id?: string
          name: string
          properties?: Json | null
          rarity?: string | null
          source_group?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          specialization?: string | null
          species_restriction?: string | null
          updated_at?: string
        }
        Update: {
          ability_text?: string | null
          acquisition_method?: string | null
          career_restriction?: string | null
          created_at?: string
          currency_cost?: number | null
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          department?: string | null
          duty_type?: string | null
          effect_text?: string | null
          faction_restriction?: string | null
          id?: string
          name?: string
          properties?: Json | null
          rarity?: string | null
          source_group?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          specialization?: string | null
          species_restriction?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment_catalog: {
        Row: {
          account_unlock: boolean | null
          acquisition_method: string | null
          acquisition_requirements: Json
          armor_type: string | null
          bind_type: string | null
          canonical_key: string | null
          career_restriction: string | null
          category: string
          character_bound: boolean | null
          console_type: string | null
          cost_amount: number | null
          cost_currency: string | null
          crafting_recipe: string | null
          crafting_school: string | null
          created_at: string
          currency_type: string | null
          data_quality_notes: string | null
          data_quality_status: string | null
          data_version: string | null
          description: string | null
          device_type: string | null
          dilithium_cost: number | null
          domain: string
          drop_source: string | null
          energy_type: string | null
          event_name: string | null
          faction_restriction: string | null
          fleet_credit_cost: number | null
          fleet_name: string | null
          ground_category: string | null
          ground_slot: string | null
          id: string
          item_family: string | null
          item_level: number | null
          kit_module_type: string | null
          kit_type: string | null
          level_requirement: number | null
          lobi_cost: number | null
          lockbox_name: string | null
          mark_level: number | null
          max_mark: number | null
          mission_name: string | null
          modifiers: Json
          name: string
          proc_type: string | null
          promo_source: string | null
          properties: Json
          rarity: string | null
          reputation_mark_cost: number | null
          reputation_name: string | null
          set_name: string | null
          set_piece: string | null
          slot: string | null
          source_group: string | null
          source_id: string | null
          source_name: string | null
          source_reference: string | null
          source_type: string | null
          species_restriction: string | null
          unique_item: boolean
          updated_at: string
          upgradeable: boolean
          vendor_name: string | null
          verified_at: string | null
          weapon_mode: string | null
          weapon_type: string | null
          zen_cost: number | null
        }
        Insert: {
          account_unlock?: boolean | null
          acquisition_method?: string | null
          acquisition_requirements?: Json
          armor_type?: string | null
          bind_type?: string | null
          canonical_key?: string | null
          career_restriction?: string | null
          category: string
          character_bound?: boolean | null
          console_type?: string | null
          cost_amount?: number | null
          cost_currency?: string | null
          crafting_recipe?: string | null
          crafting_school?: string | null
          created_at?: string
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          data_version?: string | null
          description?: string | null
          device_type?: string | null
          dilithium_cost?: number | null
          domain?: string
          drop_source?: string | null
          energy_type?: string | null
          event_name?: string | null
          faction_restriction?: string | null
          fleet_credit_cost?: number | null
          fleet_name?: string | null
          ground_category?: string | null
          ground_slot?: string | null
          id?: string
          item_family?: string | null
          item_level?: number | null
          kit_module_type?: string | null
          kit_type?: string | null
          level_requirement?: number | null
          lobi_cost?: number | null
          lockbox_name?: string | null
          mark_level?: number | null
          max_mark?: number | null
          mission_name?: string | null
          modifiers?: Json
          name: string
          proc_type?: string | null
          promo_source?: string | null
          properties?: Json
          rarity?: string | null
          reputation_mark_cost?: number | null
          reputation_name?: string | null
          set_name?: string | null
          set_piece?: string | null
          slot?: string | null
          source_group?: string | null
          source_id?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          species_restriction?: string | null
          unique_item?: boolean
          updated_at?: string
          upgradeable?: boolean
          vendor_name?: string | null
          verified_at?: string | null
          weapon_mode?: string | null
          weapon_type?: string | null
          zen_cost?: number | null
        }
        Update: {
          account_unlock?: boolean | null
          acquisition_method?: string | null
          acquisition_requirements?: Json
          armor_type?: string | null
          bind_type?: string | null
          canonical_key?: string | null
          career_restriction?: string | null
          category?: string
          character_bound?: boolean | null
          console_type?: string | null
          cost_amount?: number | null
          cost_currency?: string | null
          crafting_recipe?: string | null
          crafting_school?: string | null
          created_at?: string
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          data_version?: string | null
          description?: string | null
          device_type?: string | null
          dilithium_cost?: number | null
          domain?: string
          drop_source?: string | null
          energy_type?: string | null
          event_name?: string | null
          faction_restriction?: string | null
          fleet_credit_cost?: number | null
          fleet_name?: string | null
          ground_category?: string | null
          ground_slot?: string | null
          id?: string
          item_family?: string | null
          item_level?: number | null
          kit_module_type?: string | null
          kit_type?: string | null
          level_requirement?: number | null
          lobi_cost?: number | null
          lockbox_name?: string | null
          mark_level?: number | null
          max_mark?: number | null
          mission_name?: string | null
          modifiers?: Json
          name?: string
          proc_type?: string | null
          promo_source?: string | null
          properties?: Json
          rarity?: string | null
          reputation_mark_cost?: number | null
          reputation_name?: string | null
          set_name?: string | null
          set_piece?: string | null
          slot?: string | null
          source_group?: string | null
          source_id?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_type?: string | null
          species_restriction?: string | null
          unique_item?: boolean
          updated_at?: string
          upgradeable?: boolean
          vendor_name?: string | null
          verified_at?: string | null
          weapon_mode?: string | null
          weapon_type?: string | null
          zen_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_catalog_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "equipment_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          bind_type: string | null
          catalog_item_id: string | null
          category: string | null
          character_id: string | null
          cost_currency: string | null
          cost_paid: number | null
          created_at: string
          id: string
          item_level: number | null
          mark: string | null
          mark_level: number | null
          mods: string | null
          name: string
          notes: string | null
          quantity: number
          rarity: string | null
          slot: string | null
          source: string | null
          updated_at: string
          upgrade_level: number | null
          user_id: string
        }
        Insert: {
          bind_type?: string | null
          catalog_item_id?: string | null
          category?: string | null
          character_id?: string | null
          cost_currency?: string | null
          cost_paid?: number | null
          created_at?: string
          id?: string
          item_level?: number | null
          mark?: string | null
          mark_level?: number | null
          mods?: string | null
          name: string
          notes?: string | null
          quantity?: number
          rarity?: string | null
          slot?: string | null
          source?: string | null
          updated_at?: string
          upgrade_level?: number | null
          user_id: string
        }
        Update: {
          bind_type?: string | null
          catalog_item_id?: string | null
          category?: string | null
          character_id?: string | null
          cost_currency?: string | null
          cost_paid?: number | null
          created_at?: string
          id?: string
          item_level?: number | null
          mark?: string | null
          mark_level?: number | null
          mods?: string | null
          name?: string
          notes?: string | null
          quantity?: number
          rarity?: string | null
          slot?: string | null
          source?: string | null
          updated_at?: string
          upgrade_level?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_sources: {
        Row: {
          created_at: string
          currency_type: string | null
          description: string | null
          id: string
          name: string
          source_type: string
        }
        Insert: {
          created_at?: string
          currency_type?: string | null
          description?: string | null
          id?: string
          name: string
          source_type: string
        }
        Update: {
          created_at?: string
          currency_type?: string | null
          description?: string | null
          id?: string
          name?: string
          source_type?: string
        }
        Relationships: []
      }
      ground_loadout_equipment: {
        Row: {
          created_at: string | null
          equipment_item_id: string
          id: string
          loadout_id: string
          slot: string
        }
        Insert: {
          created_at?: string | null
          equipment_item_id: string
          id?: string
          loadout_id: string
          slot: string
        }
        Update: {
          created_at?: string | null
          equipment_item_id?: string
          id?: string
          loadout_id?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "ground_loadout_equipment_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ground_loadout_equipment_loadout_id_fkey"
            columns: ["loadout_id"]
            isOneToOne: false
            referencedRelation: "build_ground_loadouts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          character_id: string | null
          created_at: string
          id: string
          location: string
          mark: string | null
          name: string
          notes: string | null
          quantity: number
          rarity: string | null
          slot: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          character_id?: string | null
          created_at?: string
          id?: string
          location?: string
          mark?: string | null
          name: string
          notes?: string | null
          quantity?: number
          rarity?: string | null
          slot?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          character_id?: string | null
          created_at?: string
          id?: string
          location?: string
          mark?: string | null
          name?: string
          notes?: string | null
          quantity?: number
          rarity?: string | null
          slot?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      loadout_boffs: {
        Row: {
          abilities: Json
          boff_id: string | null
          created_at: string
          id: string
          loadout_id: string
          notes: string | null
          officer_name: string | null
          officer_species: string | null
          slot: string | null
          specialization: string | null
          station: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abilities?: Json
          boff_id?: string | null
          created_at?: string
          id?: string
          loadout_id: string
          notes?: string | null
          officer_name?: string | null
          officer_species?: string | null
          slot?: string | null
          specialization?: string | null
          station: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          abilities?: Json
          boff_id?: string | null
          created_at?: string
          id?: string
          loadout_id?: string
          notes?: string | null
          officer_name?: string | null
          officer_species?: string | null
          slot?: string | null
          specialization?: string | null
          station?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loadout_boffs_boff_id_fkey"
            columns: ["boff_id"]
            isOneToOne: false
            referencedRelation: "boff_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loadout_boffs_loadout_id_fkey"
            columns: ["loadout_id"]
            isOneToOne: false
            referencedRelation: "loadouts"
            referencedColumns: ["id"]
          },
        ]
      }
      loadout_duty_officers: {
        Row: {
          created_at: string
          department: string | null
          duty_officer_id: string | null
          effect_text: string | null
          id: string
          loadout_id: string
          name: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          duty_officer_id?: string | null
          effect_text?: string | null
          id?: string
          loadout_id: string
          name: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          duty_officer_id?: string | null
          effect_text?: string | null
          id?: string
          loadout_id?: string
          name?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loadout_duty_officers_duty_officer_id_fkey"
            columns: ["duty_officer_id"]
            isOneToOne: false
            referencedRelation: "duty_officer_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loadout_duty_officers_loadout_id_fkey"
            columns: ["loadout_id"]
            isOneToOne: false
            referencedRelation: "loadouts"
            referencedColumns: ["id"]
          },
        ]
      }
      loadout_equipment: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          loadout_id: string
          slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          id?: string
          loadout_id: string
          slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          loadout_id?: string
          slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loadout_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loadout_equipment_loadout_id_fkey"
            columns: ["loadout_id"]
            isOneToOne: false
            referencedRelation: "loadouts"
            referencedColumns: ["id"]
          },
        ]
      }
      loadout_hangar_pets: {
        Row: {
          created_at: string
          hangar_slot: string
          id: string
          loadout_id: string
          notes: string | null
          pet_name: string
          quantity: number
          source_reference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hangar_slot: string
          id?: string
          loadout_id: string
          notes?: string | null
          pet_name: string
          quantity?: number
          source_reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          hangar_slot?: string
          id?: string
          loadout_id?: string
          notes?: string | null
          pet_name?: string
          quantity?: number
          source_reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loadout_hangar_pets_loadout_id_fkey"
            columns: ["loadout_id"]
            isOneToOne: false
            referencedRelation: "loadouts"
            referencedColumns: ["id"]
          },
        ]
      }
      loadout_traits: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          loadout_id: string
          name: string
          notes: string | null
          slot: string | null
          trait_category: string | null
          trait_id: string | null
          trait_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          loadout_id: string
          name: string
          notes?: string | null
          slot?: string | null
          trait_category?: string | null
          trait_id?: string | null
          trait_type?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          loadout_id?: string
          name?: string
          notes?: string | null
          slot?: string | null
          trait_category?: string | null
          trait_id?: string | null
          trait_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loadout_traits_loadout_id_fkey"
            columns: ["loadout_id"]
            isOneToOne: false
            referencedRelation: "loadouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loadout_traits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "trait_catalog"
            referencedColumns: ["id"]
          },
        ]
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
          name?: string
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
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          project_id: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          project_id: string
          sort_order?: number
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          project_id?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          character_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          priority: string
          progress: number
          project_type: string
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority?: string
          progress?: number
          project_type?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority?: string
          progress?: number
          project_type?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_balances: {
        Row: {
          category: string
          character_id: string | null
          id: string
          name: string
          notes: string | null
          quantity: number
          target: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          character_id?: string | null
          id?: string
          name: string
          notes?: string | null
          quantity?: number
          target?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          character_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          quantity?: number
          target?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_balances_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
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
      sto_data_sources: {
        Row: {
          active: boolean
          base_url: string
          created_at: string
          id: string
          name: string
          notes: string | null
          purpose: string
          source_key: string
          source_type: string
          updated_at: string
          verified_at: string
        }
        Insert: {
          active?: boolean
          base_url: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          purpose: string
          source_key: string
          source_type?: string
          updated_at?: string
          verified_at?: string
        }
        Update: {
          active?: boolean
          base_url?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          purpose?: string
          source_key?: string
          source_type?: string
          updated_at?: string
          verified_at?: string
        }
        Relationships: []
      }
      sto_equipment_set_bonuses: {
        Row: {
          bonus_description: string
          bonus_name: string
          created_at: string
          data_version: string | null
          id: string
          piece_threshold: number
          set_name: string
          source_reference: string
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          bonus_description: string
          bonus_name: string
          created_at?: string
          data_version?: string | null
          id?: string
          piece_threshold: number
          set_name: string
          source_reference: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          bonus_description?: string
          bonus_name?: string
          created_at?: string
          data_version?: string | null
          id?: string
          piece_threshold?: number
          set_name?: string
          source_reference?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      sto_project_tasks: {
        Row: {
          completed_quantity: number
          created_at: string
          id: string
          notes: string | null
          project_id: string
          quantity: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_quantity?: number
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          quantity?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_quantity?: number
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          quantity?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sto_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sto_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_projects: {
        Row: {
          character_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          priority: string
          project_type: string
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          priority?: string
          project_type?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          priority?: string
          project_type?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sto_projects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_resource_balances: {
        Row: {
          amount: number
          character_id: string | null
          id: string
          notes: string | null
          resource_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          character_id?: string | null
          id?: string
          notes?: string | null
          resource_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          character_id?: string | null
          id?: string
          notes?: string | null
          resource_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sto_resource_balances_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_ship_bundle_items: {
        Row: {
          account_unlock: boolean
          bundle_id: string
          item_type: string
          quantity: number
          sto_ship_id: string
        }
        Insert: {
          account_unlock?: boolean
          bundle_id: string
          item_type?: string
          quantity?: number
          sto_ship_id: string
        }
        Update: {
          account_unlock?: boolean
          bundle_id?: string
          item_type?: string
          quantity?: number
          sto_ship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sto_ship_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_bundle_items_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_catalogue_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_bundle_items_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_data_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_bundle_items_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_ship_bundles: {
        Row: {
          account_unlock: boolean
          availability_status: string
          created_at: string
          data_version: string | null
          id: string
          name: string
          notes: string | null
          price_amount: number | null
          price_currency: string | null
          source_reference: string | null
          updated_at: string
          verified_at: string
        }
        Insert: {
          account_unlock?: boolean
          availability_status?: string
          created_at?: string
          data_version?: string | null
          id?: string
          name: string
          notes?: string | null
          price_amount?: number | null
          price_currency?: string | null
          source_reference?: string | null
          updated_at?: string
          verified_at?: string
        }
        Update: {
          account_unlock?: boolean
          availability_status?: string
          created_at?: string
          data_version?: string | null
          id?: string
          name?: string
          notes?: string | null
          price_amount?: number | null
          price_currency?: string | null
          source_reference?: string | null
          updated_at?: string
          verified_at?: string
        }
        Relationships: []
      }
      sto_ship_catalog_imports: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          imported_by: string | null
          payload: Json
          source_key: string
          source_url: string | null
          status: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          imported_by?: string | null
          payload: Json
          source_key: string
          source_url?: string | null
          status?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          imported_by?: string | null
          payload?: Json
          source_key?: string
          source_url?: string | null
          status?: string
        }
        Relationships: []
      }
      sto_ship_ownership: {
        Row: {
          acquired_at: string | null
          acquisition_source_id: string | null
          created_at: string
          id: string
          notes: string | null
          ownership_status: string
          sto_ship_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          acquisition_source_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          ownership_status?: string
          sto_ship_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          acquired_at?: string | null
          acquisition_source_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          ownership_status?: string
          sto_ship_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sto_ship_ownership_acquisition_source_id_fkey"
            columns: ["acquisition_source_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_ownership_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_catalogue_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_ownership_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_data_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_ownership_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_ship_reference_data: {
        Row: {
          attract_fire: boolean | null
          bonus_aux_power: number | null
          bonus_engine_power: number | null
          bonus_shield_power: number | null
          bonus_weapon_power: number | null
          bundle: string | null
          cloak: boolean | null
          console_description: string | null
          console_name: string | null
          devices: number | null
          equip_dual_cannons: boolean | null
          family: string | null
          flanking: boolean | null
          fleet_grade: boolean | null
          imported_at: string
          mastery_package: string | null
          max_command_seat: number | null
          max_engineering_seat: number | null
          max_intelligence_seat: number | null
          max_miracle_worker_seat: number | null
          max_pilot_seat: number | null
          max_science_seat: number | null
          max_tactical_seat: number | null
          max_temporal_seat: number | null
          max_universal_seat: number | null
          origin: string | null
          original_source: string | null
          raw_data: Json
          release_date: string | null
          release_month: number | null
          release_year: number | null
          seats_text: string | null
          secondary_deflector: boolean | null
          sensor_analysis: boolean | null
          shield_frequency_modulation: boolean | null
          singularity: boolean | null
          source: string | null
          source_url: string
          starter_bundle: string | null
          sto_ship_id: string
          strategic_maneuvering: boolean | null
          subsystem_targeting: boolean | null
          tac_sci_modes: boolean | null
          total_boff_abilities: number | null
          total_boff_stations: number | null
          trait_description: string | null
          trait_name: string | null
          updated_at: string
          weapon_systems_efficiency: boolean | null
          wingmen: boolean | null
        }
        Insert: {
          attract_fire?: boolean | null
          bonus_aux_power?: number | null
          bonus_engine_power?: number | null
          bonus_shield_power?: number | null
          bonus_weapon_power?: number | null
          bundle?: string | null
          cloak?: boolean | null
          console_description?: string | null
          console_name?: string | null
          devices?: number | null
          equip_dual_cannons?: boolean | null
          family?: string | null
          flanking?: boolean | null
          fleet_grade?: boolean | null
          imported_at?: string
          mastery_package?: string | null
          max_command_seat?: number | null
          max_engineering_seat?: number | null
          max_intelligence_seat?: number | null
          max_miracle_worker_seat?: number | null
          max_pilot_seat?: number | null
          max_science_seat?: number | null
          max_tactical_seat?: number | null
          max_temporal_seat?: number | null
          max_universal_seat?: number | null
          origin?: string | null
          original_source?: string | null
          raw_data: Json
          release_date?: string | null
          release_month?: number | null
          release_year?: number | null
          seats_text?: string | null
          secondary_deflector?: boolean | null
          sensor_analysis?: boolean | null
          shield_frequency_modulation?: boolean | null
          singularity?: boolean | null
          source?: string | null
          source_url?: string
          starter_bundle?: string | null
          sto_ship_id: string
          strategic_maneuvering?: boolean | null
          subsystem_targeting?: boolean | null
          tac_sci_modes?: boolean | null
          total_boff_abilities?: number | null
          total_boff_stations?: number | null
          trait_description?: string | null
          trait_name?: string | null
          updated_at?: string
          weapon_systems_efficiency?: boolean | null
          wingmen?: boolean | null
        }
        Update: {
          attract_fire?: boolean | null
          bonus_aux_power?: number | null
          bonus_engine_power?: number | null
          bonus_shield_power?: number | null
          bonus_weapon_power?: number | null
          bundle?: string | null
          cloak?: boolean | null
          console_description?: string | null
          console_name?: string | null
          devices?: number | null
          equip_dual_cannons?: boolean | null
          family?: string | null
          flanking?: boolean | null
          fleet_grade?: boolean | null
          imported_at?: string
          mastery_package?: string | null
          max_command_seat?: number | null
          max_engineering_seat?: number | null
          max_intelligence_seat?: number | null
          max_miracle_worker_seat?: number | null
          max_pilot_seat?: number | null
          max_science_seat?: number | null
          max_tactical_seat?: number | null
          max_temporal_seat?: number | null
          max_universal_seat?: number | null
          origin?: string | null
          original_source?: string | null
          raw_data?: Json
          release_date?: string | null
          release_month?: number | null
          release_year?: number | null
          seats_text?: string | null
          secondary_deflector?: boolean | null
          sensor_analysis?: boolean | null
          shield_frequency_modulation?: boolean | null
          singularity?: boolean | null
          source?: string | null
          source_url?: string
          starter_bundle?: string | null
          sto_ship_id?: string
          strategic_maneuvering?: boolean | null
          subsystem_targeting?: boolean | null
          tac_sci_modes?: boolean | null
          total_boff_abilities?: number | null
          total_boff_stations?: number | null
          trait_description?: string | null
          trait_name?: string | null
          updated_at?: string
          weapon_systems_efficiency?: boolean | null
          wingmen?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sto_ship_reference_data_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: true
            referencedRelation: "sto_ship_catalogue_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_reference_data_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: true
            referencedRelation: "sto_ship_data_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_reference_data_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: true
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_ship_sources: {
        Row: {
          account_unlock: boolean
          availability_status: string
          bundle_id: string | null
          character_restriction: string | null
          created_at: string
          data_version: string | null
          id: string
          notes: string | null
          price_amount: number | null
          price_currency: string | null
          source_name: string
          source_reference: string | null
          source_type: string
          sto_ship_id: string
          updated_at: string
          verified_at: string
        }
        Insert: {
          account_unlock?: boolean
          availability_status?: string
          bundle_id?: string | null
          character_restriction?: string | null
          created_at?: string
          data_version?: string | null
          id?: string
          notes?: string | null
          price_amount?: number | null
          price_currency?: string | null
          source_name: string
          source_reference?: string | null
          source_type: string
          sto_ship_id: string
          updated_at?: string
          verified_at?: string
        }
        Update: {
          account_unlock?: boolean
          availability_status?: string
          bundle_id?: string | null
          character_restriction?: string | null
          created_at?: string
          data_version?: string | null
          id?: string
          notes?: string | null
          price_amount?: number | null
          price_currency?: string | null
          source_name?: string
          source_reference?: string | null
          source_type?: string
          sto_ship_id?: string
          updated_at?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sto_ship_sources_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_sources_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_catalogue_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_sources_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_data_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sto_ship_sources_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
        ]
      }
      sto_ships: {
        Row: {
          aft_weapon_slots: number | null
          base_hull: number | null
          base_shields: number | null
          bridge_officer_seating: Json | null
          bridge_officer_stations: Json | null
          created_at: string
          data_quality_notes: string | null
          data_quality_status: string | null
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
          source_key: string | null
          source_reference: string | null
          source_url: string | null
          special_console: string | null
          special_mechanics: string | null
          special_weapons: string | null
          tactical_console_slots: number | null
          tier: string | null
          turn_rate: number | null
          universal_console_slots: number | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          aft_weapon_slots?: number | null
          base_hull?: number | null
          base_shields?: number | null
          bridge_officer_seating?: Json | null
          bridge_officer_stations?: Json | null
          created_at?: string
          data_quality_notes?: string | null
          data_quality_status?: string | null
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
          source_key?: string | null
          source_reference?: string | null
          source_url?: string | null
          special_console?: string | null
          special_mechanics?: string | null
          special_weapons?: string | null
          tactical_console_slots?: number | null
          tier?: string | null
          turn_rate?: number | null
          universal_console_slots?: number | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          aft_weapon_slots?: number | null
          base_hull?: number | null
          base_shields?: number | null
          bridge_officer_seating?: Json | null
          bridge_officer_stations?: Json | null
          created_at?: string
          data_quality_notes?: string | null
          data_quality_status?: string | null
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
          source_key?: string | null
          source_reference?: string | null
          source_url?: string | null
          special_console?: string | null
          special_mechanics?: string | null
          special_weapons?: string | null
          tactical_console_slots?: number | null
          tier?: string | null
          turn_rate?: number | null
          universal_console_slots?: number | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      trait_catalog: {
        Row: {
          account_unlock: boolean | null
          acquisition_method: string | null
          acquisition_notes: string | null
          availability: string | null
          availability_type: string | null
          canonical_key: string | null
          career_restriction: string | null
          character_bound: boolean | null
          cost: Json | null
          cost_filter: Json | null
          created_at: string
          currency_cost: number | null
          currency_type: string | null
          data_quality_notes: string | null
          data_quality_status: string | null
          description: string | null
          display_type: string | null
          domain: string
          environment: string | null
          faction_restriction: string | null
          icon_name: string | null
          id: string
          innate_requirement: string | null
          is_active_ability: boolean
          item_family: string | null
          name: string
          obtained: Json | null
          properties: Json
          reputation_name: string | null
          reputation_tier: number | null
          source_group: string | null
          source_name: string | null
          source_reference: string | null
          source_tier: string | null
          source_type: string | null
          species_restriction: string | null
          trait_category: string | null
          trait_type: string
          updated_at: string
        }
        Insert: {
          account_unlock?: boolean | null
          acquisition_method?: string | null
          acquisition_notes?: string | null
          availability?: string | null
          availability_type?: string | null
          canonical_key?: string | null
          career_restriction?: string | null
          character_bound?: boolean | null
          cost?: Json | null
          cost_filter?: Json | null
          created_at?: string
          currency_cost?: number | null
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          description?: string | null
          display_type?: string | null
          domain?: string
          environment?: string | null
          faction_restriction?: string | null
          icon_name?: string | null
          id?: string
          innate_requirement?: string | null
          is_active_ability?: boolean
          item_family?: string | null
          name: string
          obtained?: Json | null
          properties?: Json
          reputation_name?: string | null
          reputation_tier?: number | null
          source_group?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_tier?: string | null
          source_type?: string | null
          species_restriction?: string | null
          trait_category?: string | null
          trait_type: string
          updated_at?: string
        }
        Update: {
          account_unlock?: boolean | null
          acquisition_method?: string | null
          acquisition_notes?: string | null
          availability?: string | null
          availability_type?: string | null
          canonical_key?: string | null
          career_restriction?: string | null
          character_bound?: boolean | null
          cost?: Json | null
          cost_filter?: Json | null
          created_at?: string
          currency_cost?: number | null
          currency_type?: string | null
          data_quality_notes?: string | null
          data_quality_status?: string | null
          description?: string | null
          display_type?: string | null
          domain?: string
          environment?: string | null
          faction_restriction?: string | null
          icon_name?: string | null
          id?: string
          innate_requirement?: string | null
          is_active_ability?: boolean
          item_family?: string | null
          name?: string
          obtained?: Json | null
          properties?: Json
          reputation_name?: string | null
          reputation_tier?: number | null
          source_group?: string | null
          source_name?: string | null
          source_reference?: string | null
          source_tier?: string | null
          source_type?: string | null
          species_restriction?: string | null
          trait_category?: string | null
          trait_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          summary: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          summary: string
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ships: {
        Row: {
          acquisition_group: string | null
          acquisition_source_id: string | null
          character_id: string | null
          created_at: string
          current_build_id: string | null
          custom_name: string | null
          date_acquired: string | null
          hull_material: string | null
          id: string
          notes: string | null
          ownership_status: string
          prefix: string | null
          sto_ship_id: string
          t6_upgraded: boolean
          t6x_upgraded: boolean
          t6x2_upgraded: boolean
          theme_id: string | null
          updated_at: string
          upgrades: Json
          usage_mode: string
          user_id: string
          vanity_shield: string | null
          visual_config: Json
          visual_notes: string | null
        }
        Insert: {
          acquisition_group?: string | null
          acquisition_source_id?: string | null
          character_id?: string | null
          created_at?: string
          current_build_id?: string | null
          custom_name?: string | null
          date_acquired?: string | null
          hull_material?: string | null
          id?: string
          notes?: string | null
          ownership_status?: string
          prefix?: string | null
          sto_ship_id: string
          t6_upgraded?: boolean
          t6x_upgraded?: boolean
          t6x2_upgraded?: boolean
          theme_id?: string | null
          updated_at?: string
          upgrades?: Json
          usage_mode?: string
          user_id: string
          vanity_shield?: string | null
          visual_config?: Json
          visual_notes?: string | null
        }
        Update: {
          acquisition_group?: string | null
          acquisition_source_id?: string | null
          character_id?: string | null
          created_at?: string
          current_build_id?: string | null
          custom_name?: string | null
          date_acquired?: string | null
          hull_material?: string | null
          id?: string
          notes?: string | null
          ownership_status?: string
          prefix?: string | null
          sto_ship_id?: string
          t6_upgraded?: boolean
          t6x_upgraded?: boolean
          t6x2_upgraded?: boolean
          theme_id?: string | null
          updated_at?: string
          upgrades?: Json
          usage_mode?: string
          user_id?: string
          vanity_shield?: string | null
          visual_config?: Json
          visual_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ships_acquisition_source_id_fkey"
            columns: ["acquisition_source_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_sources"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "sto_ship_catalogue_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ships_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ship_data_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ships_sto_ship_id_fkey"
            columns: ["sto_ship_id"]
            isOneToOne: false
            referencedRelation: "sto_ships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ships_user_character_fkey"
            columns: ["user_id", "character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
    }
    Views: {
      sto_ship_catalogue_audit: {
        Row: {
          classification_complete: boolean | null
          data_version: string | null
          faction: string | null
          id: string | null
          layout_complete: boolean | null
          mobility_complete: boolean | null
          name: string | null
          provenance_complete: boolean | null
          seating_complete: boolean | null
          seating_reference_complete: boolean | null
          seating_structured_complete: boolean | null
          ship_class: string | null
          source_key: string | null
          source_reference: string | null
          source_url: string | null
          stowiki_verified: boolean | null
          tier: string | null
          verified_at: string | null
        }
        Relationships: []
      }
      sto_ship_catalogue_coverage: {
        Row: {
          catalogue_records: number | null
          classification_complete: number | null
          community_reference: number | null
          layout_complete: number | null
          mobility_complete: number | null
          official_sto_2026: number | null
          provenance_complete: number | null
          seating_complete: number | null
          stowiki_verified: number | null
          t6_records: number | null
          t6_records_complete: number | null
        }
        Relationships: []
      }
      sto_ship_data_quality: {
        Row: {
          bridge_seating_complete: boolean | null
          classification_complete: boolean | null
          consoles_complete: boolean | null
          id: string | null
          mobility_complete: boolean | null
          name: string | null
          provenance_complete: boolean | null
          source_key: string | null
          special_data_present: boolean | null
          tier: string | null
          weapons_complete: boolean | null
        }
        Insert: {
          bridge_seating_complete?: never
          classification_complete?: never
          consoles_complete?: never
          id?: string | null
          mobility_complete?: never
          name?: string | null
          provenance_complete?: never
          source_key?: string | null
          special_data_present?: never
          tier?: string | null
          weapons_complete?: never
        }
        Update: {
          bridge_seating_complete?: never
          classification_complete?: never
          consoles_complete?: never
          id?: string | null
          mobility_complete?: never
          name?: string | null
          provenance_complete?: never
          source_key?: string | null
          special_data_present?: never
          tier?: string | null
          weapons_complete?: never
        }
        Relationships: []
      }
    }
    Functions: {
      apply_sto_ship_catalog_import: {
        Args: { p_import_id: string }
        Returns: number
      }
      claim_ship_assignments: {
        Args: {
          p_acquisition_group?: string
          p_acquisition_source_id?: string
          p_character_ids: string[]
          p_ship_id: string
        }
        Returns: number
      }
      claim_sto_ship_bundle: {
        Args: {
          p_acquired_at?: string
          p_bundle_id: string
          p_character_id?: string
        }
        Returns: number
      }
      copy_sto_build_to_ship: {
        Args: {
          p_new_name: string
          p_source_build_id: string
          p_target_ship_id: string
        }
        Returns: string
      }
      record_sto_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
          p_summary?: string
        }
        Returns: string
      }
      refresh_build_readiness: {
        Args: { p_build_id: string }
        Returns: undefined
      }
      refresh_operational_build_readiness: {
        Args: { p_build_id: string }
        Returns: undefined
      }
      validate_build_character: {
        Args: { p_build_id: string }
        Returns: boolean
      }
      validate_sto_ship_catalog_import: {
        Args: { p_import_id: string }
        Returns: string
      }
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
