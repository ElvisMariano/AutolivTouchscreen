# Migrations Archive

Esta pasta contém os scripts de migração SQL e scripts de seed/migração Node.js que já foram aplicados ao banco de dados do sistema AutolivTouchScreen.

## ⚠️ Importante

**Todos os scripts nesta pasta já foram executados no banco de dados de produção.** Eles estão arquivados aqui apenas para referência histórica e documentação.

## 📋 Migrações SQL

### Schema e Estrutura

- **`migration_add_external_id_to_lines.sql`**
  - Adiciona coluna `external_id` à tabela `lines` para integração com sistemas externos

- **`migration_add_l2l_external_ids.sql`**
  - Adiciona campos de identificadores externos L2L (Line-to-Line) em múltiplas tabelas

- **`migration_add_settings_to_users.sql`**
  - Adiciona campo `settings` (JSONB) à tabela `users` para preferências do usuário

- **`migration_fix_users_schema.sql`**
  - Correções no schema da tabela `users`

### Funcionalidades

- **`migration_custom_shifts.sql`**
  - Implementa suporte a turnos customizados

- **`migration_shifts_acknowledgments.sql`**
  - Adiciona sistema de confirmação de leitura por turno

### Constraints e Relacionamentos

- **`migration_drop_ack_constraint.sql`**
  - Remove constraint antigo de acknowledgments

- **`migration_fix_ack_foreign_keys.sql`**
  - Corrige foreign keys da tabela `document_acknowledgments`

### Procedures

- **`migration_updated_user_rpcs.sql`**
  - Atualiza stored procedures e funções RPC relacionadas a usuários

## 🛠️ Scripts Node.js

### Scripts de Migração

- **`apply_migration_003.js`**
  - Aplica migração específica versão 003

- **`runMigration.js`**
  - Script genérico para executar migrações

- **`runMigration002.js`**
  - Aplica migração específica versão 002

### Scripts de Seed

- **`seedAuthData.js`**
  - Popula dados iniciais de autenticação (roles, permissions, usuários padrão)
  - **Executar:** `node seedAuthData.js` (do diretório onde o arquivo está)

## 🚀 Como Executar (Se Necessário)

### Migrações SQL

```bash
# Conectar ao banco e executar o SQL
psql -U usuario -d autoliv_db -f migration_nome.sql
```

### Scripts Node.js

```bash
# Do diretório docs/migrations/
node seedAuthData.js
```

## 📝 Histórico de Aplicação

Estas migrações foram aplicadas progressivamente durante o desenvolvimento do sistema entre 2024-2025.

---

*Arquivado em: 22/12/2024*
