-- Add shift column to document_acknowledgments
IF NOT EXISTS (
  SELECT * 
  FROM sys.columns 
  WHERE object_id = OBJECT_ID(N'[dbo].[document_acknowledgments]') 
  AND name = 'shift'
)
BEGIN
    ALTER TABLE document_acknowledgments
    ADD shift NVARCHAR(50);
    
    PRINT 'Column shift added to document_acknowledgments';
END
ELSE
BEGIN
    PRINT 'Column shift already exists in document_acknowledgments';
END
GO
