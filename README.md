# ChorusApp 🎵

**Sistema profissional de gerenciamento de escalas para igrejas**

ChorusApp é uma aplicação web moderna e completa para criar, gerenciar e publicar escalas de voluntários em ministérios de louvor e outras áreas da igreja.

## ✨ Funcionalidades

### 🔐 Autenticação e Permissões
- Sistema de login seguro com Supabase Auth
- 3 níveis de permissão: **Admin**, **Líder** e **Visualizador**
- Convites controlados por email (whitelist)
- Gestão completa de usuários

### 📊 Criação Inteligente de Escalas
- **Wizard de 3 Passos**: Configuração → Upload → Revisão
- Importação de planilhas Excel (.xlsx)
- Geração automática de escalas com base em disponibilidade
- **Sugestões Inteligentes**: Mostra voluntários que marcaram disponibilidade
- Entrada flexível: Selecione da lista OU digite nomes customizados

### ✏️ Edição Avançada
- **Editor de Rascunhos**: Edite antes de publicar
- **Editor de Publicadas**: Edite escalas já publicadas em tempo real
- **Rastreamento de Substituições**: Sistema visual para indicar trocas
- Salvamento automático e instantâneo

### 👥 Gestão de Ministérios
- Cadastro de ministérios personalizados
- Vinculação de líderes a ministérios
- Aprovação por ministério antes da publicação

### 🌐 Visualização Pública
- Link público compartilhável (sem necessidade de login)
- Design premium com modo escuro
- Layout responsivo (mobile-first)
- Indicadores visuais de substituições
- Botão de compartilhamento com feedback

### 📱 Interface Moderna
- Design SaaS premium com glassmorphism
- Totalmente responsivo (desktop, tablet, mobile)
- Animações suaves e micro-interações
- Modo escuro nativo
- Feedback visual em todas as ações

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Ícones**: Lucide React
- **Roteamento**: React Router v6

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/Gbmarqss/ChorusApp.git
cd ChorusApp
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. **Configure o banco de dados**

Execute os scripts SQL na ordem (via Supabase SQL Editor):

```bash
# 1. Schema principal
create_schema.sql

# 2. Triggers
setup_triggers.sql

# 3. RLS Policies
fix_users_rls.sql

# 4. Convites
create_invite_links.sql
create_allowed_emails.sql

# 5. Availability (novo)
add_availability_to_pre_schedules.sql
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 📖 Como Usar

### 1. Primeiro Acesso (Admin)
- Crie o primeiro usuário admin manualmente no Supabase
- Faça login na aplicação

### 2. Convidar Usuários
- Vá em **Equipe** → **Convidar Membro**
- Digite email, nome, ministério e role
- Compartilhe o link de convite gerado

### 3. Criar Escala
1. Clique em **Nova Escala**
2. Configure nome e período
3. Faça upload da planilha Excel
4. Revise e crie o rascunho

### 4. Editar e Aprovar
- Líderes podem editar e aprovar seus ministérios
- Admin pode editar tudo
- Quando 100% aprovado, admin pode **Publicar**

### 5. Compartilhar
- Após publicar, copie o link público
- Compartilhe com a equipe
- Todos podem visualizar sem login

## 🗂️ Estrutura do Projeto

```
ChorusApp/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── ConfirmModal.jsx
│   │   ├── Layout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Toast.jsx
│   ├── contexts/        # Context API
│   │   └── AuthContext.jsx
│   ├── pages/           # Páginas principais
│   │   ├── EditPublishedSchedule.jsx
│   │   ├── Login.jsx
│   │   ├── Ministries.jsx
│   │   ├── PreScaleEditor.jsx
│   │   ├── PublicScheduleView.jsx
│   │   ├── Register.jsx
│   │   ├── ScaleWizard.jsx
│   │   └── Users.jsx
│   ├── App.jsx          # Rotas principais
│   ├── Home.jsx         # Dashboard
│   ├── logic.js         # Lógica de geração de escalas
│   └── supabaseClient.js
├── .env                 # Variáveis de ambiente (não commitado)
└── package.json
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verifica código com ESLint
```

## 🐛 Problemas Conhecidos

### Edição de Escalas Publicadas
Se as edições não estiverem salvando, verifique as políticas RLS no Supabase:

```sql
-- Permitir UPDATE em schedules para admins/líderes
CREATE POLICY "Allow update for admins and leaders"
ON schedules FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('admin', 'leader')
  )
);
```

## 📝 Changelog

### v1.1.0 (2026-02-02)
- ✅ **Login Fix**: Corrigido bug de duplo login
- ✅ **Sugestões Inteligentes**: Editor mostra voluntários disponíveis
- ✅ **Entrada Manual Melhorada**: Campo de texto aparece corretamente
- ✅ **Crashes Corrigidos**: PreScaleEditor e EditPublishedSchedule
- ✅ **UI Refinements**: Imports corrigidos, feedback visual melhorado

### v1.0.0 (2026-01-29)
- 🎉 Lançamento inicial
- Sistema completo de autenticação
- Criação e edição de escalas
- Aprovação por ministério
- Visualização pública

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Gabriel Marques**
- GitHub: [@Gbmarqss](https://github.com/Gbmarqss)
- Email: gabrielscm2005@gmail.com

---

Feito com ❤️ para comunidades de fé
