-- Add settings column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.users.settings IS 'User specific system settings (theme, language, etc)';
