-- =====================================================
-- Migration: Update Activation Function
-- =====================================================
-- Atualiza função de ativação para substituir UUID temporário
-- pelo UUID real do auth.users
-- =====================================================

CREATE OR REPLACE FUNCTION activate_user_account(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_record RECORD;
  v_result JSON;
BEGIN
  -- Busca usuário com email e código correspondentes
  SELECT id, name INTO v_user_record
  FROM users
  WHERE email = p_email
    AND activation_code = p_code
    AND is_active = FALSE
    AND code_used_at IS NULL;
  
  -- Se não encontrou, retorna erro
  IF v_user_record.id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Código inválido ou já utilizado'
    );
  END IF;
  
  -- Retorna sucesso com ID temporário e nome
  -- O ID será substituído pelo auth.uid() no código JavaScript
  RETURN json_build_object(
    'success', TRUE,
    'temp_user_id', v_user_record.id,
    'user_name', v_user_record.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
