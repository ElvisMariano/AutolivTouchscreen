-- Migration to add shift_config column to plants table
-- The 'active_shifts' column is assumed to be removed or ignored.

ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS shift_config JSONB DEFAULT '[
  {"name": "1º Turno", "startTime": "06:00", "endTime": "14:00", "isActive": true},
  {"name": "2º Turno", "startTime": "14:00", "endTime": "22:00", "isActive": true},
  {"name": "3º Turno", "startTime": "22:00", "endTime": "06:00", "isActive": true}
]';

-- Comment: Stores configuration for shifts (name, start/end times, active status)
COMMENT ON COLUMN plants.shift_config IS 'JSONB array containing shift definitions: [{name, startTime, endTime, isActive}]';
