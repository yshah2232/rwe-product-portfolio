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
      acs_cache: {
        Row: {
          acs_year: number
          expires_at: string
          fetched_at: string
          geo_id: string
          geo_type: string
          id: string
          median_household_income: number | null
          pop_age_18_64: number | null
          pop_age_65plus: number | null
          pop_age_under18: number | null
          pop_aian_nh: number | null
          pop_asian_nh: number | null
          pop_black_nh: number | null
          pop_hispanic: number | null
          pop_multi_nh: number | null
          pop_nhpi_nh: number | null
          pop_other_nh: number | null
          pop_white_nh: number | null
          source_url: string
          total_population: number | null
        }
        Insert: {
          acs_year: number
          expires_at?: string
          fetched_at?: string
          geo_id: string
          geo_type: string
          id?: string
          median_household_income?: number | null
          pop_age_18_64?: number | null
          pop_age_65plus?: number | null
          pop_age_under18?: number | null
          pop_aian_nh?: number | null
          pop_asian_nh?: number | null
          pop_black_nh?: number | null
          pop_hispanic?: number | null
          pop_multi_nh?: number | null
          pop_nhpi_nh?: number | null
          pop_other_nh?: number | null
          pop_white_nh?: number | null
          source_url: string
          total_population?: number | null
        }
        Update: {
          acs_year?: number
          expires_at?: string
          fetched_at?: string
          geo_id?: string
          geo_type?: string
          id?: string
          median_household_income?: number | null
          pop_age_18_64?: number | null
          pop_age_65plus?: number | null
          pop_age_under18?: number | null
          pop_aian_nh?: number | null
          pop_asian_nh?: number | null
          pop_black_nh?: number | null
          pop_hispanic?: number | null
          pop_multi_nh?: number | null
          pop_nhpi_nh?: number | null
          pop_other_nh?: number | null
          pop_white_nh?: number | null
          source_url?: string
          total_population?: number | null
        }
        Relationships: []
      }
      asset_mappings: {
        Row: {
          clean_value: string
          confidence: number
          id: string
          mapping_type: string
          raw_value: string
          source_note: string | null
          updated_at: string
        }
        Insert: {
          clean_value: string
          confidence?: number
          id?: string
          mapping_type?: string
          raw_value: string
          source_note?: string | null
          updated_at?: string
        }
        Update: {
          clean_value?: string
          confidence?: number
          id?: string
          mapping_type?: string
          raw_value?: string
          source_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audience_selections: {
        Row: {
          audience: string
          created_at: string
          id: string
          plain_mode_default: boolean
          session_id: string
        }
        Insert: {
          audience: string
          created_at?: string
          id?: string
          plain_mode_default?: boolean
          session_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          plain_mode_default?: boolean
          session_id?: string
        }
        Relationships: []
      }
      cohort_trials: {
        Row: {
          added_at: string
          brief_title: string | null
          cohort_id: string
          conditions_clean: string[] | null
          conditions_raw: string[] | null
          countries: string[] | null
          enrollment: number | null
          id: string
          interventions_clean: string[] | null
          interventions_raw: string[] | null
          nct_id: string
          overall_status: string | null
          phase: string[] | null
          semantic_reason: string | null
          semantic_score: number | null
          sponsor_clean: string | null
          sponsor_raw: string | null
        }
        Insert: {
          added_at?: string
          brief_title?: string | null
          cohort_id: string
          conditions_clean?: string[] | null
          conditions_raw?: string[] | null
          countries?: string[] | null
          enrollment?: number | null
          id?: string
          interventions_clean?: string[] | null
          interventions_raw?: string[] | null
          nct_id: string
          overall_status?: string | null
          phase?: string[] | null
          semantic_reason?: string | null
          semantic_score?: number | null
          sponsor_clean?: string | null
          sponsor_raw?: string | null
        }
        Update: {
          added_at?: string
          brief_title?: string | null
          cohort_id?: string
          conditions_clean?: string[] | null
          conditions_raw?: string[] | null
          countries?: string[] | null
          enrollment?: number | null
          id?: string
          interventions_clean?: string[] | null
          interventions_raw?: string[] | null
          nct_id?: string
          overall_status?: string | null
          phase?: string[] | null
          semantic_reason?: string | null
          semantic_score?: number | null
          sponsor_clean?: string | null
          sponsor_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_trials_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "saved_cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      county_fips_lookup: {
        Row: {
          county_name: string
          fips: string
          source_url: string
          state_code: string
        }
        Insert: {
          county_name: string
          fips: string
          source_url?: string
          state_code: string
        }
        Update: {
          county_name?: string
          fips?: string
          source_url?: string
          state_code?: string
        }
        Relationships: []
      }
      disease_prevalence: {
        Row: {
          confidence: number
          created_at: string
          id: string
          indication_clean: string
          metric_type: string
          notes: string | null
          population_group: string
          prevalence_per_100k: number | null
          source_name: string
          source_url: string
          source_year: number
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          indication_clean: string
          metric_type?: string
          notes?: string | null
          population_group: string
          prevalence_per_100k?: number | null
          source_name: string
          source_url: string
          source_year: number
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          indication_clean?: string
          metric_type?: string
          notes?: string | null
          population_group?: string
          prevalence_per_100k?: number | null
          source_name?: string
          source_url?: string
          source_year?: number
          updated_at?: string
        }
        Relationships: []
      }
      eligibility_checks: {
        Row: {
          checklist: Json
          created_at: string
          files_count: number
          id: string
          nct_id: string
          notes: string | null
          overall_signal: string | null
          session_id: string
          total_bytes: number
        }
        Insert: {
          checklist?: Json
          created_at?: string
          files_count?: number
          id?: string
          nct_id: string
          notes?: string | null
          overall_signal?: string | null
          session_id: string
          total_bytes?: number
        }
        Update: {
          checklist?: Json
          created_at?: string
          files_count?: number
          id?: string
          nct_id?: string
          notes?: string | null
          overall_signal?: string | null
          session_id?: string
          total_bytes?: number
        }
        Relationships: []
      }
      indication_mappings: {
        Row: {
          clean_value: string
          confidence: number
          id: string
          mapping_type: string
          raw_value: string
          source_note: string | null
          updated_at: string
        }
        Insert: {
          clean_value: string
          confidence?: number
          id?: string
          mapping_type?: string
          raw_value: string
          source_note?: string | null
          updated_at?: string
        }
        Update: {
          clean_value?: string
          confidence?: number
          id?: string
          mapping_type?: string
          raw_value?: string
          source_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mapping_overrides: {
        Row: {
          created_at: string
          field_type: string
          id: string
          note: string | null
          raw_value: string
          session_id: string | null
          status: string
          suggested_clean: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          note?: string | null
          raw_value: string
          session_id?: string | null
          status?: string
          suggested_clean: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          note?: string | null
          raw_value?: string
          session_id?: string | null
          status?: string
          suggested_clean?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: []
      }
      normalized_locations: {
        Row: {
          county_fips: string | null
          county_name: string | null
          created_at: string
          id: string
          nct_id: string
          raw_city: string | null
          raw_country: string
          raw_facility: string | null
          raw_state: string | null
          resolution_confidence: number
          resolution_method: string
          resolved_at: string
          source_field: string
          state_code: string | null
          updated_at: string
          zip3: string | null
        }
        Insert: {
          county_fips?: string | null
          county_name?: string | null
          created_at?: string
          id?: string
          nct_id: string
          raw_city?: string | null
          raw_country: string
          raw_facility?: string | null
          raw_state?: string | null
          resolution_confidence?: number
          resolution_method?: string
          resolved_at?: string
          source_field?: string
          state_code?: string | null
          updated_at?: string
          zip3?: string | null
        }
        Update: {
          county_fips?: string | null
          county_name?: string | null
          created_at?: string
          id?: string
          nct_id?: string
          raw_city?: string | null
          raw_country?: string
          raw_facility?: string | null
          raw_state?: string | null
          resolution_confidence?: number
          resolution_method?: string
          resolved_at?: string
          source_field?: string
          state_code?: string | null
          updated_at?: string
          zip3?: string | null
        }
        Relationships: []
      }
      plain_language_trials: {
        Row: {
          created_at: string
          demographics: Json
          doc_checklist: Json
          generated_at: string
          id: string
          is_recruiting: boolean | null
          journey_steps: Json
          key_numbers: Json | null
          model_used: string
          nct_id: string
          plain_condition: string | null
          plain_design: string | null
          plain_eligibility: string | null
          plain_intervention: string | null
          plain_summary: string
          plain_time_commitment: string | null
          plain_title: string
          plain_what_happens: string | null
          source_updated_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          demographics?: Json
          doc_checklist?: Json
          generated_at?: string
          id?: string
          is_recruiting?: boolean | null
          journey_steps?: Json
          key_numbers?: Json | null
          model_used?: string
          nct_id: string
          plain_condition?: string | null
          plain_design?: string | null
          plain_eligibility?: string | null
          plain_intervention?: string | null
          plain_summary: string
          plain_time_commitment?: string | null
          plain_title: string
          plain_what_happens?: string | null
          source_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          demographics?: Json
          doc_checklist?: Json
          generated_at?: string
          id?: string
          is_recruiting?: boolean | null
          journey_steps?: Json
          key_numbers?: Json | null
          model_used?: string
          nct_id?: string
          plain_condition?: string | null
          plain_design?: string | null
          plain_eligibility?: string | null
          plain_intervention?: string | null
          plain_summary?: string
          plain_time_commitment?: string | null
          plain_title?: string
          plain_what_happens?: string | null
          source_updated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      result_feedback: {
        Row: {
          created_at: string
          id: string
          nct_id: string
          rating: string
          reason: string | null
          search_event_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nct_id: string
          rating: string
          reason?: string | null
          search_event_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nct_id?: string
          rating?: string
          reason?: string | null
          search_event_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_feedback_search_event_id_fkey"
            columns: ["search_event_id"]
            isOneToOne: false
            referencedRelation: "search_events"
            referencedColumns: ["id"]
          },
        ]
      }
      result_interactions: {
        Row: {
          created_at: string
          dwell_ms: number | null
          event_type: string
          id: string
          nct_id: string
          rank_position: number | null
          search_event_id: string | null
          semantic_score: number | null
          session_id: string
        }
        Insert: {
          created_at?: string
          dwell_ms?: number | null
          event_type: string
          id?: string
          nct_id: string
          rank_position?: number | null
          search_event_id?: string | null
          semantic_score?: number | null
          session_id: string
        }
        Update: {
          created_at?: string
          dwell_ms?: number | null
          event_type?: string
          id?: string
          nct_id?: string
          rank_position?: number | null
          search_event_id?: string | null
          semantic_score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_interactions_search_event_id_fkey"
            columns: ["search_event_id"]
            isOneToOne: false
            referencedRelation: "search_events"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_cohorts: {
        Row: {
          created_at: string
          filter_country_us: boolean | null
          filter_phase: string | null
          filter_status: string | null
          id: string
          name: string
          notes: string | null
          query_text: string | null
          refreshed_at: string | null
          session_id: string
          trial_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          filter_country_us?: boolean | null
          filter_phase?: string | null
          filter_status?: string | null
          id?: string
          name: string
          notes?: string | null
          query_text?: string | null
          refreshed_at?: string | null
          session_id: string
          trial_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          filter_country_us?: boolean | null
          filter_phase?: string | null
          filter_status?: string | null
          id?: string
          name?: string
          notes?: string | null
          query_text?: string | null
          refreshed_at?: string | null
          session_id?: string
          trial_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      search_events: {
        Row: {
          candidates_fetched: number | null
          created_at: string
          ctg_query: string | null
          filter_country_us: boolean | null
          filter_phase: string | null
          filter_status: string | null
          id: string
          ip_hash: string | null
          query: string
          query_normalized: string | null
          results_returned: number | null
          session_id: string
          total_count: number | null
          used_fallback: boolean | null
          user_agent: string | null
        }
        Insert: {
          candidates_fetched?: number | null
          created_at?: string
          ctg_query?: string | null
          filter_country_us?: boolean | null
          filter_phase?: string | null
          filter_status?: string | null
          id?: string
          ip_hash?: string | null
          query: string
          query_normalized?: string | null
          results_returned?: number | null
          session_id: string
          total_count?: number | null
          used_fallback?: boolean | null
          user_agent?: string | null
        }
        Update: {
          candidates_fetched?: number | null
          created_at?: string
          ctg_query?: string | null
          filter_country_us?: boolean | null
          filter_phase?: string | null
          filter_status?: string | null
          id?: string
          ip_hash?: string | null
          query?: string
          query_normalized?: string | null
          results_returned?: number | null
          session_id?: string
          total_count?: number | null
          used_fallback?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      search_refinements: {
        Row: {
          created_at: string
          id: string
          next_query: string | null
          next_search_event_id: string | null
          prior_query: string | null
          prior_search_event_id: string | null
          seconds_between: number | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_query?: string | null
          next_search_event_id?: string | null
          prior_query?: string | null
          prior_search_event_id?: string | null
          seconds_between?: number | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_query?: string | null
          next_search_event_id?: string | null
          prior_query?: string | null
          prior_search_event_id?: string | null
          seconds_between?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_refinements_next_search_event_id_fkey"
            columns: ["next_search_event_id"]
            isOneToOne: false
            referencedRelation: "search_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_refinements_prior_search_event_id_fkey"
            columns: ["prior_search_event_id"]
            isOneToOne: false
            referencedRelation: "search_events"
            referencedColumns: ["id"]
          },
        ]
      }
      session_outcomes: {
        Row: {
          consent_to_show: boolean | null
          created_at: string
          id: string
          rating: number | null
          role: string | null
          session_id: string
          testimonial: string | null
          use_case: string | null
        }
        Insert: {
          consent_to_show?: boolean | null
          created_at?: string
          id?: string
          rating?: number | null
          role?: string | null
          session_id: string
          testimonial?: string | null
          use_case?: string | null
        }
        Update: {
          consent_to_show?: boolean | null
          created_at?: string
          id?: string
          rating?: number | null
          role?: string | null
          session_id?: string
          testimonial?: string | null
          use_case?: string | null
        }
        Relationships: []
      }
      sponsor_mappings: {
        Row: {
          clean_value: string
          confidence: number
          id: string
          mapping_type: string
          raw_value: string
          source_note: string | null
          updated_at: string
        }
        Insert: {
          clean_value: string
          confidence?: number
          id?: string
          mapping_type?: string
          raw_value: string
          source_note?: string | null
          updated_at?: string
        }
        Update: {
          clean_value?: string
          confidence?: number
          id?: string
          mapping_type?: string
          raw_value?: string
          source_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      state_fips: {
        Row: {
          source_url: string
          state_code: string
          state_fips: string
          state_name: string
        }
        Insert: {
          source_url?: string
          state_code: string
          state_fips: string
          state_name: string
        }
        Update: {
          source_url?: string
          state_code?: string
          state_fips?: string
          state_name?: string
        }
        Relationships: []
      }
      ui_interactions: {
        Row: {
          created_at: string
          element_id: string | null
          element_text: string | null
          event_type: string
          id: string
          path: string
          scroll_depth_pct: number | null
          selector: string | null
          session_id: string
          viewport_h: number | null
          viewport_w: number | null
          x_norm: number | null
          y_norm: number | null
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          element_text?: string | null
          event_type: string
          id?: string
          path: string
          scroll_depth_pct?: number | null
          selector?: string | null
          session_id: string
          viewport_h?: number | null
          viewport_w?: number | null
          x_norm?: number | null
          y_norm?: number | null
        }
        Update: {
          created_at?: string
          element_id?: string | null
          element_text?: string | null
          event_type?: string
          id?: string
          path?: string
          scroll_depth_pct?: number | null
          selector?: string | null
          session_id?: string
          viewport_h?: number | null
          viewport_w?: number | null
          x_norm?: number | null
          y_norm?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_registry_impact: {
        Args: never
        Returns: {
          positive_feedback_pct: number
          top_queries: Json
          total_searches: number
          total_trials_surfaced: number
          unique_sessions: number
        }[]
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
