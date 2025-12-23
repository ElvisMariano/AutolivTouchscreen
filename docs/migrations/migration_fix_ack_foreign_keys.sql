-- Migration to fix document_acknowledgments foreign keys

-- 1. Drop existing constraints if they exist
ALTER TABLE document_acknowledgments 
DROP CONSTRAINT IF EXISTS document_acknowledgments_acknowledged_by_fkey;

ALTER TABLE document_acknowledgments 
DROP CONSTRAINT IF EXISTS document_acknowledgments_document_id_fkey;

-- 2. Add correct constraint for acknowledged_by (referencing public.users instead of auth.users)
ALTER TABLE document_acknowledgments 
ADD CONSTRAINT document_acknowledgments_acknowledged_by_fkey 
FOREIGN KEY (acknowledged_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. We do NOT add back document_id constraint to allow referencing station_instructions table IDs
-- which are not in line_documents table.
-- If we wanted to check both, we'd need a polymorphic relationship or check triggers, 
-- but for simplicity/performance in this app context, we assume ID validity is handled by app logic.
