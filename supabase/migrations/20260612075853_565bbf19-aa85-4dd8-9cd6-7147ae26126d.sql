CREATE TABLE public.bankgpt_kb_contents (
  doc_id text PRIMARY KEY,
  agent_id text NOT NULL,
  name text NOT NULL,
  storage_path text,
  mime_type text,
  content text NOT NULL DEFAULT '',
  char_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bankgpt_kb_contents TO service_role;

ALTER TABLE public.bankgpt_kb_contents ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: edge functions use service role.

CREATE INDEX bankgpt_kb_contents_agent_idx
  ON public.bankgpt_kb_contents (agent_id);

CREATE TRIGGER update_bankgpt_kb_contents_updated_at
BEFORE UPDATE ON public.bankgpt_kb_contents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();