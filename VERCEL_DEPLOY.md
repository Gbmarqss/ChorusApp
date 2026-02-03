# 🚀 Guia de Deploy na Vercel

## Problema: "Cannot read properties of null (reading 'auth')"

Este erro acontece porque as **variáveis de ambiente** do Supabase não estão configuradas na Vercel.

## ✅ Solução: Configurar Environment Variables

### 1. Acesse o Dashboard da Vercel
- Vá para: https://vercel.com/dashboard
- Selecione seu projeto **ChorusApp**

### 2. Configure as Variáveis de Ambiente

1. Clique em **Settings** (Configurações)
2. No menu lateral, clique em **Environment Variables**
3. Adicione as seguintes variáveis:

#### Variável 1: VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://cmpeyxcrmblqvwoavbun.supabase.co` (sua URL do Supabase)
- **Environment**: Marque todos (Production, Preview, Development)

#### Variável 2: VITE_SUPABASE_ANON_KEY
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Sua chave anônima do Supabase (encontre em: Supabase → Settings → API)
- **Environment**: Marque todos (Production, Preview, Development)

### 3. Redeploy

Após adicionar as variáveis:

1. Vá para a aba **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**
4. Aguarde o build completar

## 📋 Onde encontrar as credenciais do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env` no Git
- As variáveis devem começar com `VITE_` para funcionar no Vite
- Após adicionar variáveis, sempre faça **Redeploy**

## 🔍 Verificar se funcionou

Após o redeploy, acesse seu site e:
1. Abra o Console do navegador (F12)
2. Se não houver erros de "null auth", está funcionando! ✅
3. Tente fazer login para confirmar

## 🆘 Se ainda não funcionar

Verifique se:
- [ ] As variáveis estão com os nomes EXATOS (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
- [ ] Você marcou todos os ambientes (Production, Preview, Development)
- [ ] Você fez **Redeploy** após adicionar as variáveis
- [ ] As credenciais do Supabase estão corretas

---

**Dica**: Você pode testar localmente com `npm run build && npm run preview` para simular produção.
