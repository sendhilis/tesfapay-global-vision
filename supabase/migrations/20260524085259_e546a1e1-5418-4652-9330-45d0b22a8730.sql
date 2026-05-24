ALTER TABLE public.bank_configs
ADD COLUMN IF NOT EXISTS enabled_modules jsonb NOT NULL DEFAULT '[]'::jsonb;