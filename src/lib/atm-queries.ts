import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
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

  // 2. Para cada ATM, buscar o report mais recente não expirado
  const atmIds = atms.map((a) => a.id)

  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .in('atm_id', atmIds)
    .gt('expires_at', now)
    .order('confirmed_at', { ascending: false })

  if (reportsError) throw reportsError

  // 3. Juntar: um report por ATM (o mais recente)
  const latestReportByAtm = new Map(
    (reports ?? []).reduce<[string, typeof reports[0]][]>((acc, r) => {
      if (!acc.find(([id]) => id === r.atm_id)) {
        acc.push([r.atm_id, r])
      }
      return acc
    }, [])
  )

  return atms.map((atm) => ({
    ...atm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bank: (atm as any).bank,
    latest_report: latestReportByAtm.get(atm.id) ?? null,
  })) as AtmWithLatestReport[]
}

export function useApprovedAtms() {
  return useQuery({
    queryKey: atmQueryKeys.approved(),
    queryFn: fetchApprovedAtms,
    staleTime: 1000 * 60 * 2, // 2 minutos (os reports expiram a cada 2h)
    refetchInterval: 1000 * 60 * 5, // re-fetch a cada 5 minutos
  })
}

// ============================================================
// useSubmitAtm
// Submete um novo ATM — fica com status 'pending' para aprovação
// ============================================================

async function submitAtm(payload: SubmitAtmPayload): Promise<AtmRow> {
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
      // Invalida a lista de ATMs aprovados (não muda visualmente, mas boa prática)
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
    },
  })
}

// ============================================================
// useSubmitReport
// Submete um reporte de disponibilidade para um ATM
// ============================================================

async function submitReport(payload: SubmitReportPayload) {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Tens de estar autenticado para submeter um reporte.')

  const { data, error } = await supabase
    .from('reports')
    .insert({
      atm_id: payload.atm_id,
      availability: payload.availability,
      reported_by: session.session.user.id,
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
      // Invalida os ATMs aprovados para actualizar o latest_report
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.approved() })
      queryClient.invalidateQueries({ queryKey: atmQueryKeys.reports(data.atm_id) })
    },
  })
}

// ============================================================
// useAdminPendingAtms
// Lista ATMs pendentes — só para admins
// ============================================================

async function fetchPendingAtms(): Promise<AtmRow[]> {
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
    staleTime: 1000 * 30, // 30 segundos
  })
}

// ============================================================
// useApproveAtm
// Aprova um ATM pendente — só para admins
// ============================================================

async function approveAtm(atmId: string): Promise<AtmRow> {
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
