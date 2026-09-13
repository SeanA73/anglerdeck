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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      catch_logs: {
        Row: {
          bait_types: string[] | null
          caught_at: string
          created_at: string
          id: string
          length: number | null
          length_unit: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          notes: string | null
          photo_url: string | null
          species: string
          spot_id: number | null
          updated_at: string
          user_id: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          bait_types?: string[] | null
          caught_at?: string
          created_at?: string
          id?: string
          length?: number | null
          length_unit?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          photo_url?: string | null
          species: string
          spot_id?: number | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          bait_types?: string[] | null
          caught_at?: string
          created_at?: string
          id?: string
          length?: number | null
          length_unit?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          photo_url?: string | null
          species?: string
          spot_id?: number | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      gear_listings: {
        Row: {
          category: string
          condition: string
          contact_method: string | null
          contact_value: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[] | null
          is_sold: boolean
          location: string | null
          price: number
          seller_name: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          condition?: string
          contact_method?: string | null
          contact_value?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_sold?: boolean
          location?: string | null
          price: number
          seller_name?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          condition?: string
          contact_method?: string | null
          contact_value?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_sold?: boolean
          location?: string | null
          price?: number
          seller_name?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_name: string
          catch_log_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          post_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          catch_log_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          catch_log_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_catch_log_id_fkey"
            columns: ["catch_log_id"]
            isOneToOne: false
            referencedRelation: "catch_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regs_audit_log: {
        Row: {
          audited_at: string
          countries: string[]
          id: string
          notes: string | null
          quarter_group: string
          spots_updated: number
        }
        Insert: {
          audited_at?: string
          countries: string[]
          id?: string
          notes?: string | null
          quarter_group: string
          spots_updated?: number
        }
        Update: {
          audited_at?: string
          countries?: string[]
          id?: string
          notes?: string | null
          quarter_group?: string
          spots_updated?: number
        }
        Relationships: []
      }
      affiliate_products: {
        Row: {
          affiliate_url: string
          category: string | null
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          merchant: string | null
          price: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          affiliate_url: string
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          merchant?: string | null
          price?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          affiliate_url?: string
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          merchant?: string | null
          price?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          clicked_at: string
          conversion_amount: number | null
          conversion_date: string | null
          converted: boolean
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          conversion_amount?: number | null
          conversion_date?: string | null
          converted?: boolean
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          conversion_amount?: number | null
          conversion_date?: string | null
          converted?: boolean
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "spot_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      spots: {
        Row: {
          access: Json | null
          best_times: Json
          coordinates: Json
          country: string
          created_at: string
          description: string
          difficulty: string
          featured: boolean
          id: number
          image_key: string
          location: string
          recommended_gear: Json
          regulations: Json
          slug: string
          species: Json
          sponsored: boolean | null
          sponsored_url: string | null
          tides: Json
          title: string
          type: string
          updated_at: string
          water_temperature: Json
          weather: Json
        }
        Insert: {
          access?: Json | null
          best_times: Json
          coordinates: Json
          country: string
          created_at?: string
          description: string
          difficulty: string
          featured?: boolean
          id?: number
          image_key?: string
          location: string
          recommended_gear: Json
          regulations?: Json
          slug: string
          species?: Json
          sponsored?: boolean | null
          sponsored_url?: string | null
          tides: Json
          title: string
          type: string
          updated_at?: string
          water_temperature: Json
          weather: Json
        }
        Update: {
          access?: Json | null
          best_times?: Json
          coordinates?: Json
          country?: string
          created_at?: string
          description?: string
          difficulty?: string
          featured?: boolean
          id?: number
          image_key?: string
          location?: string
          recommended_gear?: Json
          regulations?: Json
          slug?: string
          species?: Json
          sponsored?: boolean | null
          sponsored_url?: string | null
          tides?: Json
          title?: string
          type?: string
          updated_at?: string
          water_temperature?: Json
          weather?: Json
        }
        Relationships: []
      }
      spot_reviews: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          photo_urls: string[] | null
          rating: number
          spot_id: number
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
          visit_date: string | null
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          photo_urls?: string[] | null
          rating: number
          spot_id: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          visit_date?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          photo_urls?: string[] | null
          rating?: number
          spot_id?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          visit_date?: string | null
        }
        Relationships: []
      }
      spot_views: {
        Row: {
          id: string
          spot_id: number
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          spot_id: number
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          spot_id?: number
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
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
