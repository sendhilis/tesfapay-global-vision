CREATE TABLE public.bankgpt_agent_drafts (
  agent_id text PRIMARY KEY,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bankgpt_agent_drafts TO service_role;

ALTER TABLE public.bankgpt_agent_drafts ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: all reads/writes go through service-role edge function.

CREATE TRIGGER update_bankgpt_agent_drafts_updated_at
BEFORE UPDATE ON public.bankgpt_agent_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();