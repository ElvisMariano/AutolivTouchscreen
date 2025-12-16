# Autoliv Touch Screen (Web Application)

Aplicação web desenvolvida para gerenciamento de instruções de trabalho, alertas de qualidade e visualização de documentos no chão de fábrica da Autoliv.

## 🚀 Tecnologias

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **Ícones:** Heroicons

## ✨ Funcionalidades Principais

### 🔒 Autenticação e Segurança
- **Sistema de Login Próprio:** Autenticação via Supabase com hash de senha seguro (SHA-256 + Salt).
- **Controle de Acesso Granular (RBAC):** Sistema robusto de Roles (Perfis) e Permissões.
- **Auditoria:** Logs detalhados de todas as ações críticas (criação/edição/exclusão de roles, usuários, documentos, etc.).

### 🏭 Gestão de Fábrica
- **Estrutura Hierárquica:** Gerenciamento de Plantas, Linhas de Produção e Estações de Trabalho.
- **Painel Administrativo Completo:** Interface dedicada para configuração de todo o sistema.

### 📄 Gestão de Documentos
- **Instruções de Trabalho:** Visualização de PDFs vinculados a estações específicas.
- **Alertas de Qualidade:** Sistema de alertas com níveis de severidade (A, B, C) e expiração automática.
- **Critérios de Aceitação & Trabalho Padronizado:** Módulos dedicados para documentação de processos.
- **Integração PowerBI:** Visualização de relatórios embutidos.
- **Validação:** Bloqueio de cadastro de documentos caso nenhuma linha de produção esteja selecionada, garantindo integridade dos dados.

### 👤 Gestão de Usuários e Roles
- **CRUD de Usuários:** Cadastro completo com vinculação a roles e plantas.
- **Editor de Roles:** Interface visual para criar perfis de acesso personalizados, selecionando permissões específicas (ex: `view:dashboard`, `admin:manage_users`).

### ⚙️ Configurações do Sistema
- **i18n:** Suporte a múltiplos idiomas (Português, Inglês, Espanhol).
- **Temas:** Modo Claro e Escuro.
- **Personalização:** Configuração de timeouts, sons e comportamento de quiosque.

## 🛠️ Como Rodar Localmente

**Pré-requisitos:** Node.js 18+

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/ElvisMariano/AutolivTouchscreen.git
    cd AutolivTouchscreen
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configuração de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase e do MSAL:
    ```env
    VITE_SUPABASE_URL=seu_supabase_url
    VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
    MSAL_CLIENT_ID=seu_client_id_aqui
    MSAL_AUTHORITY=seu_authority_url_aqui
    ```
    Essas variáveis do MSAL são lidas no frontend via `process.env` (configurado em `vite.config.ts`). Para produção, utilize um arquivo específico como `.env.production` com os valores reais. O arquivo `.env` já está ignorado pelo controle de versão.

4.  **Execute a aplicação:**
    ```bash
    npm run dev
    ```

5.  **Build de Produção:**
    ```bash
    npm run build
    ```

## 🗄️ Banco de Dados (Supabase)

O projeto utiliza funções RPC (`Remote Procedure Calls`) para garantir a segurança e integridade das operações administrativas, ignorando restrições de RLS apenas quando estritamente necessário e validado.

principais tabelas:
- `users`: Usuários do sistema.
- `permissions`: Definição de roles e recursos permitidos.
- `role_audit_logs`: Histórico de auditoria de roles.
- `documents`, `quality_alerts`, `plants`, `production_lines`, `machines`: Dados operacionais.

## 📦 Deploy

A aplicação é preparada para deploy como site estático (SPA). A pasta `dist/` gerada pelo build pode ser hospedada em serviços como Vercel, Netlify ou Azure Static Web Apps.
