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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          active: boolean
          client_id: string | null
          created_at: string
          id: string
          key_hash: string
          key_prefix: string | null
          last_used_at: string | null
          name: string
          permissions: Json
        }
        Insert: {
          active?: boolean
          client_id?: string | null
          created_at?: string
          id?: string
          key_hash: string
          key_prefix?: string | null
          last_used_at?: string | null
          name: string
          permissions?: Json
        }
        Update: {
          active?: boolean
          client_id?: string | null
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string
          permissions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          api_key_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          api_key_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          api_key_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          created_at: string
          default_imposition: Json | null
          email: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_imposition?: Json | null
          email?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          default_imposition?: Json | null
          email?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      envios_gls: {
        Row: {
          bultos: number | null
          cp_destino: string | null
          cp_origen: string | null
          created_at: string
          destinatario: string
          direccion: string
          estado: string
          expedicion: string
          fecha: string
          fecha_actualizacion: string | null
          localidad: string
          observacion: string | null
          pedido_id: string | null
          peso: number | null
          tracking: string | null
          updated_at: string
        }
        Insert: {
          bultos?: number | null
          cp_destino?: string | null
          cp_origen?: string | null
          created_at?: string
          destinatario: string
          direccion: string
          estado: string
          expedicion: string
          fecha: string
          fecha_actualizacion?: string | null
          localidad: string
          observacion?: string | null
          pedido_id?: string | null
          peso?: number | null
          tracking?: string | null
          updated_at?: string
        }
        Update: {
          bultos?: number | null
          cp_destino?: string | null
          cp_origen?: string | null
          created_at?: string
          destinatario?: string
          direccion?: string
          estado?: string
          expedicion?: string
          fecha?: string
          fecha_actualizacion?: string | null
          localidad?: string
          observacion?: string | null
          pedido_id?: string | null
          peso?: number | null
          tracking?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_records: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          imposed_pdf_path: string | null
          job_id: string
          pdf_path: string | null
          processing_time_ms: number | null
          record_data: Json | null
          record_index: number
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          imposed_pdf_path?: string | null
          job_id: string
          pdf_path?: string | null
          processing_time_ms?: number | null
          record_data?: Json | null
          record_index: number
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          imposed_pdf_path?: string | null
          job_id?: string
          pdf_path?: string | null
          processing_time_ms?: number | null
          record_data?: Json | null
          record_index?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_count: number
          eta_seconds: number | null
          excel_path: string | null
          id: string
          imposition_options: Json | null
          job_code: string | null
          output_options: Json | null
          output_path: string | null
          priority: number
          processed_imposition: number
          processed_vdp: number
          started_at: string | null
          status: string
          template_id: string | null
          total_records: number | null
          vdp_options: Json | null
          zip_path: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          eta_seconds?: number | null
          excel_path?: string | null
          id?: string
          imposition_options?: Json | null
          job_code?: string | null
          output_options?: Json | null
          output_path?: string | null
          priority?: number
          processed_imposition?: number
          processed_vdp?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          total_records?: number | null
          vdp_options?: Json | null
          zip_path?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          eta_seconds?: number | null
          excel_path?: string | null
          id?: string
          imposition_options?: Json | null
          job_code?: string | null
          output_options?: Json | null
          output_path?: string | null
          priority?: number
          processed_imposition?: number
          processed_vdp?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          total_records?: number | null
          vdp_options?: Json | null
          zip_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          curso: string
          direccion: string
          email: string
          estado: string
          estado_envio: string | null
          expedicion_gls: string | null
          fecha: string
          id: string
          nombre: string
          poblacion: string
          tracking_gls: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          curso: string
          direccion: string
          email: string
          estado: string
          estado_envio?: string | null
          expedicion_gls?: string | null
          fecha: string
          id: string
          nombre: string
          poblacion: string
          tracking_gls?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          curso?: string
          direccion?: string
          email?: string
          estado?: string
          estado_envio?: string | null
          expedicion_gls?: string | null
          fecha?: string
          id?: string
          nombre?: string
          poblacion?: string
          tracking_gls?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      productos_fragma: {
        Row: {
          caracteristicas: string | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          detalles_adicionales: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          nombre: string
          precio_desde: number | null
          precio_hasta: number | null
          tiempos_entrega: string | null
        }
        Insert: {
          caracteristicas?: string | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          detalles_adicionales?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          nombre: string
          precio_desde?: number | null
          precio_hasta?: number | null
          tiempos_entrega?: string | null
        }
        Update: {
          caracteristicas?: string | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          detalles_adicionales?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          nombre?: string
          precio_desde?: number | null
          precio_hasta?: number | null
          tiempos_entrega?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          active: boolean
          client_id: string | null
          created_at: string
          default_imposition: Json | null
          fields_mapping: Json | null
          id: string
          name: string
          pages_config: Json | null
          template_file: string | null
          type: string
          version: number
        }
        Insert: {
          active?: boolean
          client_id?: string | null
          created_at?: string
          default_imposition?: Json | null
          fields_mapping?: Json | null
          id?: string
          name: string
          pages_config?: Json | null
          template_file?: string | null
          type: string
          version?: number
        }
        Update: {
          active?: boolean
          client_id?: string | null
          created_at?: string
          default_imposition?: Json | null
          fields_mapping?: Json | null
          id?: string
          name?: string
          pages_config?: Json | null
          template_file?: string | null
          type?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      users: {
        Row: {
          active: boolean
          client_id: string | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          password_hash: string | null
          role: string
          totp_secret: string | null
        }
        Insert: {
          active?: boolean
          client_id?: string | null
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          password_hash?: string | null
          role?: string
          totp_secret?: string | null
        }
        Update: {
          active?: boolean
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password_hash?: string | null
          role?: string
          totp_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      match_productos_fragma: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          caracteristicas: string
          categoria: string
          descripcion: string
          id: number
          nombre: string
          precio_desde: number
          precio_hasta: number
          similarity: number
          tiempos_entrega: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "viewer"
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
      app_role: ["admin", "staff", "viewer"],
    },
  },
} as const
