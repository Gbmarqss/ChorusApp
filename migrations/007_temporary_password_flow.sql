-- =====================================================
-- Migration: Temporary Password Flow
-- =====================================================
-- Adiciona campos para senha temporária e troca obrigatória
-- Substitui sistema de código de ativação
-- =====================================================

-- 1. Adicionar novos campos
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- 2. Criar índice
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_must_change_password 
ON users(must_change_password) 
WHERE must_change_password = TRUE;

-- 3. Marcar usuários existentes como não precisando trocar senha
-- =====================================================

UPDATE users 
SET must_change_password = FALSE 
WHERE must_change_password IS NULL;

-- 4. Comentários
-- =====================================================

COMMENT ON COLUMN users.must_change_password IS 'Indica se usuário precisa trocar senha no próximo login (senha temporária)';
COMMENT ON COLUMN users.password_changed_at IS 'Data/hora da última troca de senha';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
