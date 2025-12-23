# Troubleshooting: Conexão com Azure SQL Database

## Problema: "❌ Erro ao conectar com Azure SQL"

### Causa

A connection string usa `Authentication="Active Directory Default"`, que requer autenticação do Azure CLI ou Visual Studio. Se você não estiver logado no Azure CLI, a conexão falhará.

### Soluções

#### Opção 1: Fazer login no Azure CLI (Recomendado para desenvolvimento)

```bash
az login
```

Isso abrirá o navegador para fazer login. Após loginado, o backend conseguirá conectar.

**Depois de logar:**
```bash
cd backend
npm start
```

#### Opção 2: Usar SQL Authentication (Mais simples)

1. **Criar um usuário SQL no Azure Portal:**
   - Vá para o SQL Database no Azure Portal
   - Settings → Query editor
   - Execute:
   ```sql
   CREATE LOGIN seu_usuario WITH PASSWORD = 'SuaSenhaForte123!';
   USE [digitals-documents];
   CREATE USER seu_usuario FOR LOGIN seu_usuario;
   ALTER ROLE db_owner ADD MEMBER seu_usuario;
   ```

2. **Atualizar `.env`:**
   ```env
   # Comentar Active Directory
   # AZURE_SQL_AUTH_TYPE=azure-active-directory-default

   # Adicionar SQL Auth
   AZURE_SQL_USER=seu_usuario
   AZURE_SQL_PASSWORD=SuaSenhaForte123!
   ```

3. **Reiniciar backend:**
   ```bash
   cd backend
   npm start
   ```

#### Opção 3: Obter credenciais do Admin SQL

Se você configurou o SQL Server com um admin SQL:
1. Portal Azure → SQL Server → Settings → Properties
2. Copiar Server admin login
3. Usar essa senha que você definiu na criação

## Verificar Conexão

Após configurar a autenticação, teste:

```bash
curl http://localhost:3001/api/test-db
```

Deve retornar:
```json
{
  "status": "connected",
  "database": "digitals-documents",
  "server": "digitals-documents.database.windows.net"
}
```

## Executar Migration

Depois que a conexão funcionar, execute a migration SQL:

### Via Azure Portal:
1. Portal Azure → SQL Database → Query editor
2. Cole o conteúdo de `backend/migrations/001_initial_schema.sql`
3. Execute

### Via Azure Data Studio ou SSMS:
1. Conecte no servidor: `digitals-documents.database.windows.net`
2. Abra `backend/migrations/001_initial_schema.sql`
3. Execute

## Status Atual

- ✅ Backend criado e configurado
- ✅ Schema SQL pronto
- ⚠️ Aguardando conexão com Azure SQL
- ⏳ Próximo: Executar migration

## Próxima Task

Após resolver a conexão e executar a migration, implementaremos:
- Service e Controller para Plants
- Endpoint GET /api/plants
- Teste do frontend
