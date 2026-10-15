export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          autora_id: string
          corpo: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          autora_id: string
          corpo: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          autora_id?: string
          corpo?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_autora_id_fkey"
            columns: ["autora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          descricao: string
          id: string
          is_private: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          is_private?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          is_private?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          id: string
          papel: Database["public"]["Enums"]["papel_comunidade"]
          profile_id: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_comunidade"]
          profile_id: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_comunidade"]
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participantes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participantes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participantes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          community_id: string | null
          created_at: string
          descricao: string
          id: string
          inicio: string
          tipo: Database["public"]["Enums"]["tipo_evento"]
          titulo: string
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          inicio: string
          tipo: Database["public"]["Enums"]["tipo_evento"]
          titulo: string
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          inicio?: string
          tipo?: Database["public"]["Enums"]["tipo_evento"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      faiscas: {
        Row: {
          anotacoes: Json
          convidada_id: string
          created_at: string
          daily_room_url: string | null
          horario: string | null
          horarios_propostos: string[]
          id: string
          integracao_erros: string[]
          pauta: Json | null
          pedido: string
          publicacao_autorizada_por: string[]
          resumo: Json | null
          solicitante_id: string
          status: Database["public"]["Enums"]["status_faisca"]
          stream_channel_id: string | null
          tema: string
          updated_at: string
        }
        Insert: {
          anotacoes?: Json
          convidada_id: string
          created_at?: string
          daily_room_url?: string | null
          horario?: string | null
          horarios_propostos: string[]
          id?: string
          integracao_erros?: string[]
          pauta?: Json | null
          pedido: string
          publicacao_autorizada_por?: string[]
          resumo?: Json | null
          solicitante_id: string
          status?: Database["public"]["Enums"]["status_faisca"]
          stream_channel_id?: string | null
          tema: string
          updated_at?: string
        }
        Update: {
          anotacoes?: Json
          convidada_id?: string
          created_at?: string
          daily_room_url?: string | null
          horario?: string | null
          horarios_propostos?: string[]
          id?: string
          integracao_erros?: string[]
          pauta?: Json | null
          pedido?: string
          publicacao_autorizada_por?: string[]
          resumo?: Json | null
          solicitante_id?: string
          status?: Database["public"]["Enums"]["status_faisca"]
          stream_channel_id?: string | null
          tema?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faiscas_convidada_id_fkey"
            columns: ["convidada_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faiscas_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_members: {
        Row: {
          created_at: string
          grupo_id: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grupo_id: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grupo_id?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_members_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          created_at: string
          criado_por: string
          descricao: string
          id: string
          is_private: boolean
          nome: string
          stream_channel_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          descricao: string
          id?: string
          is_private?: boolean
          nome: string
          stream_channel_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          descricao?: string
          id?: string
          is_private?: boolean
          nome?: string
          stream_channel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_cache: {
        Row: {
          chave: string
          created_at: string
          id: string
          resposta: Json
          updated_at: string
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          resposta: Json
          updated_at?: string
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          resposta?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ia_jobs: {
        Row: {
          contexto: Json | null
          created_at: string
          erro: string | null
          estado: string
          fonte: Database["public"]["Enums"]["fonte_saber"]
          fonte_id: string
          id: string
          profile_id: string
          tentativas: number
          texto: string
          updated_at: string
        }
        Insert: {
          contexto?: Json | null
          created_at?: string
          erro?: string | null
          estado?: string
          fonte: Database["public"]["Enums"]["fonte_saber"]
          fonte_id: string
          id?: string
          profile_id: string
          tentativas?: number
          texto: string
          updated_at?: string
        }
        Update: {
          contexto?: Json | null
          created_at?: string
          erro?: string | null
          estado?: string
          fonte?: Database["public"]["Enums"]["fonte_saber"]
          fonte_id?: string
          id?: string
          profile_id?: string
          tentativas?: number
          texto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      piloto_contas: {
        Row: {
          auth_user_id: string
          consentimento_em: string | null
          consentimento_versao: string | null
          created_at: string
          foto: string | null
          ia_consentimento: boolean
          onboarding: boolean
          profile_id: string
        }
        Insert: {
          auth_user_id: string
          consentimento_em?: string | null
          consentimento_versao?: string | null
          created_at?: string
          foto?: string | null
          ia_consentimento?: boolean
          onboarding?: boolean
          profile_id: string
        }
        Update: {
          auth_user_id?: string
          consentimento_em?: string | null
          consentimento_versao?: string | null
          created_at?: string
          foto?: string | null
          ia_consentimento?: boolean
          onboarding?: boolean
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piloto_contas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      piloto_favoritos: {
        Row: {
          post_id: string
          profile_id: string
        }
        Insert: {
          post_id: string
          profile_id: string
        }
        Update: {
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piloto_favoritos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piloto_favoritos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      piloto_limites: {
        Row: {
          chave: string
          janela: string
          quantidade: number
        }
        Insert: {
          chave: string
          janela: string
          quantidade: number
        }
        Update: {
          chave?: string
          janela?: string
          quantidade?: number
        }
        Relationships: []
      }
      piloto_mensagens: {
        Row: {
          autora_id: string
          created_at: string
          faisca_id: string
          id: string
        }
        Insert: {
          autora_id: string
          created_at: string
          faisca_id: string
          id: string
        }
        Update: {
          autora_id?: string
          created_at?: string
          faisca_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piloto_mensagens_autora_id_fkey"
            columns: ["autora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piloto_mensagens_faisca_id_fkey"
            columns: ["faisca_id"]
            isOneToOne: false
            referencedRelation: "faiscas"
            referencedColumns: ["id"]
          },
        ]
      }
      post_coautoras: {
        Row: {
          created_at: string
          id: string
          post_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_coautoras_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_coautoras_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          autora_id: string
          community_id: string | null
          corpo: string
          created_at: string
          id: string
          origem_faisca_id: string | null
          tipo: Database["public"]["Enums"]["tipo_post"]
          titulo: string
          updated_at: string
        }
        Insert: {
          autora_id: string
          community_id?: string | null
          corpo: string
          created_at?: string
          id?: string
          origem_faisca_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_post"]
          titulo: string
          updated_at?: string
        }
        Update: {
          autora_id?: string
          community_id?: string | null
          corpo?: string
          created_at?: string
          id?: string
          origem_faisca_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_post"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_autora_id_fkey"
            columns: ["autora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_origem_faisca_id_fkey"
            columns: ["origem_faisca_id"]
            isOneToOne: true
            referencedRelation: "faiscas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string
          cargo: string
          cidade: string
          created_at: string
          foto_url: string | null
          id: string
          interesses: string[]
          nome: string
          objetivos: string[]
          regional: string
          updated_at: string
        }
        Insert: {
          area: string
          cargo: string
          cidade: string
          created_at?: string
          foto_url?: string | null
          id?: string
          interesses?: string[]
          nome: string
          objetivos?: string[]
          regional: string
          updated_at?: string
        }
        Update: {
          area?: string
          cargo?: string
          cidade?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          interesses?: string[]
          nome?: string
          objetivos?: string[]
          regional?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_respostas: {
        Row: {
          acertos: number
          created_at: string
          id: string
          profile_id: string
          quiz_id: string
          respostas: Json
          updated_at: string
        }
        Insert: {
          acertos: number
          created_at?: string
          id?: string
          profile_id: string
          quiz_id: string
          respostas: Json
          updated_at?: string
        }
        Update: {
          acertos?: number
          created_at?: string
          id?: string
          profile_id?: string
          quiz_id?: string
          respostas?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_respostas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_respostas_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          perguntas: Json
          post_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          perguntas: Json
          post_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          perguntas?: Json
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          profile_id: string
          tipo: Database["public"]["Enums"]["tipo_reacao"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
          tipo: Database["public"]["Enums"]["tipo_reacao"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
          tipo?: Database["public"]["Enums"]["tipo_reacao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saberes: {
        Row: {
          confianca: number
          confirmado: boolean
          created_at: string
          embedding: string | null
          evidencia: string
          fonte: Database["public"]["Enums"]["fonte_saber"]
          fonte_id: string | null
          id: string
          profile_id: string
          saber: string
          updated_at: string
        }
        Insert: {
          confianca: number
          confirmado?: boolean
          created_at?: string
          embedding?: string | null
          evidencia: string
          fonte: Database["public"]["Enums"]["fonte_saber"]
          fonte_id?: string | null
          id?: string
          profile_id: string
          saber: string
          updated_at?: string
        }
        Update: {
          confianca?: number
          confirmado?: boolean
          created_at?: string
          embedding?: string | null
          evidencia?: string
          fonte?: Database["public"]["Enums"]["fonte_saber"]
          fonte_id?: string | null
          id?: string
          profile_id?: string
          saber?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saberes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      saberes_publicos: {
        Row: {
          confianca: number | null
          confirmado: boolean | null
          created_at: string | null
          embedding: string | null
          evidencia: string | null
          fonte: Database["public"]["Enums"]["fonte_saber"] | null
          fonte_id: string | null
          id: string | null
          profile_id: string | null
          saber: string | null
          updated_at: string | null
        }
        Insert: {
          confianca?: number | null
          confirmado?: boolean | null
          created_at?: string | null
          embedding?: string | null
          evidencia?: string | null
          fonte?: Database["public"]["Enums"]["fonte_saber"] | null
          fonte_id?: string | null
          id?: string | null
          profile_id?: string | null
          saber?: string | null
          updated_at?: string | null
        }
        Update: {
          confianca?: number | null
          confirmado?: boolean | null
          created_at?: string | null
          embedding?: string | null
          evidencia?: string | null
          fonte?: Database["public"]["Enums"]["fonte_saber"] | null
          fonte_id?: string | null
          id?: string | null
          profile_id?: string | null
          saber?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saberes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      buscar_saberes: {
        Args: {
          excluir_profile_id: string
          limite: number
          query_embedding: string
        }
        Returns: {
          area: string
          evidencias: string[]
          nome: string
          profile_id: string
          regional: string
          similaridade: number
        }[]
      }
      buscar_saberes_piloto: {
        Args: {
          excluir_profile_id: string
          limite: number
          query_embedding: string
        }
        Returns: {
          area: string
          evidencias: string[]
          nome: string
          profile_id: string
          regional: string
          similaridade: number
        }[]
      }
      criar_comunidade: {
        Args: { dados: Json; usuaria_id: string }
        Returns: Json
      }
      operar_faisca: {
        Args: {
          acao: string
          dados?: Json
          faisca_id: string
          usuaria_id: string
        }
        Returns: Json
      }
      pegar_job: { Args: never; Returns: Json }
      piloto_autorizar: {
        Args: {
          autorizado: boolean
          faisca_id: string
          resumo_lido: Json
          usuaria_id: string
        }
        Returns: Json
      }
      piloto_consumir: {
        Args: {
          chave_input: string
          janela_input: string
          limite_input: number
        }
        Returns: boolean
      }
      piloto_provisionar: { Args: { auth_id: string }; Returns: string }
      piloto_revisar_resumo: {
        Args: { faisca_id: string; novo_resumo: Json; usuaria_id: string }
        Returns: Json
      }
      publicar_faisca: {
        Args: { faisca_id: string; perguntas: Json; usuaria_id: string }
        Returns: Json
      }
      registrar_saber: { Args: { dados: Json }; Returns: Json }
    }
    Enums: {
      fonte_saber: "perfil" | "forum" | "dica" | "faisca"
      papel_comunidade: "membro" | "moderadora"
      status_faisca:
        | "pendente"
        | "aceita"
        | "recusada"
        | "realizada"
        | "cancelada"
      tipo_evento: "evento" | "mentoria" | "atividade"
      tipo_post: "discussao" | "dica"
      tipo_reacao: "curtir" | "inspirador" | "util"
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
      fonte_saber: ["perfil", "forum", "dica", "faisca"],
      papel_comunidade: ["membro", "moderadora"],
      status_faisca: [
        "pendente",
        "aceita",
        "recusada",
        "realizada",
        "cancelada",
      ],
      tipo_evento: ["evento", "mentoria", "atividade"],
      tipo_post: ["discussao", "dica"],
      tipo_reacao: ["curtir", "inspirador", "util"],
    },
  },
} as const

