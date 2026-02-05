-- =====================================================
-- Migration: Auto-Confirm Email on Activation
-- =====================================================
-- Cria trigger para confirmar email automaticamente
-- quando usuário é criado no auth.users
-- =====================================================

-- Função para confirmar email automaticamente
CREATE OR REPLACE FUNCTION auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Confirma email automaticamente para novos usuários
  NEW.email_confirmed_at := NOW();
  NEW.confirmed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user_email();

COMMENT ON FUNCTION auto_confirm_user_email() IS 'Confirma email automaticamente quando usuário é criado';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
