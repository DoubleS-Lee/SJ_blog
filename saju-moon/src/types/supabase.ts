/**
 * Supabase 데이터베이스 타입 정의
 * 스키마 기반 수동 작성
 * 향후 `npx supabase gen types typescript --project-id <id>` 로 교체 가능
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          nickname: string | null
          avatar_url: string | null
          custom_avatar_url: string | null
          role: 'free' | 'plus' | 'premium'
          is_admin: boolean
          terms_agreed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          nickname?: string | null
          avatar_url?: string | null
          custom_avatar_url?: string | null
          role?: 'free' | 'plus' | 'premium'
          is_admin?: boolean
          terms_agreed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          nickname?: string | null
          avatar_url?: string | null
          custom_avatar_url?: string | null
          role?: 'free' | 'plus' | 'premium'
          is_admin?: boolean
          terms_agreed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_saju: {
        Row: {
          id: string
          user_id: string
          saju_name: string
          year_cheongan: string
          year_jiji: string
          month_cheongan: string
          month_jiji: string
          day_cheongan: string
          day_jiji: string
          hour_cheongan: string | null
          hour_jiji: string | null
          year_ganji: string
          month_ganji: string
          day_ganji: string
          hour_ganji: string | null
          ilgan: string
          birth_year: number
          birth_month: number
          birth_day: number
          birth_hour: number | null
          birth_minute: number | null
          gender: 'male' | 'female'
          is_lunar: boolean
          full_saju_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          saju_name?: string
          year_cheongan: string
          year_jiji: string
          month_cheongan: string
          month_jiji: string
          day_cheongan: string
          day_jiji: string
          hour_cheongan?: string | null
          hour_jiji?: string | null
          year_ganji: string
          month_ganji: string
          day_ganji: string
          hour_ganji?: string | null
          ilgan: string
          birth_year: number
          birth_month: number
          birth_day: number
          birth_hour?: number | null
          birth_minute?: number | null
          gender: 'male' | 'female'
          is_lunar?: boolean
          full_saju_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          saju_name?: string
          year_cheongan?: string
          year_jiji?: string
          month_cheongan?: string
          month_jiji?: string
          day_cheongan?: string
          day_jiji?: string
          hour_cheongan?: string | null
          hour_jiji?: string | null
          year_ganji?: string
          month_ganji?: string
          day_ganji?: string
          hour_ganji?: string | null
          ilgan?: string
          birth_year?: number
          birth_month?: number
          birth_day?: number
          birth_hour?: number | null
          birth_minute?: number | null
          gender?: 'male' | 'female'
          is_lunar?: boolean
          full_saju_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_saju_ohang: {
        Row: {
          id: string
          user_id: string
          mok_score: number
          hwa_score: number
          to_score: number
          geum_score: number
          su_score: number
          has_mok: boolean
          has_hwa: boolean
          has_to: boolean
          has_geum: boolean
          has_su: boolean
          positions: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mok_score?: number
          hwa_score?: number
          to_score?: number
          geum_score?: number
          su_score?: number
          has_mok?: boolean
          has_hwa?: boolean
          has_to?: boolean
          has_geum?: boolean
          has_su?: boolean
          positions?: Json
          created_at?: string
        }
        Update: {
          user_id?: string
          mok_score?: number
          hwa_score?: number
          to_score?: number
          geum_score?: number
          su_score?: number
          has_mok?: boolean
          has_hwa?: boolean
          has_to?: boolean
          has_geum?: boolean
          has_su?: boolean
          positions?: Json
        }
        Relationships: []
      }
      user_saju_sipsung: {
        Row: {
          id: string
          user_id: string
          bigyeon_score: number
          gyeopjae_score: number
          sikshin_score: number
          sanggwan_score: number
          pyeonjae_score: number
          jeongjae_score: number
          pyeongwan_score: number
          jeonggwan_score: number
          pyeonin_score: number
          jeongin_score: number
          has_bigyeon: boolean
          has_gyeopjae: boolean
          has_sikshin: boolean
          has_sanggwan: boolean
          has_pyeonjae: boolean
          has_jeongjae: boolean
          has_pyeongwan: boolean
          has_jeonggwan: boolean
          has_pyeonin: boolean
          has_jeongin: boolean
          positions: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bigyeon_score?: number
          gyeopjae_score?: number
          sikshin_score?: number
          sanggwan_score?: number
          pyeonjae_score?: number
          jeongjae_score?: number
          pyeongwan_score?: number
          jeonggwan_score?: number
          pyeonin_score?: number
          jeongin_score?: number
          has_bigyeon?: boolean
          has_gyeopjae?: boolean
          has_sikshin?: boolean
          has_sanggwan?: boolean
          has_pyeonjae?: boolean
          has_jeongjae?: boolean
          has_pyeongwan?: boolean
          has_jeonggwan?: boolean
          has_pyeonin?: boolean
          has_jeongin?: boolean
          positions?: Json
          created_at?: string
        }
        Update: {
          user_id?: string
          bigyeon_score?: number
          gyeopjae_score?: number
          sikshin_score?: number
          sanggwan_score?: number
          pyeonjae_score?: number
          jeongjae_score?: number
          pyeongwan_score?: number
          jeonggwan_score?: number
          pyeonin_score?: number
          jeongin_score?: number
          has_bigyeon?: boolean
          has_gyeopjae?: boolean
          has_sikshin?: boolean
          has_sanggwan?: boolean
          has_pyeonjae?: boolean
          has_jeongjae?: boolean
          has_pyeongwan?: boolean
          has_jeonggwan?: boolean
          has_pyeonin?: boolean
          has_jeongin?: boolean
          positions?: Json
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          created_at: string
          event_name: string
          user_id: string | null
          session_id: string
          page_type: string | null
          page_path: string
          content_type: string | null
          content_id: string | null
          content_title: string | null
          category: string | null
          referrer: string | null
          properties: Json
        }
        Insert: {
          id?: string
          created_at?: string
          event_name: string
          user_id?: string | null
          session_id: string
          page_type?: string | null
          page_path: string
          content_type?: string | null
          content_id?: string | null
          content_title?: string | null
          category?: string | null
          referrer?: string | null
          properties?: Json
        }
        Update: {
          id?: string
          created_at?: string
          event_name?: string
          user_id?: string | null
          session_id?: string
          page_type?: string | null
          page_path?: string
          content_type?: string | null
          content_id?: string | null
          content_title?: string | null
          category?: string | null
          referrer?: string | null
          properties?: Json
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          slug: string
          title: string
          summary: string | null
          content: Json
          thumbnail_url: string | null
          category: '연애·궁합' | '커리어·이직' | '재물·투자' | '건강·체질' | '육아·자녀교육' | '기타'
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          target_year: number | null
          view_count: number
          like_count: number
          judgment_rules: Json | null
          judgment_detail: Json | null
          tags: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          summary?: string | null
          content?: Json
          thumbnail_url?: string | null
          category: '연애·궁합' | '커리어·이직' | '재물·투자' | '건강·체질' | '육아·자녀교육' | '기타'
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          target_year?: number | null
          view_count?: number
          like_count?: number
          judgment_rules?: Json | null
          judgment_detail?: Json | null
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          title?: string
          summary?: string | null
          content?: Json
          thumbnail_url?: string | null
          category?: '연애·궁합' | '커리어·이직' | '재물·투자' | '건강·체질' | '육아·자녀교육' | '기타'
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          target_year?: number | null
          view_count?: number
          like_count?: number
          judgment_rules?: Json | null
          judgment_detail?: Json | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_id: string | null
          author_name: string
          author_avatar_url: string | null
          author_ilgan: string | null
          body: string
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_id?: string | null
          author_name: string
          author_avatar_url?: string | null
          author_ilgan?: string | null
          body: string
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          parent_id?: string | null
          author_name?: string
          author_avatar_url?: string | null
          author_ilgan?: string | null
          body?: string
          is_deleted?: boolean
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comment_likes: {
        Row: {
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          comment_id?: string
          user_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          status: 'submitted' | 'answered' | 'closed'
          content_usage_agreed: boolean
          content_usage_agreed_at: string
          content_usage_version: string
          admin_note: string | null
          anonymized_content: string | null
          is_external_use_ready: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          status?: 'submitted' | 'answered' | 'closed'
          content_usage_agreed?: boolean
          content_usage_agreed_at?: string
          content_usage_version?: string
          admin_note?: string | null
          anonymized_content?: string | null
          is_external_use_ready?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          title?: string
          body?: string
          status?: 'submitted' | 'answered' | 'closed'
          content_usage_agreed?: boolean
          content_usage_agreed_at?: string
          content_usage_version?: string
          admin_note?: string | null
          anonymized_content?: string | null
          is_external_use_ready?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      consultation_comments: {
        Row: {
          id: string
          consultation_id: string
          user_id: string
          author_avatar_url: string | null
          author_ilgan: string | null
          body: string
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          user_id: string
          author_avatar_url?: string | null
          author_ilgan?: string | null
          body: string
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          consultation_id?: string
          user_id?: string
          author_avatar_url?: string | null
          author_ilgan?: string | null
          body?: string
          is_deleted?: boolean
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_compatibility_saju: {
        Row: {
          id: string
          user_id: string
          nickname: string
          birth_year: number
          birth_month: number
          birth_day: number
          birth_hour: number | null
          birth_minute: number | null
          gender: 'male' | 'female'
          is_lunar: boolean
          full_saju_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          birth_year: number
          birth_month: number
          birth_day: number
          birth_hour?: number | null
          birth_minute?: number | null
          gender: 'male' | 'female'
          is_lunar?: boolean
          full_saju_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          birth_year?: number
          birth_month?: number
          birth_day?: number
          birth_hour?: number | null
          birth_minute?: number | null
          gender?: 'male' | 'female'
          is_lunar?: boolean
          full_saju_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: number
          grade_separation_enabled: boolean
          ilgan_avatar_urls: Json
          user_avatar_overrides: Json
        }
        Insert: {
          id?: number
          grade_separation_enabled?: boolean
          ilgan_avatar_urls?: Json
          user_avatar_overrides?: Json
        }
        Update: {
          grade_separation_enabled?: boolean
          ilgan_avatar_urls?: Json
          user_avatar_overrides?: Json
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string
          p_window_seconds: number
          p_max_count: number
        }
        Returns: boolean
      }
      increment_post_view_count: {
        Args: {
          p_post_id: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
