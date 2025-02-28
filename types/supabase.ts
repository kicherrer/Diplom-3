export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MediaItem = {
  id: string
  title: string
  type: 'movie' | 'tv'
  // Add other media item fields
}

export type UserMediaItem = {
  id: string
  user_id: string
  media_item_id: string
  status: 'watched' | 'plan_to_watch' | 'watching'
  rating: number | null
  // Add other user media item fields
}

export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  points: number
  is_admin: boolean
  created_at: string
  // Add other profile fields
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          is_admin?: boolean
          points?: number
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          is_admin?: boolean
          points?: number
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      media_items: {
        Row: MediaItem
        Insert: {
          id?: string
          tmdb_id: number
          title: string
          type: 'movie' | 'tv' | 'documentary'
          poster_url?: string | null
          release_date?: string | null
          overview?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tmdb_id?: number
          title?: string
          type?: 'movie' | 'tv' | 'documentary'
          poster_url?: string | null
          release_date?: string | null
          overview?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_media_items: {
        Row: UserMediaItem
        Insert: {
          id?: string
          user_id: string
          media_item_id: string
          status?: 'watched' | 'watching' | 'plan_to_watch' | null
          rating?: number | null
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_item_id?: string
          status?: 'watched' | 'watching' | 'plan_to_watch' | null
          rating?: number | null
          review?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          points: number
          criteria_type: string
          criteria_value: number
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          points?: number
          criteria_type: string
          criteria_value: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          points?: number
          criteria_type?: string
          criteria_value?: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: number
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}