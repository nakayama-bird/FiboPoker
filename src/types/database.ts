export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          session_id: string
          display_name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          session_id: string
          display_name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          session_id?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      rounds: {
        Row: {
          id: string
          room_id: string
          round_number: number
          status: string
          max_value: number | null
          min_value: number | null
          median_value: number | null
          avg_value: number | null
          revealed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          round_number: number
          status?: string
          max_value?: number | null
          min_value?: number | null
          median_value?: number | null
          avg_value?: number | null
          revealed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          round_number?: number
          status?: string
          max_value?: number | null
          min_value?: number | null
          median_value?: number | null
          avg_value?: number | null
          revealed_at?: string | null
          created_at?: string
        }
      }
      card_selections: {
        Row: {
          id: string
          round_id: string
          participant_id: string
          card_value: number
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          participant_id: string
          card_value: number
          created_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          participant_id?: string
          card_value?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_round_statistics: {
        Args: {
          p_round_id: string
        }
        Returns: void
      }
      cleanup_inactive_rooms: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
