-- Drop Foreign Key Constraint to allow acknowledging both line_documents and station_instructions (which are separate tables)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_acknowledgments_document_id_fkey' 
        AND table_name = 'document_acknowledgments'
    ) THEN
        ALTER TABLE document_acknowledgments DROP CONSTRAINT document_acknowledgments_document_id_fkey;
    END IF;
END $$;
