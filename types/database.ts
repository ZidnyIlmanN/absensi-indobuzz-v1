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
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          position: string | null
          department: string | null
          avatar_url: string | null
          employee_id: string
          join_date: string | null
          location: string | null
          work_schedule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          position?: string | null
          department?: string | null
          avatar_url?: string | null
          employee_id: string
          join_date?: string | null
          location?: string | null
          work_schedule?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          position?: string | null
          department?: string | null
          avatar_url?: string | null
          employee_id?: string
          join_date?: string | null
          location?: string | null
          work_schedule?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          user_id: string
          clock_in: string
          clock_out: string | null
          date: string
          work_hours: number
          break_time: number
          overtime_hours: number
          client_visit_time: number
          status: 'working' | 'completed' | 'break' | 'overtime' | 'client_visit'
          location_lat: number
          location_lng: number
          location_address: string
          selfie_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clock_in: string
          clock_out?: string | null
          date: string
          work_hours?: number
          break_time?: number
          overtime_hours?: number
          client_visit_time?: number
          status?: 'working' | 'completed' | 'break' | 'overtime' | 'client_visit'
          location_lat: number
          location_lng: number
          location_address: string
          selfie_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clock_in?: string
          clock_out?: string | null
          date?: string
          work_hours?: number
          break_time?: number
          overtime_hours?: number
          client_visit_time?: number
          status?: 'working' | 'completed' | 'break' | 'overtime' | 'client_visit'
          location_lat?: number
          location_lng?: number
          location_address?: string
          selfie_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_records: {
        Row: {
          id: string
          attendance_id: string
          user_id: string
          type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'overtime_start' | 'overtime_end' | 'client_visit_start' | 'client_visit_end'
          timestamp: string
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          attendance_id: string
          user_id: string
          type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'overtime_start' | 'overtime_end' | 'client_visit_start' | 'client_visit_end'
          timestamp: string
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          attendance_id?: string
          user_id?: string
          type?: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'overtime_start' | 'overtime_end' | 'client_visit_start' | 'client_visit_end'
          timestamp?: string
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          user_id: string
          type: 'leave' | 'permission' | 'reimbursement'
          title: string
          description: string
          start_date: string | null
          end_date: string | null
          amount: number | null
          attachments: Json | null
          status: 'pending' | 'approved' | 'rejected'
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'leave' | 'permission' | 'reimbursement'
          title: string
          description: string
          start_date?: string | null
          end_date?: string | null
          amount?: number | null
          attachments?: Json | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'leave' | 'permission' | 'reimbursement'
          title?: string
          description?: string
          start_date?: string | null
          end_date?: string | null
          amount?: number | null
          attachments?: Json | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'announcement' | 'reminder' | 'approval' | 'system'
          title: string
          message: string
          timestamp: string
          read: boolean
          priority: 'high' | 'medium' | 'low'
          action_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'announcement' | 'reminder' | 'approval' | 'system'
          title: string
          message: string
          timestamp?: string
          read?: boolean
          priority?: 'high' | 'medium' | 'low'
          action_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'announcement' | 'reminder' | 'approval' | 'system'
          title?: string
          message?: string
          timestamp?: string
          read?: boolean
          priority?: 'high' | 'medium' | 'low'
          action_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_locations: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          radius: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          radius?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          radius?: number
          active?: boolean
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}