-- =====================================================
-- CORREÇÃO: Políticas RLS sem Recursão Infinita
-- =====================================================
-- Execute este script para corrigir o erro de recursão
-- =====================================================

-- 1. Remover TODAS as políticas antigas
-- =====================================================

DROP POLICY IF EXISTS "Superadmin full access" ON users;
DROP POLICY IF EXISTS "Admin ministry access" ON users;
DROP POLICY IF EXISTS "User own profile" ON users;
DROP POLICY IF EXISTS "User update own profile" ON users;
DROP POLICY IF EXISTS "Public read for activation" ON users;
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON users;
DROP POLICY IF EXISTS "Permitir atualização para admins e líderes" ON users;

-- 2. Criar view auxiliar para evitar recursão
-- =====================================================

-- View que armazena role e ministry do usuário logado
CREATE OR REPLACE VIEW current_user_info AS
SELECT 
  id,
  role,
  ministry_id,
  is_active
FROM users
WHERE id = auth.uid();

-- 3. Criar políticas RLS corretas (SEM RECURSÃO)
-- =====================================================

-- SELECT: Qualquer usuário autenticado pode ler
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- INSERT: Apenas superadmin e admin podem criar
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role IN ('superadmin', 'admin')
    )
  );

-- UPDATE: Usuário pode atualizar próprio perfil OU admin pode atualizar do ministério
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    -- Próprio usuário
    id = auth.uid()
    OR
    -- Superadmin pode tudo
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role = 'superadmin'
    )
    OR
    -- Admin pode editar do próprio ministério
    EXISTS (
      SELECT 1 FROM current_user_info cui
      WHERE cui.role = 'admin'
      AND cui.ministry_id = users.ministry_id
    )
  )
  WITH CHECK (
    -- Usuário comum não pode alterar role, ministry, is_active
    (
      id = auth.uid()
      AND role = (SELECT role FROM users WHERE id = auth.uid())
      AND ministry_id = (SELECT ministry_id FROM users WHERE id = auth.uid())
      AND is_active = (SELECT is_active FROM users WHERE id = auth.uid())
    )
    OR
    -- Admin/Superadmin podem alterar
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role IN ('superadmin', 'admin')
    )
  );

-- DELETE: Apenas superadmin pode deletar
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role = 'superadmin'
    )
  );

-- 4. Garantir que RLS está habilitado
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================

-- Teste se funcionou:
-- SELECT * FROM users WHERE id = auth.uid();
