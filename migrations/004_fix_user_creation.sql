-- =====================================================
-- Migration: Fix User Creation Flow
-- =====================================================
-- Permite criar usuários pendentes usando UUID temporário
-- e adiciona constraint correto para roles
-- =====================================================

-- 1. Remover constraint de FK se existir (para permitir IDs temporários)
-- =====================================================

-- Primeiro, verificar e remover FK constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_id_fkey;
    END IF;
END $$;

-- 2. Adicionar ou atualizar constraint de roles
-- =====================================================

-- Remove constraint antigo se existir
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adiciona novo constraint com todas as roles válidas
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('superadmin', 'admin', 'leader', 'member'));

-- 3. Comentários
-- =====================================================

COMMENT ON COLUMN users.id IS 'UUID - pode ser temporário para usuários pendentes, será substituído pelo auth.uid() na ativação';
COMMENT ON CONSTRAINT users_role_check ON users IS 'Roles válidas: superadmin, admin, leader, member';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
