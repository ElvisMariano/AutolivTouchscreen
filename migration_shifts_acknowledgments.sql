-- Migration to add active_shifts to plants and create document_acknowledgments table

-- 1. Add active_shifts column to plants table
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS active_shifts text[] DEFAULT ARRAY['1º Turno', '2º Turno', '3º Turno'];

-- 2. Create document_acknowledgments table
CREATE TABLE IF NOT EXISTS document_acknowledgments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES line_documents(id) ON DELETE CASCADE,
  shift text NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  acknowledged_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_ack_per_version UNIQUE (document_id, shift) -- Ensure one ack per doc/shift (actually we need to re-ack if update, so unique on doc/shift is risky if we don't delete rows on update or check timestamp. Better to just insert new row or update existing.)
);

-- Note: To handle re-acknowledgment on update, the application logic will check 
-- if (document.uploaded_at > acknowledgment.acknowledged_at).
-- We can upsert into this table. Using UNIQUE(document_id, shift) allows ON CONFLICT UPDATE.

ALTER TABLE document_acknowledgments DROP CONSTRAINT IF EXISTS unique_ack_per_version;
ALTER TABLE document_acknowledgments ADD CONSTRAINT unique_ack_per_version UNIQUE (document_id, shift);

CREATE INDEX IF NOT EXISTS idx_ack_doc_shift ON document_acknowledgments(document_id, shift);
