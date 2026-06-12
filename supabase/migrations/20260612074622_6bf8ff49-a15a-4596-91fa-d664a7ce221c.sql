CREATE TABLE IF NOT EXISTS public.bankgpt_agents (
  agent_id        text PRIMARY KEY,
  bank_name       text,
  name            text NOT NULL,
  tagline         text,
  system_prompt   text NOT NULL DEFAULT '',
  tone            jsonb NOT NULL DEFAULT '{"formal_casual":50,"terse_verbose":50,"reserved_expressive":50}'::jsonb,
  uses_emoji      boolean NOT NULL DEFAULT true,
  kb              jsonb NOT NULL DEFAULT '{"docs":[],"topK":4}'::jsonb,
  tools           jsonb NOT NULL DEFAULT '[]'::jsonb,
  widget          jsonb NOT NULL DEFAULT '{"style":"bubble","surfaces":["home"]}'::jsonb,
  guardrails      jsonb NOT NULL DEFAULT '{}'::jsonb,
  published       boolean NOT NULL DEFAULT true,
  published_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bankgpt_agents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bankgpt_agents TO authenticated;
GRANT ALL ON public.bankgpt_agents TO service_role;

ALTER TABLE public.bankgpt_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankgpt_agents_public_read_published"
  ON public.bankgpt_agents
  FOR SELECT
  USING (published = true);

CREATE POLICY "bankgpt_agents_auth_insert"
  ON public.bankgpt_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "bankgpt_agents_auth_update"
  ON public.bankgpt_agents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bankgpt_agents_auth_delete"
  ON public.bankgpt_agents
  FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER bankgpt_agents_set_updated_at
  BEFORE UPDATE ON public.bankgpt_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();