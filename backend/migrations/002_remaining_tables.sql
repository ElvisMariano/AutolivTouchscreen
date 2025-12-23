-- Criar tabelas que faltaram

-- line_documents
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[line_documents]') AND type in (N'U'))
BEGIN
    CREATE TABLE line_documents (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        line_id UNIQUEIDENTIFIER,
        station_id UNIQUEIDENTIFIER,
        title NVARCHAR(500) NOT NULL,
        document_url NVARCHAR(MAX) NOT NULL,
        viewinfo NVARCHAR(MAX),
        category NVARCHAR(100) NOT NULL,
        version INT DEFAULT 1,
        metadata NVARCHAR(MAX),
        uploaded_by UNIQUEIDENTIFIER,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
    
    PRINT 'Tabela line_documents criada';
END
GO

-- document_acknowledgments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[document_acknowledgments]') AND type in (N'U'))
BEGIN
    CREATE TABLE document_acknowledgments (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        document_id UNIQUEIDENTIFIER,
        user_id UNIQUEIDENTIFIER,
        acknowledged_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
    
    PRINT 'Tabela document_acknowledgments criada';
END
GO

PRINT '✅ Tabelas restantes criadas!';
