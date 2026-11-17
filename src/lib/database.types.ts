// ============================================================
// KUSANGA KITADI — Database Types (gerado a partir do schema Supabase)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ----------------------------------------------------------------
// Enums
// ----------------------------------------------------------------

export type AtmStatus = 'pending' | 'approved' | 'rejected'
export type AvailabilityStatus = 'available' | 'no-cash' | 'out-of-service'

// ----------------------------------------------------------------
// Row types (o que a base de dados devolve)
// ----------------------------------------------------------------

export interface BankRow {
  id: string
  name: string
  logo_url: string | null
  created_at: string
}

export interface ProfileRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface AdminRoleRow {
  id: string
  user_id: string
  created_at: string
}

export interface AtmRow {
  id: string
  bank_id: string
  name: string
  address: string
  municipality: string
  neighborhood: string | null
  lat: number
  lng: number
  maps_url: string | null
  status: AtmStatus
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface ReportRow {
  id: string
  atm_id: string
  availability: AvailabilityStatus
  reported_by: string | null
  confirmed_at: string
  expires_at: string
  source: string | null
  created_at: string
}

// ----------------------------------------------------------------
// Insert types (o que é passado ao inserir)
// ----------------------------------------------------------------

export interface BankInsert {
  id?: string
  name: string
  logo_url?: string | null
  created_at?: string
}

export interface ProfileInsert {
  id: string
  display_name?: string | null
  avatar_url?: string | null
  created_at?: string
}

export interface AdminRoleInsert {
  id?: string
  user_id: string
  created_at?: string
}

export interface AtmInsert {
  id?: string
  bank_id: string
  name: string
  address: string
  municipality: string
  neighborhood?: string | null
  lat: number
  lng: number
  maps_url?: string | null
  status?: AtmStatus
  created_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  created_at?: string
}

export interface ReportInsert {
  id?: string
  atm_id: string
  availability: AvailabilityStatus
  reported_by?: string | null
  confirmed_at?: string
  source?: string | null
  created_at?: string
}

// ----------------------------------------------------------------
// Update types
// ----------------------------------------------------------------

export interface AtmUpdate {
  bank_id?: string
  name?: string
  address?: string
  municipality?: string
  neighborhood?: string | null
  lat?: number
  lng?: number
  maps_url?: string | null
  status?: AtmStatus
  approved_by?: string | null
  approved_at?: string | null
}

// ----------------------------------------------------------------
// Database interface (para o cliente Supabase tipado)
// ----------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      banks: {
        Row: BankRow
        Insert: BankInsert
        Update: Partial<BankInsert>
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: Partial<ProfileInsert>
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      admin_roles: {
        Row: AdminRoleRow
        Insert: AdminRoleInsert
        Update: Partial<AdminRoleInsert>
        Relationships: [
          {
            foreignKeyName: 'admin_roles_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      atms: {
        Row: AtmRow
        Insert: AtmInsert
        Update: AtmUpdate
        Relationships: [
          {
            foreignKeyName: 'atms_bank_id_fkey'
            columns: ['bank_id']
            referencedRelation: 'banks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'atms_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'atms_approved_by_fkey'
            columns: ['approved_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      reports: {
        Row: ReportRow
        Insert: ReportInsert
        Update: Partial<ReportInsert>
        Relationships: [
          {
            foreignKeyName: 'reports_atm_id_fkey'
            columns: ['atm_id']
            referencedRelation: 'atms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_reported_by_fkey'
            columns: ['reported_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      atm_status: AtmStatus
      availability_status: AvailabilityStatus
    }
    CompositeTypes: Record<string, never>
  }
}

// ----------------------------------------------------------------
// Tipos auxiliares para uso na UI
// ----------------------------------------------------------------

/** ATM aprovado com o report mais recente (pode ser null se não houver reports activos) */
export interface AtmWithLatestReport extends AtmRow {
  bank: Pick<BankRow, 'id' | 'name' | 'logo_url'>
  latest_report: ReportRow | null
}

/** Payload para submissão de novo ATM */
export interface SubmitAtmPayload {
  bank_id: string
  name: string
  address: string
  municipality: string
  neighborhood?: string
  lat: number
  lng: number
  maps_url?: string
}

/** Payload para submissão de report de disponibilidade */
export interface SubmitReportPayload {
  atm_id: string
  availability: AvailabilityStatus
  source?: string
}
