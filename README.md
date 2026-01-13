# Autoliv Touch Screen (Web Application)

Aplicação web desenvolvida para gerenciamento de instruções de trabalho, alertas de qualidade e visualização de documentos no chão de fábrica da Autoliv.

## 🚀 Tecnologias

### Frontend
- **React 19+** com TypeScript
- **Vite** (build tool e dev server)
- **TanStack Query** (gerenciamento de estado assíncrono)
- **React Router DOM** (roteamento SPA)
- **Axios** (cliente HTTP)
- **Azure MSAL** (autenticação Microsoft)
- **Framer Motion** (animações)
- **Heroicons** (ícones)

### Backend
- **Node.js 20.x** + Express
- **Azure SQL Server** (banco de dados principal)
- **JWT** (autenticação e autorização)
- **Integração com API Leading2Lean (L2L)**
- **CORS** habilitado para desenvolvimento local

### Infraestrutura
- **Azure Static Web Apps** (frontend)
- **Azure Web Apps** (backend API)
- **Azure SQL Database**

## 📁 Estrutura do Projeto

O projeto é dividido em duas partes principais:

```
AutolivTouchScreen/
├── src/                    # Frontend - Aplicação React
├── backend/               # Backend - API REST Node.js/Express
│   ├── src/              # Código fonte do backend
│   └── .env              # Variáveis de ambiente do backend
├── docs/                 # Documentações técnicas
├── public/               # Assets estáticos
├── .env                  # Variáveis de ambiente do frontend
├── package.json          # Dependências do frontend
└── backend/package.json  # Dependências do backend
```

## ✨ Funcionalidades Principais

### 🔒 Autenticação e Segurança
- **Sistema de Login Próprio:** Autenticação via Azure AD com MSAL
- **Controle de Acesso Granular (RBAC):** Sistema robusto de Roles (Perfis) e Permissões
- **Auditoria:** Logs detalhados de todas as ações críticas (criação/edição/exclusão de roles, usuários, documentos, etc.)

### 🏭 Gestão de Fábrica
- **Estrutura Hierárquica:** Gerenciamento de Plantas, Linhas de Produção e Estações de Trabalho
- **Painel Administrativo Completo:** Interface dedicada para configuração de todo o sistema

### 📄 Gestão de Documentos
- **Instruções de Trabalho:** Visualização de PDFs vinculados a estações específicas
- **Alertas de Qualidade:** Sistema de alertas com níveis de severidade (A, B, C) e expiração automática
- **Critérios de Aceitação & Trabalho Padronizado:** Módulos dedicados para documentação de processos
- **Integração PowerBI:** Visualização de relatórios embutidos
- **Validação:** Bloqueio de cadastro de documentos caso nenhuma linha de produção esteja selecionada, garantindo integridade dos dados

### 👤 Gestão de Usuários e Roles
- **CRUD de Usuários:** Cadastro completo com vinculação a roles e plantas
- **Editor de Roles:** Interface visual para criar perfis de acesso personalizados, selecionando permissões específicas (ex: `view:dashboard`, `admin:manage_users`)

### ⚙️ Configurações do Sistema
- **i18n:** Suporte a múltiplos idiomas (Português, Inglês, Espanhol)
- **Temas:** Modo Claro e Escuro
- **Personalização:** Configuração de timeouts, sons e comportamento de quiosque

## 🛠️ Como Rodar Localmente

### Pré-requisitos

- **Node.js 20.x** ou superior
- **npm** (geralmente vem com Node.js)
- **Acesso ao Azure SQL Server** (ou SQL Server local)
- **Credenciais da API Leading2Lean**
- **Credenciais do Azure AD** (para autenticação MSAL)

### 1. Clone o Repositório

```bash
git clone https://github.com/ElvisMariano/AutolivTouchscreen.git
cd AutolivTouchscreen
```

### 2. Configuração do Backend

#### 2.1 Instale as Dependências do Backend

```bash
cd backend
npm install
```

#### 2.2 Configure o `.env` do Backend

Crie ou edite o arquivo `backend/.env` com as seguintes variáveis:

```env
# Azure SQL Server
AZURE_SQL_SERVER=seu-servidor.database.windows.net
AZURE_SQL_DATABASE=nome-do-banco
AZURE_SQL_USER=usuario
AZURE_SQL_PASSWORD=senha
AZURE_SQL_ENCRYPT=true

# Leading2Lean API
L2L_API_BASE_URL=https://autoliv-mx.leading2lean.com/api/1.0
L2L_API_KEY=sua-chave-api-l2l

# JWT Secret (gere uma chave segura para produção)
JWT_SECRET=sua-chave-secreta-jwt

# Server Config
PORT=3001
NODE_ENV=development

# CORS (permitir frontend local)
CORS_ORIGIN=http://localhost:5173

# Azure AD Authentication
AZURE_AD_TENANT_ID=seu-tenant-id
AZURE_AD_CLIENT_ID=seu-client-id

# Autenticação (false = desabilitada para dev)
AUTH_ENABLED=false
```

#### 2.3 Execute o Backend

```bash
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 3. Configuração do Frontend

#### 3.1 Instale as Dependências do Frontend

Volte para o diretório raiz e instale as dependências:

```bash
cd ..
npm install
```

#### 3.2 Configure o `.env` do Frontend

Crie ou edite o arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Supabase (Legado - ainda em uso para algumas funcionalidades)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Azure AD (Autenticação Microsoft)
VITE_MSAL_CLIENT_ID=seu-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/seu-tenant-id

# Leading2Lean API
VITE_L2L_API_BASE_URL=https://autoliv-mx.leading2lean.com/api/1.0
VITE_L2L_API_KEY=sua-chave-api-l2l

# Backend URL
VITE_BACKEND_URL=http://localhost:3001

# Azure (para deploy)
AZURE_SUBSCRIPTION_ID=seu-subscription-id
AZURE_TENANT_ID=seu-tenant-id
```

