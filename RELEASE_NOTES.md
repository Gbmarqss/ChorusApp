# Release Notes - v1.1.0 🎉

**Data de Lançamento**: 02 de Fevereiro de 2026

## 🐛 Correções de Bugs

### Login Duplo Resolvido
- **Problema**: Usuários precisavam fazer login duas vezes para acessar o sistema
- **Causa**: Race condition entre autenticação e carregamento do perfil
- **Solução**: `AuthContext.jsx` agora aguarda o carregamento completo do perfil antes de redirecionar
- **Impacto**: Login funciona perfeitamente na primeira tentativa ✅

### Crashes no Editor Corrigidos
- **PreScaleEditor.jsx**: Corrigido erro `Cannot read properties of undefined (reading 'value')`
- **EditPublishedSchedule.jsx**: Mesmo erro corrigido
- **Home.jsx**: Adicionado import faltante `Edit2` do lucide-react
- **Impacto**: Editores agora funcionam sem crashes ✅

## ✨ Novas Funcionalidades

### Sugestões Inteligentes de Voluntários
- **Feature**: Editor agora mostra grupo "📋 Sugestões (Disponíveis)"
- **Como funciona**: 
  - Ao importar planilha Excel, o sistema salva quem marcou disponibilidade
  - No editor, essas pessoas aparecem como sugestões por data/ministério
  - Facilita muito a designação de voluntários!
- **Arquivos modificados**:
  - `add_availability_to_pre_schedules.sql` (nova coluna no banco)
  - `ScaleWizard.jsx` (salva dados de disponibilidade)
  - `PreScaleEditor.jsx` (exibe sugestões)

### Entrada Manual Melhorada
- **Problema**: Campo de texto não aparecia ao selecionar "✎ Digitar outro nome..."
- **Solução**: Implementado gerenciamento de estado adequado com `manualEntryMode`
- **Novos recursos**:
  - Campo aparece imediatamente ao selecionar a opção
  - Pressione **Enter** para salvar
  - Pressione **Esc** para cancelar
  - Clique fora para salvar automaticamente

## 🔧 Melhorias Técnicas

### Banco de Dados
- Nova coluna `availability` (JSONB) em `pre_schedules`
- Armazena mapa de voluntários disponíveis por data/área
- Permite sugestões inteligentes no editor

### Código
- Refatoração do sistema de entrada manual
- Melhor gerenciamento de estado nos editores
- Código mais limpo e manutenível

## ⚠️ Ação Necessária

### Migração do Banco de Dados
Execute no Supabase SQL Editor:

```sql
ALTER TABLE pre_schedules 
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;
```

### Possível Problema com Edição de Publicadas
Se edições em escalas publicadas não estiverem salvando, adicione esta política RLS:

```sql
CREATE POLICY "Allow update for admins and leaders"
ON schedules FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('admin', 'leader')
  )
);
```

## 📊 Estatísticas

- **Arquivos modificados**: 8
- **Bugs corrigidos**: 4
- **Novas features**: 2
- **Linhas de código adicionadas**: ~150
- **Linhas de código removidas**: ~80

## 🙏 Agradecimentos

Obrigado por usar o ChorusApp! Esta release traz melhorias significativas na estabilidade e usabilidade do sistema.

Para reportar bugs ou sugerir melhorias, abra uma issue no GitHub.

---

**Próximos Passos (v1.2.0)**:
- [ ] Notificações em tempo real
- [ ] Exportação para PDF melhorada
- [ ] Histórico de alterações
- [ ] Dashboard com estatísticas
