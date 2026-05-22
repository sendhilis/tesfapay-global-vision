
CREATE TABLE IF NOT EXISTS public.bank_configs (
  id text PRIMARY KEY,
  config jsonb NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read bank configs"
  ON public.bank_configs FOR SELECT
  USING (true);

CREATE POLICY "Public can insert bank configs"
  ON public.bank_configs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update bank configs"
  ON public.bank_configs FOR UPDATE
  USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_configs;
