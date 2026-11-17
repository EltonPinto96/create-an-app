-- ==============================================================================
-- KUSANGA KITADI — Migration 005: Sistema de Confiança e Reportes Comunitários
-- 1. Detalhes de numerário (notas de 2.000 / 5.000 Kz e tempos de fila)
-- 2. Sistema de Reputação Comunitária (+5 pontos por reporte)
-- 3. Detecção de Contradições e Incerteza Comunitária
-- 4. Proteção anti-spam (Rate Limiting de 5 minutos por utilizador/ATM)
-- ==============================================================================

-- 1. ADICIONAR COLUNAS DETALHADAS À TABELA 'reports'
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS notes_available TEXT,
  ADD COLUMN IF NOT EXISTS queue_time TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT;

-- 2. ADICIONAR COLUNAS DE REPUTAÇÃO À TABELA 'profiles'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reputation_points INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_badge TEXT DEFAULT 'Iniciante';

-- 3. TRIGGER ANTI-SPAM (Máximo 1 reporte por utilizador no mesmo ATM a cada 5 minutos)
CREATE OR REPLACE FUNCTION public.check_report_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count INT;
BEGIN
  IF NEW.reported_by IS NOT NULL THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.reports
    WHERE atm_id = NEW.atm_id
      AND reported_by = NEW.reported_by
      AND created_at > (NOW() - INTERVAL '5 minutes');

    IF v_recent_count > 0 THEN
      RAISE EXCEPTION 'Aguarde 5 minutos antes de enviar outro reporte para este mesmo caixa.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_report_rate_limit ON public.reports;
CREATE TRIGGER trigger_check_report_rate_limit
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_report_rate_limit();

-- 4. TRIGGER DE REPUTAÇÃO (+5 pontos por reporte verificado)
CREATE OR REPLACE FUNCTION public.update_user_reputation_on_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_points INT;
  v_new_badge TEXT;
BEGIN
  IF NEW.reported_by IS NOT NULL THEN
    -- Incrementar pontos e contagem de reportes
    UPDATE public.profiles
    SET 
      reputation_points = COALESCE(reputation_points, 0) + 5,
      reports_count = COALESCE(reports_count, 0) + 1
    WHERE id = NEW.reported_by
    RETURNING reputation_points INTO v_new_points;

    -- Calcular badge de reputação
    IF v_new_points >= 100 THEN
      v_new_badge := 'Guardião de Luanda';
    ELSIF v_new_points >= 40 THEN
      v_new_badge := 'Kamba Vigilante';
    ELSIF v_new_points >= 15 THEN
      v_new_badge := 'Colaborador Activo';
    ELSE
      v_new_badge := 'Iniciante';
    END IF;

    UPDATE public.profiles
    SET reputation_badge = v_new_badge
    WHERE id = NEW.reported_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_reputation ON public.reports;
CREATE TRIGGER trigger_update_user_reputation
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_reputation_on_report();

-- 5. FUNÇÃO PARA DETECTAR CONTRADIÇÃO (Amarelo / Incerto)
CREATE OR REPLACE FUNCTION public.get_atm_confidence_status(p_atm_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_has_available BOOLEAN := false;
  v_has_no_cash BOOLEAN := false;
  v_latest_status TEXT;
BEGIN
  -- Verificar se existem reportes opostos nos últimos 45 minutos
  SELECT 
    BOOL_OR(availability = 'available'),
    BOOL_OR(availability = 'no-cash')
  INTO v_has_available, v_has_no_cash
  FROM public.reports
  WHERE atm_id = p_atm_id
    AND confirmed_at > (NOW() - INTERVAL '45 minutes')
    AND expires_at > NOW();

  -- Se houver simultaneamente reportes de "com dinheiro" e "sem dinheiro", é incerto
  IF v_has_available IS TRUE AND v_has_no_cash IS TRUE THEN
    RETURN 'uncertain';
  END IF;

  -- Caso contrário, pegar o mais recente activo
  SELECT availability INTO v_latest_status
  FROM public.reports
  WHERE atm_id = p_atm_id
    AND expires_at > NOW()
  ORDER BY confirmed_at DESC
  LIMIT 1;

  RETURN COALESCE(v_latest_status, 'stale');
END;
$$;
