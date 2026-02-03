-- Adicionar política RLS para permitir UPDATE em schedules
-- Execute este script se as edições em escalas publicadas não estiverem salvando

-- 1. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'schedules';

-- 2. Remover política antiga se existir (caso precise recriar)
DROP POLICY IF EXISTS "Permitir atualização para admins e líderes" ON schedules;

-- 3. Adicionar política de UPDATE para admins e líderes
CREATE POLICY "Permitir atualização para admins e líderes"
ON schedules FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('admin', 'leader')
  )
);

-- 4. Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'schedules' AND policyname LIKE '%atualização%';
