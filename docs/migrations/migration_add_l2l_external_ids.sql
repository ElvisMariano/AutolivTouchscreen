-- Migração: Adicionar suporte para integração com API Leading2Lean (L2L)
-- Data: 2025-12-18
-- Descrição: Adiciona campos external_id para mapeamento de entidades L2L,
--            campo viewinfo para PDFs do PLM e tabela de logs de sincronização

-- 1. Adicionar external_id à tabela plants
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

-- Criar índice para performance em buscas por external_id
CREATE INDEX IF NOT EXISTS idx_plants_external_id ON plants(external_id);

COMMENT ON COLUMN plants.external_id IS 'ID da planta no sistema Leading2Lean (L2L Site ID)';

-- 2. Adicionar external_id à tabela work_stations
ALTER TABLE work_stations 
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_work_stations_external_id ON work_stations(external_id);

COMMENT ON COLUMN work_stations.external_id IS 'ID da estação no sistema Leading2Lean (L2L Machine ID)';

-- 3. Adicionar viewinfo à tabela line_documents
-- Este campo armazenará data:url do PDF fornecido pelo PLM via L2L
ALTER TABLE line_documents 
ADD COLUMN IF NOT EXISTS viewinfo TEXT;

COMMENT ON COLUMN line_documents.viewinfo IS 'Data URL do PDF fornecido pelo PLM através da API L2L';

-- 4. Criar tabela de logs de sincronização L2L
CREATE TABLE IF NOT EXISTS l2l_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('plants', 'lines', 'machines', 'documents', 'all')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deactivated INTEGER DEFAULT 0,
  errors JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Criar índice para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_l2l_sync_logs_synced_at ON l2l_sync_logs(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_l2l_sync_logs_sync_type ON l2l_sync_logs(sync_type);

COMMENT ON TABLE l2l_sync_logs IS 'Logs de sincronização com a API Leading2Lean';
COMMENT ON COLUMN l2l_sync_logs.sync_type IS 'Tipo de sincronização executada';
COMMENT ON COLUMN l2l_sync_logs.status IS 'Status da sincronização';
COMMENT ON COLUMN l2l_sync_logs.records_created IS 'Número de registros criados';
COMMENT ON COLUMN l2l_sync_logs.records_updated IS 'Número de registros atualizados';
COMMENT ON COLUMN l2l_sync_logs.records_deactivated IS 'Número de registros desativados';
COMMENT ON COLUMN l2l_sync_logs.errors IS 'Array de erros encontrados durante a sincronização';
COMMENT ON COLUMN l2l_sync_logs.synced_by IS 'Usuário que iniciou a sincronização';
