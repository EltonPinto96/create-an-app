import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, hasSupabase } from './supabase'
import type {
  AtmWithLatestReport,
  AtmRow,
  SubmitAtmPayload,
  SubmitReportPayload,
} from './database.types'

// ============================================================
// Query keys
// ============================================================

export const atmQueryKeys = {
  all: ['atms'] as const,
  approved: () => [...atmQueryKeys.all, 'approved'] as const,
  pending: () => [...atmQueryKeys.all, 'pending'] as const,
  detail: (id: string) => [...atmQueryKeys.all, 'detail', id] as const,
  reports: (atmId: string) => ['reports', atmId] as const,
}

// ============================================================
// useApprovedAtms
// Busca todos os ATMs aprovados com o report mais recente não expirado
// ============================================================

async function fetchApprovedAtms(): Promise<AtmWithLatestReport[]> {
  if (!hasSupabase) return []

  const now = new Date().toISOString()

  // 1. Buscar ATMs aprovados com dados do banco
  const { data: atms, error: atmsError } = await supabase
    .from('atms')
    .select(`
      *,
      bank:banks(id, name, logo_url)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (atmsError) throw atmsError
  if (!atms || atms.length === 0) return []

  // 2. Para cada ATM, buscar os reports activos
  const atmIds = atms.map((a) => a.id)

  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .in('atm_id', atmIds)
    .gt('expires_at', now)
    .order('confirmed_at', { ascending: false })

  if (reportsError) throw reportsError

  // 3. Juntar: agrupar por ATM e verificar detecção de contradição nos últimos 45 minutos
  const fortyFiveMinAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString()
  
  const reportsByAtm = (reports ?? []).reduce<Record<string, typeof reports>>((acc, r) => {
    if (!acc[r.atm_id]) acc[r.atm_id] = []
    acc[r.atm_id].push(r)
    return acc
  }, {})

  return atms.map((atm) => {
    const atmReports = reportsByAtm[atm.id] ?? []
    const latest = atmReports[0] ? { ...atmReports[0] } : null

    if (latest) {
      // Verificar se há reportes contraditórios nos últimos 45 min
      const recent = atmReports.filter((r) => r.confirmed_at >= fortyFiveMinAgo)
      const hasAvailable = recent.some((r) => r.availability === 'available')
      const hasNoCash = recent.some((r) => r.availability === 'no-cash')

      if (hasAvailable && hasNoCash) {
        latest.availability = 'uncertain' as any
      }
    }

    return {
      ...atm,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bank: (atm as any).bank,
      latest_report: latest,
    }
  }) as AtmWithLatestReport[]
}

export function useApprovedAtms(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: atmQueryKeys.approved(),
    queryFn: fetchApprovedAtms,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: hasSupabase ? 1000 * 60 * 5 : false,
  })
}

// ============================================================
// useSubmitAtm
// Submete um novo ATM — fica com status 'pending' para aprovação
// ============================================================

async function submitAtm(payload: SubmitAtmPayload): Promise<AtmRow> {
  if (!hasSupabase) throw new Error('Backend não configurado. Contacta o administrador.')

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Tens de estar autenticado para submeter um ATM.')

  const { data, error } = await supabase
    .from('atms')
    .insert({
      ...payload,
      status: 'pending',
      created_by: session.session.user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export function useSubmitAtm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitAtm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
    },
  })
}

// ============================================================
// useSubmitReport
// Submete um reporte de disponibilidade para um ATM
// ============================================================

async function submitReport(payload: SubmitReportPayload) {
  if (!hasSupabase) throw new Error('Backend não configurado. Contacta o administrador.')

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Tens de estar autenticado para submeter um reporte.')

  const { data, error } = await supabase
    .from('reports')
    .insert({
      atm_id: payload.atm_id,
      availability: payload.availability,
      reported_by: session.session.user.id,
      notes_available: payload.notes_available ?? null,
      queue_time: payload.queue_time ?? null,
      comment: payload.comment ?? null,
      confirmed_at: new Date().toISOString(),
      source: payload.source ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export function useSubmitReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.reports(data.atm_id) })
    },
  })
}

// ============================================================
// useAtmRecentReports
// Histórico recente de reportes para o ATM (últimas 2 horas)
// ============================================================

export async function fetchAtmReports(atmId: string): Promise<ReportRow[]> {
  if (!hasSupabase || !atmId) return []

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('atm_id', atmId)
    .gt('confirmed_at', twoHoursAgo)
    .order('confirmed_at', { ascending: false })
    .limit(8)

  if (error) throw error
  return (data ?? []) as ReportRow[]
}

export function useAtmRecentReports(atmId: string | null | undefined) {
  return useQuery({
    queryKey: atmQueryKeys.reports(atmId || ''),
    queryFn: () => fetchAtmReports(atmId || ''),
    enabled: Boolean(atmId && hasSupabase),
    staleTime: 1000 * 30, // 30 segundos
  })
}

// ============================================================
// useAdminPendingAtms
// Lista ATMs pendentes — só para admins
// ============================================================

async function fetchPendingAtms(): Promise<AtmRow[]> {
  if (!hasSupabase) return []

  const { data, error } = await supabase
    .from('atms')
    .select(`
      *,
      bank:banks(id, name, logo_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as AtmRow[]
}

export function useAdminPendingAtms() {
  return useQuery({
    queryKey: atmQueryKeys.pending(),
    queryFn: fetchPendingAtms,
    staleTime: 1000 * 30,
  })
}

// ============================================================
// useApproveAtm
// Aprova um ATM pendente — só para admins
// ============================================================

async function approveAtm(atmId: string): Promise<AtmRow> {
  if (!hasSupabase) throw new Error('Backend não configurado.')

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Tens de estar autenticado.')

  const { data, error } = await supabase
    .from('atms')
    .update({
      status: 'approved',
      approved_by: session.session.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', atmId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function useApproveAtm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveAtm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.pending() })
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
    },
  })
}

// ============================================================
// useRejectAtm
// Rejeita um ATM pendente — só para admins
// ============================================================

async function rejectAtm(atmId: string): Promise<AtmRow> {
  if (!hasSupabase) throw new Error('Backend não configurado.')

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Tens de estar autenticado.')

  const { data, error } = await supabase
    .from('atms')
    .update({
      status: 'rejected',
      approved_by: session.session.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', atmId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function useRejectAtm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectAtm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.pending() })
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
    },
  })
}

