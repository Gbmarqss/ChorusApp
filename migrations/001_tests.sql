-- =====================================================
-- Script de Teste: Sistema de Código de Ativação
-- =====================================================
-- Execute este script para testar as funções criadas
-- =====================================================

-- 1. Testar geração de código
-- =====================================================

SELECT generate_activation_code() AS codigo_gerado;
-- Deve retornar algo como: CHORUS-12345

-- 2. Testar criação de usuário com código
-- =====================================================

-- Exemplo de inserção de novo usuário (simulando criação por admin)
-- NOTA: Substitua os valores conforme necessário

/*
INSERT INTO users (
  id,
  email,
  name,
  role,
  ministry_id,
  activation_code,
  is_active
) VALUES (
  gen_random_uuid(), -- ou use um UUID específico
  'teste@chorusapp.com',
  'Usuário Teste',
  'member',
  (SELECT id FROM ministries LIMIT 1), -- Pega primeiro ministério
  generate_activation_code(),
  FALSE
);
*/

-- 3. Ver usuários com código pendente
-- =====================================================

SELECT 
  name,
  email,
  activation_code,
  is_active,
  code_used_at,
  created_at
FROM users
WHERE is_active = FALSE
ORDER BY created_at DESC;

-- 4. Testar ativação de conta
-- =====================================================

-- Substitua pelos valores reais
/*
SELECT activate_user_account(
  'teste@chorusapp.com',  -- email
  'CHORUS-12345'           -- código
);
*/

-- Deve retornar:
-- {"success": true, "user_id": "uuid-aqui"}
-- ou
-- {"success": false, "error": "Código inválido ou já utilizado"}

-- 5. Verificar usuários ativos
-- =====================================================

SELECT 
  name,
  email,
  role,
  is_active,
  code_used_at
FROM users
WHERE is_active = TRUE
ORDER BY name;

-- 6. Estatísticas do sistema
-- =====================================================

SELECT 
  COUNT(*) FILTER (WHERE is_active = TRUE) AS usuarios_ativos,
  COUNT(*) FILTER (WHERE is_active = FALSE) AS usuarios_pendentes,
  COUNT(*) FILTER (WHERE activation_code IS NOT NULL AND code_used_at IS NULL) AS codigos_disponiveis,
  COUNT(*) FILTER (WHERE code_used_at IS NOT NULL) AS codigos_utilizados,
  COUNT(*) AS total_usuarios
FROM users;

-- 7. Verificar códigos duplicados (não deve retornar nada)
-- =====================================================

SELECT activation_code, COUNT(*) 
FROM users 
WHERE activation_code IS NOT NULL
GROUP BY activation_code 
HAVING COUNT(*) > 1;

-- 8. Testar regeneração de código para usuário específico
-- =====================================================

/*
UPDATE users 
SET activation_code = generate_activation_code(),
    code_used_at = NULL
WHERE email = 'teste@chorusapp.com'
RETURNING email, activation_code;
*/

-- =====================================================
-- FIM DOS TESTES
-- =====================================================
