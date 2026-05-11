export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: number;
          user_id: string;
          image_url: string | null;
          item_name: string;
          brand: string;
          category: string;
          color: string | null;
          condition: string;
          estimated_price: number | null;
          price_low: number | null;
          price_high: number | null;
          demand_score: number;
          marketplace_data: Json;
          generated_title: string | null;
          generated_description: string | null;
          tags: string[];
          status: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          image_url?: string | null;
          item_name: string;
          brand: string;
          category: string;
          color?: string | null;
          condition: string;
          estimated_price?: number | null;
          price_low?: number | null;
          price_high?: number | null;
          demand_score?: number;
          marketplace_data?: Json;
          generated_title?: string | null;
          generated_description?: string | null;
          tags?: string[];
          status?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          image_url?: string | null;
          item_name?: string;
          brand?: string;
          category?: string;
          color?: string | null;
          condition?: string;
          estimated_price?: number | null;
          price_low?: number | null;
          price_high?: number | null;
          demand_score?: number;
          marketplace_data?: Json;
          generated_title?: string | null;
          generated_description?: string | null;
          tags?: string[];
          status?: string;
          created_at?: string;
        };
      };
      marketplace_analytics: {
        Row: {
          id: number;
          inventory_item_id: number;
          platform: string;
          estimated_sale_price: number | null;
          estimated_sell_speed: string | null;
          fee_estimate: number | null;
          demand_rating: string | null;
          created_at: string;
        };
        Insert: {
          inventory_item_id: number;
          platform: string;
          estimated_sale_price?: number | null;
          estimated_sell_speed?: string | null;
          fee_estimate?: number | null;
          demand_rating?: string | null;
          created_at?: string;
        };
        Update: {
          inventory_item_id?: number;
          platform?: string;
          estimated_sale_price?: number | null;
          estimated_sell_speed?: string | null;
          fee_estimate?: number | null;
          demand_rating?: string | null;
          created_at?: string;
        };
      };
      saved_analyses: {
        Row: {
          id: number;
          user_id: string;
          raw_analysis: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          raw_analysis: Json;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          raw_analysis?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}