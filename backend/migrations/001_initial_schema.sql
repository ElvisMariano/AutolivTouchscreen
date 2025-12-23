-- ========================================
-- Migration: Azure SQL Database - Simplified Schema
-- Descrição: Schema completo do AutolivTouchScreen
-- Conversão: Postgres (Supabase) → SQL Server (Azure)
-- ========================================

-- ========================================
-- TABELA: roles
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE roles (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(MAX),
        allowed_resources NVARCHAR(MAX), -- JSON array
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- ========================================
-- TABELA: plants
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[plants]') AND type in (N'U'))
BEGIN
    CREATE TABLE plants (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        location NVARCHAR(500),
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        shift_config NVARCHAR(MAX), -- JSON
        external_id NVARCHAR(100) UNIQUE, -- L2L Site ID
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        created_by UNIQUEIDENTIFIER
    );

    CREATE INDEX idx_plants_status ON plants(status);
    CREATE INDEX idx_plants_external_id ON plants(external_id) WHERE external_id IS NOT NULL;
END
GO

-- ========================================
-- TABELA: production_lines
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[production_lines]') AND type in (N'U'))
BEGIN
    CREATE TABLE production_lines (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        plant_id UNIQUEIDENTIFIER REFERENCES plants(id) ON DELETE CASCADE,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        external_id NVARCHAR(100) UNIQUE, -- L2L Line ID
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_lines_plant ON production_lines(plant_id);
    CREATE INDEX idx_lines_status ON production_lines(status);
    CREATE INDEX idx_lines_external_id ON production_lines(external_id) WHERE external_id IS NOT NULL;
END
GO

-- ========================================
-- TABELA: work_stations
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[work_stations]') AND type in (N'U'))
BEGIN
    CREATE TABLE work_stations (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        line_id UNIQUEIDENTIFIER REFERENCES production_lines(id) ON DELETE CASCADE,
        station_number INT,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        external_id NVARCHAR(100) UNIQUE, -- L2L Machine ID
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_stations_line ON work_stations(line_id);
    CREATE INDEX idx_stations_status ON work_stations(status);
    CREATE INDEX idx_stations_external_id ON work_stations(external_id) WHERE external_id IS NOT NULL;
END
GO

-- ========================================
-- TABELA: users
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        name NVARCHAR(200) NOT NULL,
        role_id UNIQUEIDENTIFIER REFERENCES roles(id),
        azure_ad_id NVARCHAR(255) UNIQUE, -- Azure AD Object ID
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        deleted_at DATETIMEOFFSET
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role_id);
    CREATE INDEX idx_users_azure_ad ON users(azure_ad_id) WHERE azure_ad_id IS NOT NULL;
END
GO

-- ========================================
-- TABELA: user_plants (Junction Table)
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_plants]') AND type in (N'U'))
BEGIN
    CREATE TABLE user_plants (
        user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
        plant_id UNIQUEIDENTIFIER REFERENCES plants(id) ON DELETE CASCADE,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        PRIMARY KEY (user_id, plant_id)
    );
END
GO

-- ========================================
-- TABELA: line_documents
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[line_documents]') AND type in (N'U'))
BEGIN
    CREATE TABLE line_documents (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        line_id UNIQUEIDENTIFIER REFERENCES production_lines(id) ON DELETE CASCADE,
        station_id UNIQUEIDENTIFIER REFERENCES work_stations(id) ON DELETE SET NULL,
        title NVARCHAR(500) NOT NULL,
        document_url NVARCHAR(MAX) NOT NULL, -- URL or data:uri
        viewinfo NVARCHAR(MAX), -- Data URL do PDF (L2L)
        category NVARCHAR(100) NOT NULL,
        version INT DEFAULT 1,
        metadata NVARCHAR(MAX), -- JSON
        uploaded_by UNIQUEIDENTIFIER REFERENCES users(id),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_docs_line ON line_documents(line_id);
    CREATE INDEX idx_docs_station ON line_documents(station_id);
    CREATE INDEX idx_docs_category ON line_documents(category);
END
GO

-- ========================================
-- TABELA: document_acknowledgments
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[document_acknowledgments]') AND type in (N'U'))
BEGIN
    CREATE TABLE document_acknowledgments (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        document_id UNIQUEIDENTIFIER REFERENCES line_documents(id) ON DELETE CASCADE,
        user_id UNIQUEIDENTIFIER REFERENCES users(id),
        acknowledged_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        UNIQUE (document_id, user_id)
    );

    CREATE INDEX idx_ack_document ON document_acknowledgments(document_id);
    CREATE INDEX idx_ack_user ON document_acknowledgments(user_id);
END
GO

-- ========================================
-- TABELA: quality_alerts
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[quality_alerts]') AND type in (N'U'))
BEGIN
    CREATE TABLE quality_alerts (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        line_id UNIQUEIDENTIFIER REFERENCES production_lines(id) ON DELETE CASCADE,
        title NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX),
        severity NVARCHAR(20) CHECK (severity IN ('A', 'B', 'C')),
        document_id NVARCHAR(MAX), -- URL do documento relacionado
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        expires_at DATETIMEOFFSET NOT NULL,
        is_expired BIT DEFAULT 0,
        is_read BIT DEFAULT 0
    );

    CREATE INDEX idx_alerts_line ON quality_alerts(line_id);
    CREATE INDEX idx_alerts_expires ON quality_alerts(expires_at);
END
GO

-- ========================================
-- TABELA: power_bi_reports
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[power_bi_reports]') AND type in (N'U'))
BEGIN
    CREATE TABLE power_bi_reports (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        line_id UNIQUEIDENTIFIER REFERENCES production_lines(id) ON DELETE CASCADE,
        name NVARCHAR(200) NOT NULL,
        report_link NVARCHAR(MAX) NOT NULL,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_reports_line ON power_bi_reports(line_id);
END
GO

-- ========================================
-- TABELA: presentations
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[presentations]') AND type in (N'U'))
BEGIN
    CREATE TABLE presentations (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        line_id UNIQUEIDENTIFIER REFERENCES production_lines(id) ON DELETE CASCADE,
        title NVARCHAR(500) NOT NULL,
        presentation_link NVARCHAR(MAX) NOT NULL,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_presentations_line ON presentations(line_id);
END
GO

-- ========================================
-- TABELA: change_log
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[change_log]') AND type in (N'U'))
BEGIN
    CREATE TABLE change_log (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        user_id UNIQUEIDENTIFIER REFERENCES users(id),
        entity_type NVARCHAR(100) NOT NULL, -- 'plant', 'line', 'document', etc
        entity_id NVARCHAR(100),
        action NVARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'restore'
        description NVARCHAR(MAX),
        occurred_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_changelog_user ON change_log(user_id);
    CREATE INDEX idx_changelog_entity ON change_log(entity_type, entity_id);
    CREATE INDEX idx_changelog_occurred ON change_log(occurred_at DESC);
END
GO

-- ========================================
-- TABELA: l2l_sync_logs
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[l2l_sync_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE l2l_sync_logs (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        sync_type NVARCHAR(50) NOT NULL, -- 'plants', 'lines', 'machines', 'documents', 'all'
        status NVARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
        records_created INT DEFAULT 0,
        records_updated INT DEFAULT 0,
        records_deactivated INT DEFAULT 0,
        errors NVARCHAR(MAX), -- JSON array de erros
        synced_by UNIQUEIDENTIFIER REFERENCES users(id),
        synced_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE INDEX idx_sync_logs_type ON l2l_sync_logs(sync_type);
    CREATE INDEX idx_sync_logs_synced ON l2l_sync_logs(synced_at DESC);
END
GO

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Role padrão: Admin
IF NOT EXISTS (SELECT * FROM roles WHERE name = 'Admin')
BEGIN
    INSERT INTO roles (id, name, description, allowed_resources) VALUES
    (NEWID(), 'Admin', 'Administrador com acesso total', '["*"]');
END
GO

-- Role padrão: User  
IF NOT EXISTS (SELECT * FROM roles WHERE name = 'User')
BEGIN
    INSERT INTO roles (id, name, description, allowed_resources) VALUES
    (NEWID(), 'User', 'Usuário padrão com acesso limitado', '["view:dashboard", "view:documents"]');
END
GO

PRINT '✅ Schema criado com sucesso!';
PRINT '📊 Tabelas criadas/verificadas: 13';
PRINT '👤 Roles iniciais: 2 (Admin, User)';
GO
