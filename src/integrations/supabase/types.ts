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
