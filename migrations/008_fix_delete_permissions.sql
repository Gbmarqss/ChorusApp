-- =====================================================
-- Migration: Fix Delete Permissions
-- =====================================================
-- Ajusta políticas para permitir que Admins deletem usuários,
-- MAS impede que qualquer um (inclusive SuperAdmins) delete um SuperAdmin
-- =====================================================

-- 1. Recriar View de informações do usuário atual (para garantir consistência)
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

-- 2. Atualizar Política de DELETE
-- =====================================================

DROP POLICY IF EXISTS "users_delete_policy" ON users;

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    -- REGRA 1: O ALVO da deleção NUNCA pode ser um SuperAdmin
    role != 'superadmin'
    AND
    (
      -- REGRA 2: Quem está deletando deve ser SuperAdmin
      EXISTS (
        SELECT 1 FROM current_user_info
        WHERE role = 'superadmin'
      )
      OR
      -- REGRA 3: OU quem está deletando é Admin (e deletando alguém que não é admin)
      (
        EXISTS (
          SELECT 1 FROM current_user_info
          WHERE role = 'admin'
        )
        AND
        role != 'admin' -- Admin não deleta outro Admin (opcional, remova se quiser liberar)
      )
    )
  );

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
