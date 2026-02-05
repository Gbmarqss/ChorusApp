-- =====================================================
-- Migration: Recriar current_user_info View
-- =====================================================
-- Descrição: Recria a view e todas as políticas dependentes
-- Autor: Antigravity
-- Data: 2026-02-04
-- =====================================================

-- 1. Remover políticas que dependem da view
-- =====================================================

DROP POLICY IF EXISTS "user_ministries_manage" ON user_ministries;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- 2. Recriar a view
-- =====================================================

DROP VIEW IF EXISTS current_user_info CASCADE;

CREATE OR REPLACE VIEW current_user_info AS
SELECT 
  id,
  role,
  ministry_id,
  is_active
FROM users
WHERE id = auth.uid();

-- 3. Recriar política de INSERT
-- =====================================================

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role IN ('superadmin', 'admin')
    )
  );

-- 4. Recriar política de UPDATE
-- =====================================================

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

-- 5. Recriar política de DELETE
-- =====================================================

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    -- Apenas superadmin pode deletar
    EXISTS (
      SELECT 1 FROM current_user_info
      WHERE role = 'superadmin'
    )
    -- E o usuário alvo NÃO pode ser superadmin (proteção extra)
    AND role != 'superadmin'
  );

-- 6. Recriar política de user_ministries
-- =====================================================

CREATE POLICY "user_ministries_manage" ON user_ministries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM current_user_info
            WHERE role IN ('admin', 'superadmin')
        )
    );

-- =====================================================
-- Teste se funcionou:
-- =====================================================
-- SELECT * FROM current_user_info;
-- Deve retornar seus dados com role = 'superadmin'
