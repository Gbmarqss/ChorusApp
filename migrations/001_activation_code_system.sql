-- =====================================================
-- Migration: Novo Sistema de Autenticação com Código
-- =====================================================
-- Descrição: Adiciona sistema de ativação por código único
-- Autor: ChorusApp Team
-- Data: 2026-02-03
-- =====================================================

-- 1. Adicionar novas colunas à tabela users
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS activation_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS code_used_at TIMESTAMP;

-- 2. Criar índices para performance
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_activation_code 
ON users(activation_code) 
WHERE activation_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_active 
ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_users_ministry 
ON users(ministry_id);

-- 3. Função para gerar código único
-- =====================================================

CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gera código no formato CHORUS-XXXXX (5 dígitos)
    new_code := 'CHORUS-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    -- Verifica se código já existe
    SELECT EXISTS(
      SELECT 1 FROM users WHERE activation_code = new_code
    ) INTO code_exists;
    
    -- Se não existe, retorna o código
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para validar e ativar conta
-- =====================================================

CREATE OR REPLACE FUNCTION activate_user_account(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Busca usuário com email e código correspondentes
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email
    AND activation_code = p_code
    AND is_active = FALSE
    AND code_used_at IS NULL;
  
  -- Se não encontrou, retorna erro
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Código inválido ou já utilizado'
    );
  END IF;
  
  -- Ativa a conta e invalida o código
  UPDATE users
  SET is_active = TRUE,
      code_used_at = NOW()
  WHERE id = v_user_id;
  
  -- Retorna sucesso
  RETURN json_build_object(
    'success', TRUE,
    'user_id', v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atualizar usuários existentes (marcar como ativos)
-- =====================================================

-- Marca todos os usuários existentes como ativos
-- (para não quebrar o sistema atual)
UPDATE users 
SET is_active = TRUE 
WHERE is_active IS NULL OR is_active = FALSE;

-- 6. Criar view auxiliar para evitar recursão RLS
-- =====================================================

CREATE OR REPLACE VIEW current_user_info AS
SELECT 
  id,
  role,
  ministry_id,
  is_active
FROM users
WHERE id = auth.uid();

-- 7. Atualizar políticas RLS (SEM RECURSÃO)
-- =====================================================

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Superadmin full access" ON users;
DROP POLICY IF EXISTS "Admin ministry access" ON users;
DROP POLICY IF EXISTS "User own profile" ON users;
DROP POLICY IF EXISTS "User update own profile" ON users;
DROP POLICY IF EXISTS "Public read for activation" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- SELECT: Qualquer usuário autenticado pode ler
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Apenas superadmin e admin podem criar
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role IN ('superadmin', 'admin')
    )
  );

-- UPDATE: Próprio usuário OU admin do ministério
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM current_user_info WHERE role = 'superadmin')
    OR EXISTS (
      SELECT 1 FROM current_user_info cui
      WHERE cui.role = 'admin' AND cui.ministry_id = users.ministry_id
    )
  );

-- DELETE: Apenas superadmin
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM current_user_info WHERE role = 'superadmin')
  );

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Comentários para documentação
-- =====================================================

COMMENT ON COLUMN users.activation_code IS 'Código único para primeiro acesso (formato: CHORUS-XXXXX)';
COMMENT ON COLUMN users.is_active IS 'Indica se a conta foi ativada pelo usuário';
COMMENT ON COLUMN users.code_used_at IS 'Data/hora em que o código foi utilizado';

COMMENT ON FUNCTION generate_activation_code() IS 'Gera código único de ativação no formato CHORUS-XXXXX';
COMMENT ON FUNCTION activate_user_account(TEXT, TEXT) IS 'Valida código e ativa conta de usuário';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Para verificar se funcionou:
-- SELECT generate_activation_code(); -- Deve retornar algo como CHORUS-12345
-- SELECT * FROM users LIMIT 5; -- Deve mostrar as novas colunas