#### 3.3 Execute o Frontend

```bash
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

### 4. Acesse a Aplicação

Abra seu navegador e acesse: **http://localhost:5173**

## 🚀 Execução Local Completa (Resumo)

Para iniciar o projeto completo localmente, você precisará de **dois terminais**:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

Acesse: **http://localhost:5173**

## 🧪 Testes

### Frontend

Execute os testes unitários com Vitest:

```bash
npm test
```

## 📦 Build de Produção

### Frontend

Gera os arquivos estáticos otimizados na pasta `dist/`:

```bash
npm run build
```

### Preview do Build

Para visualizar o build de produção localmente:

```bash
npm run preview
```

## 🗄️ Banco de Dados

O projeto utiliza **Azure SQL Server** como banco de dados principal.

### Principais Tabelas:

- `users`: Usuários do sistema
- `permissions`: Roles e permissões (RBAC)
- `plants`: Plantas/fábricas
- `production_lines`: Linhas de produção
- `stations`: Estações de trabalho
- `line_documents`: Documentos vinculados às linhas
- `quality_alerts`: Alertas de qualidade
- `document_acknowledgments`: Confirmações de leitura de documentos
- `role_audit_logs`: Histórico de auditoria de roles

### Migrações

As migrações SQL estão localizadas em:
- `backend/migrations/`

## 🔗 Integrações

### Leading2Lean (L2L) API

O sistema integra com a API da Leading2Lean para:
- Sincronização de dados de produção em tempo real
- Informações de linhas e máquinas
- Dados de turnos e produção horária
- Gerenciamento de documentos

**Documentação:** [`docs/L2L_TROUBLESHOOTING.md`](file:///C:/Users/elvis/OneDrive/Documentos/00%20-%20Projetos/AutolivTouchScreen/docs/L2L_TROUBLESHOOTING.md)

### Azure Active Directory (Azure AD)

Autenticação via MSAL (Microsoft Authentication Library):
- Login único (SSO) com contas Microsoft
- Validação de JWT tokens
- Controle de acesso baseado em grupos e roles

## 📂 Deploy

### Frontend (Azure Static Web Apps)

A aplicação frontend é preparada para deploy como site estático (SPA). A pasta `dist/` gerada pelo build pode ser hospedada em:
- Azure Static Web Apps
- Vercel
- Netlify

### Backend (Azure Web Apps)

O backend é deployado como uma aplicação Node.js no Azure Web Apps.

**Scripts de Deploy:**
- `deploy.ps1`: Script PowerShell para deploy automatizado

**Configuração:**
- Arquivo `web.config` já configurado para IIS/Azure
- Variáveis de ambiente devem ser configuradas no portal do Azure

## 🐛 Troubleshooting

### ❌ Erros de Conexão com Backend

**Problema:** Frontend não consegue se conectar ao backend

**Soluções:**
- Verifique se o backend está rodando na porta `3001`
- Confirme que `VITE_BACKEND_URL` no `.env` do frontend aponta para `http://localhost:3001`
- Verifique se o CORS está habilitado no backend (`CORS_ORIGIN=http://localhost:5173`)
- Limpe o cache do navegador e reinicie o dev server do Vite

### ❌ Erros de Banco de Dados

**Problema:** Não consegue conectar ao SQL Server

**Soluções:**
- Confirme as credenciais no `backend/.env` (servidor, database, usuário, senha)
- Verifique se o firewall do Azure SQL permite conexões do seu IP
- Teste a conexão usando Azure Data Studio ou SQL Server Management Studio
- Verifique se `AZURE_SQL_ENCRYPT=true` está definido

### ❌ Erros de Autenticação (MSAL)

**Problema:** Erro ao fazer login com Azure AD

**Soluções:**
- Confirme que `VITE_MSAL_CLIENT_ID` e `VITE_MSAL_AUTHORITY` estão corretos
- Verifique se a aplicação está registrada no Azure AD
- Confirme que as URLs de redirecionamento estão configuradas corretamente no Azure AD
- Limpe os cookies e cache do navegador

### ❌ Erros na API Leading2Lean

**Problema:** Falha ao sincronizar dados do L2L

**Soluções:**
- Verifique se `L2L_API_KEY` está válida
- Confirme que `L2L_API_BASE_URL` está correto
- Consulte [`docs/L2L_TROUBLESHOOTING.md`](file:///C:/Users/elvis/OneDrive/Documentos/00%20-%20Projetos/AutolivTouchScreen/docs/L2L_TROUBLESHOOTING.md) para problemas específicos

### 📚 Documentações Adicionais

- [`docs/CONTEXT_GUIDE.md`](file:///C:/Users/elvis/OneDrive/Documentos/00%20-%20Projetos/AutolivTouchScreen/docs/CONTEXT_GUIDE.md): Guia de contextos React
- [`docs/FRONTEND_INTEGRATION_GUIDE.md`](file:///C:/Users/elvis/OneDrive/Documentos/00%20-%20Projetos/AutolivTouchScreen/docs/FRONTEND_INTEGRATION_GUIDE.md): Guia de integração frontend
- [`docs/L2L_TROUBLESHOOTING.md`](file:///C:/Users/elvis/OneDrive/Documentos/00%20-%20Projetos/AutolivTouchScreen/docs/L2L_TROUBLESHOOTING.md): Problemas com API L2L

## 📝 Licença

Este projeto é proprietário da Autoliv.

---

**Desenvolvido por Elvis Mariano** | Autoliv México
