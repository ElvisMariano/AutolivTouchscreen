# Guia: Criar Azure SQL Server do Zero

## Pré-requisitos

Você precisa de uma **Azure subscription ativa**. Se não tiver, crie uma conta gratuita em: https://azure.microsoft.com/free/

## Opção 1: Via Azure Portal (Recomendado - Mais Visual)

### 1. Acessar Portal Azure
1. Acesse https://portal.azure.com
2. Faça login com sua conta

### 2. Criar Resource Group
1. No menu, clique em **Resource groups**
2. Clique em **+ Create**
3. Preencha:
   - **Subscription**: Selecione sua subscription
   - **Resource group**: `autoliv-touchscreen-rg`
   - **Region**: `Brazil South` (ou a mais próxima)
4. **Review + create** → **Create**

### 3. Criar SQL Server
1. No menu, pesquise por **SQL servers**
2. Clique em **+ Create**
3. Preencha:
   - **Subscription**: Sua subscription
   - **Resource group**: `autoliv-touchscreen-rg`
   - **Server name**: `autoliv-touchscreen-sql` (deve ser único globalmente)
   - **Location**: `Brazil South`
   - **Authentication method**: **Use SQL authentication**
   - **Server admin login**: `sqladmin`
   - **Password**: (escolha uma senha forte, ex: `AutolivDB@2024!`)
   - **Confirm password**: (repita a senha)
4. **Next: Networking**
   - **Allow Azure services and resources to access this server**: ✅ Yes
   - **Add current client IP address**: ✅ Yes
5. **Review + create** → **Create**

### 4. Criar Database
1. Após criar o servidor, vá para ele
2. Clique em **+ Create database**
3. Preencha:
   - **Database name**: `autoliv-touchscreen-db`
   - **Compute + storage**: Clique em **Configure database**
     - Escolha **Basic** (mais barato) ou **General Purpose** (melhor performance)
     - Clique **Apply**
4. **Review + create** → **Create**

### 5. Configurar Firewall (Se necessário)
1. Vá para o SQL Server
2. **Security** → **Networking**
3. **Firewall rules** → **+ Add client IP**
4. Clique **Save**

### 6. Obter Connection String
1. Vá para o **Database** (não o servidor)
2. **Settings** → **Connection strings**
3. Copie a **ADO.NET** connection string
4. Ela será algo assim:
```
Server=tcp:autoliv-touchscreen-sql.database.windows.net,1433;Initial Catalog=autoliv-touchscreen-db;Persist Security Info=False;User ID=sqladmin;Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

---

## Opção 2: Via Azure CLI (Mais Rápido)

Vou executar os comandos para você! Mas primeiro preciso que você:

1. **Faça az login** com uma conta que tenha subscription Azure
2. **Me avise** quando o login estiver completo

---

## Informações que Você Precisará Definir

- **Nome do SQL Server**: `autoliv-touchscreen-sql` (ou outro nome único)
- **Admin Username**: `sqladmin`
- **Admin Password**: (escolha uma senha forte)
- **Database Name**: `autoliv-touchscreen-db`
- **Location**: `brazilsouth` (Brasil)

---

## Após Criar

Você terá:
- ✅ SQL Server criado
- ✅ Database criado
- ✅ Usuário admin SQL com senha
- ✅ Connection string pronta
- ✅ Firewall configurado

Atualizaremos o `backend/.env` com as novas credenciais e testaremos a conexão!

---

## Você Prefere:

**A) Criar via Azure Portal** (recomendado se for sua primeira vez)
**B) Eu criar via Azure CLI** (mais rápido, mas precisa de az login funcionando)

Me diga qual opção você quer!
