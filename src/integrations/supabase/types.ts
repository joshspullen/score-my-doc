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
      analyses: {
        Row: {
          created_at: string
          document_id: string
          document_type: string | null
          id: string
          issues: Json
          overall_score: number
          recommendations: Json
          sub_scores: Json
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          document_type?: string | null
          id?: string
          issues?: Json
          overall_score: number
          recommendations?: Json
          sub_scores?: Json
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string | null
          id?: string
          issues?: Json
          overall_score?: number
          recommendations?: Json
          sub_scores?: Json
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      business_processes: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_assignments: {
        Row: {
          compliance_requirement_id: string
          created_at: string
          id: string
          target_role: Database["public"]["Enums"]["app_role"] | null
          target_team_id: string | null
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          compliance_requirement_id: string
          created_at?: string
          id?: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          target_team_id?: string | null
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          compliance_requirement_id?: string
          created_at?: string
          id?: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          target_team_id?: string | null
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_assignments_compliance_requirement_id_fkey"
            columns: ["compliance_requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_assignments_target_team_id_fkey"
            columns: ["target_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          business_process_id: string | null
          category: Database["public"]["Enums"]["regulation_category"] | null
          created_at: string
          description: string | null
          id: string
          reference_code: string | null
          regulator: string | null
          requirement_type: string | null
          severity: string | null
          title: string
          updated_at: string
        }
        Insert: {
          business_process_id?: string | null
          category?: Database["public"]["Enums"]["regulation_category"] | null
          created_at?: string
          description?: string | null
          id?: string
          reference_code?: string | null
          regulator?: string | null
          requirement_type?: string | null
          severity?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          business_process_id?: string | null
          category?: Database["public"]["Enums"]["regulation_category"] | null
          created_at?: string
          description?: string | null
          id?: string
          reference_code?: string | null
          regulator?: string | null
          requirement_type?: string | null
          severity?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_business_process_id_fkey"
            columns: ["business_process_id"]
            isOneToOne: false
            referencedRelation: "business_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_records: {
        Row: {
          connector_id: string
          external_id: string
          fetched_at: string
          id: string
          payload: Json
          published_at: string | null
          record_type: string | null
          summary: string | null
          title: string
          url: string | null
        }
        Insert: {
          connector_id: string
          external_id: string
          fetched_at?: string
          id?: string
          payload?: Json
          published_at?: string | null
          record_type?: string | null
          summary?: string | null
          title: string
          url?: string | null
        }
        Update: {
          connector_id?: string
          external_id?: string
          fetched_at?: string
          id?: string
          payload?: Json
          published_at?: string | null
          record_type?: string | null
          summary?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_records_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          api_base_url: string | null
          api_key_secret_name: string | null
          category: string
          config: Json
          connector_type: string
          created_at: string
          description: string | null
          enabled: boolean
          homepage_url: string | null
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          name: string
          records_count: number
          requires_api_key: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          api_key_secret_name?: string | null
          category: string
          config?: Json
          connector_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          homepage_url?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name: string
          records_count?: number
          requires_api_key?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          api_key_secret_name?: string | null
          category?: string
          config?: Json
          connector_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          homepage_url?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name?: string
          records_count?: number
          requires_api_key?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          error_message: string | null
          file_size: number
          filename: string
          id: string
          mime_type: string
          status: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_size: number
          filename: string
          id?: string
          mime_type: string
          status?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          status?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      fictional_users: {
        Row: {
          avatar_seed: string | null
          created_at: string
          department: string | null
          display_name: string
          email: string | null
          id: string
          job_title: string | null
        }
        Insert: {
          avatar_seed?: string | null
          created_at?: string
          department?: string | null
          display_name: string
          email?: string | null
          id?: string
          job_title?: string | null
        }
        Update: {
          avatar_seed?: string | null
          created_at?: string
          department?: string | null
          display_name?: string
          email?: string | null
          id?: string
          job_title?: string | null
        }
        Relationships: []
      }
      profile_certifications: {
        Row: {
          created_at: string
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_year: number | null
          field_of_study: string | null
          id: string
          institution: string
          start_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution: string
          start_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution?: string
          start_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_experience: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean
          location: string | null
          role: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          role: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          role?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          headline?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          member_role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          status: string
          training_module_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          status?: string
          training_module_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          status?: string
          training_module_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          compliance_requirement_id: string | null
          content_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          compliance_requirement_id?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          compliance_requirement_id?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_compliance_requirement_id_fkey"
            columns: ["compliance_requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_manager: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      manages_user: {
        Args: { _manager_id: string; _target_user_id: string }
        Returns: boolean
      }
      teams_managed_by: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
      regulation_category:
        | "sanctions"
        | "aml_cft"
        | "prudential"
        | "conduct_reporting"
        | "operational_cyber"
      team_member_role: "manager" | "member"
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
      app_role: ["admin", "user", "manager"],
      regulation_category: [
        "sanctions",
        "aml_cft",
        "prudential",
        "conduct_reporting",
        "operational_cyber",
      ],
      team_member_role: ["manager", "member"],
    },
  },
} as const