// ============================================================
// useUserReports
// Histórico pessoal de contribuições do utilizador logado
// ============================================================

export interface UserPersonalReport {
  id: string
  atm_id: string
  atm_name?: string
  atm_bank?: string
  availability: string
  notes_available?: string | null
  queue_time?: string | null
  confirmed_at: string
}

export async function fetchUserReports(userId: string): Promise<UserPersonalReport[]> {
  if (!hasSupabase || !userId) return []

  const { data, error } = await supabase
    .from('reports')
    .select(`
      id,
      atm_id,
      availability,
      notes_available,
      queue_time,
      confirmed_at,
      atm:atms(name, bank:banks(name))
    `)
    .eq('reported_by', userId)
    .order('confirmed_at', { ascending: false })
    .limit(10)

  if (error) {
    console.warn("Aviso ao buscar histórico pessoal de reportes:", error.message)
    return []
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    atm_id: r.atm_id,
    atm_name: r.atm?.name || 'Caixa Automático',
    atm_bank: r.atm?.bank?.name || 'Banco',
    availability: r.availability,
    notes_available: r.notes_available,
    queue_time: r.queue_time,
    confirmed_at: r.confirmed_at,
  }))
}

export function useUserReports(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-reports', userId],
    queryFn: () => fetchUserReports(userId || ''),
    enabled: Boolean(userId && hasSupabase),
    staleTime: 1000 * 60, // 1 minuto
  })
}

// ============================================================
// useAdminRecentReports
// Consulta os reportes mais recentes para auditoria e moderação
// ============================================================

export interface AdminReportAuditItem {
  id: string
  atm_id: string
  atm_name: string
  atm_bank: string
  availability: string
  notes_available: string | null
  queue_time: string | null
  comment: string | null
  confirmed_at: string
  expires_at: string
  reported_by: string | null
  reporter_name?: string
}

export async function fetchAdminRecentReports(): Promise<AdminReportAuditItem[]> {
  if (!hasSupabase) return []

  const { data, error } = await supabase
    .from('reports')
    .select(`
      id,
      atm_id,
      availability,
      notes_available,
      queue_time,
      comment,
      confirmed_at,
      expires_at,
      reported_by,
      atm:atms(name, bank:banks(name)),
      profile:profiles(display_name)
    `)
    .order('confirmed_at', { ascending: false })
    .limit(50)

  if (error) {
    console.warn('Erro ao carregar reportes para auditoria:', error.message)
    return []
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    atm_id: r.atm_id,
    atm_name: r.atm?.name || 'Caixa Automático',
    atm_bank: r.atm?.bank?.name || 'Banco',
    availability: r.availability,
    notes_available: r.notes_available,
    queue_time: r.queue_time,
    comment: r.comment,
    confirmed_at: r.confirmed_at,
    expires_at: r.expires_at,
    reported_by: r.reported_by,
    reporter_name: r.profile?.display_name || 'Utilizador Comunitário',
  }))
}

export function useAdminRecentReports(enabled: boolean = true) {
  return useQuery({
    queryKey: ['admin-reports-audit'],
    queryFn: fetchAdminRecentReports,
    enabled: Boolean(enabled && hasSupabase),
    staleTime: 1000 * 30, // 30 segundos
  })
}

// ============================================================
// useDeleteReport
// Invalida e remove um reporte fraudulento ou spam
// ============================================================

export async function deleteReport(reportId: string): Promise<void> {
  if (!hasSupabase) throw new Error('Backend não configurado.')

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)

  if (error) throw error
}

export function useDeleteReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports-audit'] })
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
    },
  })
}

// ============================================================
// useDeleteAtm
// Elimina definitivamente um ATM do sistema (Super Admin)
// ============================================================

export async function deleteAtm(atmId: string): Promise<void> {
  if (!hasSupabase) throw new Error('Backend não configurado.')

  const { error } = await supabase
    .from('atms')
    .delete()
    .eq('id', atmId)

  if (error) throw error
}

export function useDeleteAtm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAtm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.pending() })
    },
  })
}
