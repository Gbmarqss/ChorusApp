-- =====================================================
-- Migration: Suporte a Múltiplos Ministérios por Usuário
-- =====================================================
-- Descrição: Cria tabela N:M entre users e ministries
-- Autor: Antigravity
-- Data: 2026-02-04
-- =====================================================

-- 1. Criar tabela de junção
-- =====================================================

CREATE TABLE IF NOT EXISTS user_ministries (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, ministry_id)
);

-- 2. Migrar dados existentes
-- =====================================================

INSERT INTO user_ministries (user_id, ministry_id)
SELECT id, ministry_id
FROM users
WHERE ministry_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Habilitar RLS
-- =====================================================

ALTER TABLE user_ministries ENABLE ROW LEVEL SECURITY;

-- 4. Definir Políticas de Acesso
-- =====================================================

-- SELECT: Visível para todos autenticados
DROP POLICY IF EXISTS "user_ministries_select" ON user_ministries;
CREATE POLICY "user_ministries_select" ON user_ministries
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: Apenas Admins e Superadmins
-- (Baseado na tabela current_user_info definida no 001)

DROP POLICY IF EXISTS "user_ministries_manage" ON user_ministries;
CREATE POLICY "user_ministries_manage" ON user_ministries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM current_user_info
            WHERE role IN ('admin', 'superadmin')
        )
    );

-- Nota: Não removemos a coluna ministry_id da tabela users
-- para manter compatibilidade temporária se necessário,
-- mas o frontend passará a usar essa nova tabela.
