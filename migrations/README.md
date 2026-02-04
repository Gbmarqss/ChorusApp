# 🗄️ Guia de Migration - Sistema de Código de Ativação

## 📋 Visão Geral

Esta migration adiciona o sistema de ativação por código único ao ChorusApp, permitindo que apenas administradores criem usuários e que novos usuários ativem suas contas usando um código gerado automaticamente.

---

## 📦 Arquivos Criados

```
migrations/
├── 001_activation_code_system.sql  # Migration principal
├── 001_rollback.sql                # Script de reversão
└── 001_tests.sql                   # Testes e validação
```

---

## 🚀 Como Executar

### 1. **Acessar o Supabase SQL Editor**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **ChorusApp**
3. Vá em **SQL Editor** (menu lateral)

### 2. **Executar a Migration**

1. Abra o arquivo `001_activation_code_system.sql`
2. Copie **todo o conteúdo**
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou `Ctrl+Enter`)

✅ **Sucesso**: Você verá "Success. No rows returned" ou similar

❌ **Erro**: Se houver erro, leia a mensagem e verifique se:
   - A tabela `users` existe
   - Você tem permissões de admin no Supabase

### 3. **Verificar se Funcionou**

Execute o script de testes:

```sql
-- Testar geração de código
SELECT generate_activation_code();
```

Deve retornar algo como: `CHORUS-84721`

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('activation_code', 'is_active', 'code_used_at');
```

Deve mostrar as 3 novas colunas.

---

## 📊 O Que Foi Alterado

### ✨ Novas Colunas na Tabela `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `activation_code` | TEXT | Código único (CHORUS-XXXXX) |
| `is_active` | BOOLEAN | Se a conta foi ativada |
| `code_used_at` | TIMESTAMP | Quando o código foi usado |

### 🔧 Novas Funções

#### `generate_activation_code()`
Gera código único no formato `CHORUS-12345`

**Uso:**
```sql
SELECT generate_activation_code();
-- Retorna: CHORUS-84721
```

#### `activate_user_account(email, code)`
Valida código e ativa conta

**Uso:**
```sql
SELECT activate_user_account('user@example.com', 'CHORUS-12345');
-- Retorna: {"success": true, "user_id": "uuid..."}
```

### 🔒 Políticas RLS Atualizadas

1. **Superadmin** - Acesso total a todos os usuários
2. **Admin** - Acesso apenas ao próprio ministério
3. **User** - Acesso apenas ao próprio perfil
4. **Public** - Leitura para validação de código (sem dados sensíveis)

---

## 🧪 Testes Recomendados

Execute o arquivo `001_tests.sql` completo para validar:

1. ✅ Geração de código único
2. ✅ Criação de usuário com código
3. ✅ Ativação de conta
4. ✅ Verificação de códigos duplicados
5. ✅ Estatísticas do sistema

---

## ⚠️ Importante

### Usuários Existentes

Todos os usuários existentes foram **automaticamente marcados como ativos** (`is_active = TRUE`) para não quebrar o sistema atual.

### Segurança

- ✅ Códigos são únicos (constraint + index)
- ✅ Código só pode ser usado uma vez
- ✅ Validação server-side via função SQL
- ✅ RLS protege dados sensíveis

---

## 🔄 Como Reverter (Rollback)

Se precisar desfazer as mudanças:

1. Abra `001_rollback.sql`
2. Execute no SQL Editor
3. Isso removerá:
   - Colunas adicionadas
   - Funções criadas
   - Índices criados
   - Políticas RLS

⚠️ **ATENÇÃO**: Isso apagará todos os códigos de ativação existentes!

---

## 📝 Próximos Passos

Após executar a migration com sucesso:

1. ✅ Testar geração de código
2. ✅ Criar um usuário de teste
3. ✅ Testar ativação
4. 🚀 Implementar interface (componentes React)

---

## 🆘 Troubleshooting

### Erro: "relation users does not exist"
**Solução**: Verifique se a tabela `users` existe. Pode ser que você precise criar a estrutura base primeiro.

### Erro: "permission denied"
**Solução**: Certifique-se de estar logado como admin no Supabase.

### Código duplicado gerado
**Solução**: Isso não deve acontecer (função tem loop). Se acontecer, execute:
```sql
SELECT activation_code, COUNT(*) 
FROM users 
GROUP BY activation_code 
HAVING COUNT(*) > 1;
```

---

## 📞 Suporte

Se encontrar problemas, verifique:
- Logs do Supabase (aba Logs)
- Políticas RLS (aba Authentication → Policies)
- Estrutura da tabela (aba Table Editor)

---

**Criado em**: 2026-02-03  
**Versão**: 1.0.0  
**Autor**: ChorusApp Team
