-- ==============================================================================
-- KUSANGA KITADI — Migration 003: Notificações de Novos Cadastros para Admins e Moderadores
-- ==============================================================================

-- 1. Criar tabela de notificações administrativas
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  provider TEXT DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Habilitar RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Acesso (RLS)
-- Administradores e Moderadores podem visualizar notificações
CREATE POLICY "Admins e moderadores podem ver notificações de registo"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR public.is_moderator()
  );

-- Permitir atualização de status de leitura por moderadores e admins
CREATE POLICY "Admins e moderadores podem marcar notificacoes como lidas"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR public.is_moderator()
  );

-- Permitir inserção pela app e por triggers
CREATE POLICY "Sistema e utilizadores autenticados podem registar novos utilizadores"
  ON public.admin_notifications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 3. Trigger para registo automático quando um utilizador se cadastra no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user_registration_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_provider TEXT;
BEGIN
  -- Extrair nome e fornecedor dos metadados do auth.users
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'google'
  );

  INSERT INTO public.admin_notifications (
    user_id,
    user_email,
    user_name,
    provider,
    created_at,
    read
  ) VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_provider,
    NOW(),
    false
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não interromper o fluxo de registo se houver erro ao gravar notificação
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration_notification();

-- ==============================================================================
-- INSTRUÇÕES DE ENVIO DE EMAIL VIA SUPABASE EDGE FUNCTION / WEBHOOK (RESEND / SMTP)
-- ==============================================================================
-- Para enviar um email aos administradores e moderadores automaticamente:
-- 1. No painel do Supabase, aceder a "Database" -> "Webhooks" (ou "Edge Functions").
-- 2. Criar um Webhook para a tabela 'admin_notifications' no evento 'INSERT'.
-- 3. Apontar o Webhook para a tua Edge Function ou serviço de email (Resend / SendGrid):
--    Endpoint: https://<project-ref>.supabase.co/functions/v1/notify-admin-signup
-- 4. O corpo do webhook conterá: user_email, user_name, provider e created_at.
