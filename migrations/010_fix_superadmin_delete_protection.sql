-- =====================================================
-- Migration: Proteger Superadmin de Deleção
-- =====================================================
-- Descrição: Apenas superadmin pode deletar usuários
--            Ninguém pode deletar superadmins (nem outro super)
-- Autor: Antigravity
-- Data: 2026-02-04
-- =====================================================

-- Remover política antiga de DELETE
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Criar nova política de DELETE
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

-- =====================================================
-- Regras de Negócio:
-- =====================================================
-- 1. Apenas SUPERADMIN pode deletar usuários
-- 2. SUPERADMIN NÃO pode deletar outros superadmins (proteção)
-- 3. ADMIN não pode deletar ninguém
-- =====================================================
