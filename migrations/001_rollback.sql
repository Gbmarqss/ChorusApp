-- =====================================================
-- Script: Rollback da Migration de Código de Ativação
-- =====================================================
-- Use este script caso precise reverter as mudanças
-- =====================================================

-- 1. Remover políticas RLS criadas
-- =====================================================

DROP POLICY IF EXISTS "Superadmin full access" ON users;
DROP POLICY IF EXISTS "Admin ministry access" ON users;
DROP POLICY IF EXISTS "User own profile" ON users;
DROP POLICY IF EXISTS "User update own profile" ON users;
DROP POLICY IF EXISTS "Public read for activation" ON users;

-- 2. Remover funções criadas
-- =====================================================

DROP FUNCTION IF EXISTS activate_user_account(TEXT, TEXT);
DROP FUNCTION IF EXISTS generate_activation_code();

-- 3. Remover índices criados
-- =====================================================

DROP INDEX IF EXISTS idx_activation_code;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_ministry;

-- 4. Remover colunas adicionadas
-- =====================================================

ALTER TABLE users 
DROP COLUMN IF EXISTS activation_code,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS code_used_at;

-- =====================================================
-- FIM DO ROLLBACK
-- =====================================================
