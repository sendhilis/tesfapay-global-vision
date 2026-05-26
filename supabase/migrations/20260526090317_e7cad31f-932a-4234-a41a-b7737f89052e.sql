-- ============================================================
-- BATCH 2 / Nisir port: migrations 10-29 consolidated
-- ============================================================

-- =========== 10: Chart of Accounts & GL ===========
CREATE TABLE public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gl_code text NOT NULL UNIQUE,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset','liability','income','expense','equity')),
  parent_id uuid REFERENCES public.chart_of_accounts(id),
  is_pool_gl boolean NOT NULL DEFAULT false,
  cbs_code text,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed')),
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view COA" ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manages COA" ON public.chart_of_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can insert COA" ON public.chart_of_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update COA" ON public.chart_of_accounts FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.gl_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  debit_account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  credit_account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  amount numeric NOT NULL CHECK (amount > 0),
  narrative text,
  source_type text,
  source_transaction_id uuid,
  profile_id uuid,
  posted_to_cbs boolean NOT NULL DEFAULT false,
  cbs_batch_id uuid,
  cbs_reference text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.gl_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view GL entries" ON public.gl_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert GL entries" ON public.gl_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role manages GL entries" ON public.gl_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.gl_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('debit','credit')),
  debit_gl_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  credit_gl_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  fee_gl_id uuid REFERENCES public.chart_of_accounts(id),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(transaction_type, direction)
);
ALTER TABLE public.gl_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view GL mappings" ON public.gl_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert GL mappings" ON public.gl_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update GL mappings" ON public.gl_mappings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Service role manages GL mappings" ON public.gl_mappings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.fee_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_name text NOT NULL,
  transaction_type text NOT NULL,
  calculation_method text NOT NULL CHECK (calculation_method IN ('flat','percentage','tiered')),
  flat_amount numeric DEFAULT 0,
  percentage_rate numeric DEFAULT 0,
  min_fee numeric DEFAULT 0,
  max_fee numeric DEFAULT 0,
  fee_gl_id uuid REFERENCES public.chart_of_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.fee_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view fee defs" ON public.fee_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fee defs" ON public.fee_definitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fee defs" ON public.fee_definitions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Service role manages fee defs" ON public.fee_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.pool_gl_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text NOT NULL DEFAULT ('BATCH-' || substr(gen_random_uuid()::text, 1, 8)),
  gl_account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  total_debit numeric NOT NULL DEFAULT 0,
  total_credit numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  entry_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','posting','posted','failed')),
  posted_at timestamptz,
  cbs_reference text,
  cbs_response jsonb,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.pool_gl_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view batches" ON public.pool_gl_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert batches" ON public.pool_gl_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update batches" ON public.pool_gl_batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Service role manages batches" ON public.pool_gl_batches FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gl_mappings_updated_at BEFORE UPDATE ON public.gl_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fee_definitions_updated_at BEFORE UPDATE ON public.fee_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pool_gl_batches_updated_at BEFORE UPDATE ON public.pool_gl_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== 12: Integrations ===========
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  logo_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  documentation_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_health_check TIMESTAMPTZ,
  sandbox_base_url TEXT,
  production_base_url TEXT,
  default_headers JSONB DEFAULT '{}'::jsonb,
  rate_limit_per_minute INTEGER DEFAULT 60,
  ip_whitelist TEXT[],
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view integrations" ON public.integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert integrations" ON public.integrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update integrations" ON public.integrations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete integrations" ON public.integrations FOR DELETE TO authenticated USING (true);

CREATE TABLE public.integration_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  api_key TEXT, api_secret TEXT, base_url TEXT, auth_token TEXT,
  oauth_client_id TEXT, oauth_client_secret TEXT, oauth_token_url TEXT,
  custom_headers JSONB DEFAULT '{}'::jsonb,
  extra_params JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(integration_id, environment)
);
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view configs" ON public.integration_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert configs" ON public.integration_configs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update configs" ON public.integration_configs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete configs" ON public.integration_configs FOR DELETE TO authenticated USING (true);

CREATE TABLE public.integration_test_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  method TEXT NOT NULL DEFAULT 'GET',
  endpoint TEXT NOT NULL,
  request_headers JSONB DEFAULT '{}'::jsonb,
  request_body JSONB,
  response_status INTEGER,
  response_headers JSONB DEFAULT '{}'::jsonb,
  response_body JSONB,
  latency_ms INTEGER,
  is_success BOOLEAN DEFAULT false,
  error_message TEXT,
  tested_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.integration_test_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view test logs" ON public.integration_test_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert test logs" ON public.integration_test_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.integration_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.integration_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view audit logs" ON public.integration_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert audit logs" ON public.integration_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integration_configs_updated_at BEFORE UPDATE ON public.integration_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== 13: Agents ===========
CREATE TYPE public.agent_category AS ENUM ('super_agent', 'agent', 'sub_agent');
CREATE TYPE public.agent_status AS ENUM ('pending', 'active', 'suspended', 'terminated');

CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  agent_category agent_category NOT NULL DEFAULT 'agent',
  agent_code TEXT NOT NULL DEFAULT ('AGT-' || substr(gen_random_uuid()::text, 1, 8)),
  business_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  parent_agent_id UUID REFERENCES public.agents(id),
  float_balance NUMERIC NOT NULL DEFAULT 0,
  max_float NUMERIC NOT NULL DEFAULT 200000,
  daily_cash_in_limit NUMERIC NOT NULL DEFAULT 100000,
  daily_cash_out_limit NUMERIC NOT NULL DEFAULT 100000,
  commission_rate NUMERIC NOT NULL DEFAULT 0.5,
  status agent_status NOT NULL DEFAULT 'pending',
  onboarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id)
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view all agents" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own agent" ON public.agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own agent" ON public.agents FOR UPDATE TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Service role manages agents" ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.agent_float_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requesting_agent_id UUID NOT NULL REFERENCES public.agents(id),
  providing_agent_id UUID NOT NULL REFERENCES public.agents(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.agent_float_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view float requests" ON public.agent_float_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert float requests" ON public.agent_float_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update float requests" ON public.agent_float_requests FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.agent_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  customer_profile_id UUID,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  reference TEXT DEFAULT ('ATXN-' || substr(gen_random_uuid()::text, 1, 12)),
  status TEXT NOT NULL DEFAULT 'completed',
  customer_msisdn TEXT,
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view agent transactions" ON public.agent_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert agent transactions" ON public.agent_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== 14: Beneficiaries & Salary ===========
CREATE TABLE public.beneficiaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  beneficiary_name TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT 'Nisir Microfinance',
  account_number TEXT NOT NULL,
  transfer_type TEXT NOT NULL DEFAULT 'internal',
  nickname TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own beneficiaries" ON public.beneficiaries FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own beneficiaries" ON public.beneficiaries FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own beneficiaries" ON public.beneficiaries FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own beneficiaries" ON public.beneficiaries FOR DELETE USING (auth.uid() = profile_id);

CREATE TABLE public.salary_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  batch_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  source_file_name TEXT,
  debit_account_id UUID,
  remarks TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.salary_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own salary batches" ON public.salary_batches FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own salary batches" ON public.salary_batches FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own salary batches" ON public.salary_batches FOR UPDATE USING (auth.uid() = profile_id);

CREATE TABLE public.salary_batch_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.salary_batches(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT 'Nisir Microfinance',
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  reference TEXT DEFAULT ('SAL-' || substr(gen_random_uuid()::text, 1, 12)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.salary_batch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own salary items" ON public.salary_batch_items FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own salary items" ON public.salary_batch_items FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own salary items" ON public.salary_batch_items FOR UPDATE USING (auth.uid() = profile_id);

-- =========== 15: Approvals & Scheduled Payments ===========
CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own approval requests" ON public.approval_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can view own approval requests" ON public.approval_requests FOR SELECT TO authenticated USING (auth.uid() = profile_id);

CREATE TABLE public.scheduled_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'transfer',
  schedule_type TEXT NOT NULL DEFAULT 'one_time',
  from_account_id UUID,
  to_account_number TEXT,
  to_bank TEXT DEFAULT 'Nisir Microfinance',
  to_name TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own scheduled payments" ON public.scheduled_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can view own scheduled payments" ON public.scheduled_payments FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Users can update own scheduled payments" ON public.scheduled_payments FOR UPDATE TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own scheduled payments" ON public.scheduled_payments FOR DELETE TO authenticated USING (auth.uid() = profile_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;

-- =========== 16: Fixed Deposits & Secure Messages ===========
CREATE TABLE public.fixed_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  linked_account_id UUID REFERENCES public.accounts(id),
  amount NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  interest_rate NUMERIC NOT NULL DEFAULT 8.0,
  placement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE NOT NULL,
  maturity_instruction TEXT NOT NULL DEFAULT 'auto_renew',
  accrued_interest NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  certificate_number TEXT NOT NULL DEFAULT ('FD-' || substr(gen_random_uuid()::text, 1, 10)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.fixed_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own FDs" ON public.fixed_deposits FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own FDs" ON public.fixed_deposits FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own FDs" ON public.fixed_deposits FOR UPDATE USING (auth.uid() = profile_id);

CREATE TABLE public.secure_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  body TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'customer',
  parent_id UUID REFERENCES public.secure_messages(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.secure_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.secure_messages FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own messages" ON public.secure_messages FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own messages" ON public.secure_messages FOR UPDATE USING (auth.uid() = profile_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.secure_messages;

-- =========== 17: Corporate Entities & Users ===========
CREATE TABLE public.corporate_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  tin_number TEXT NOT NULL UNIQUE,
  trade_license TEXT,
  business_type TEXT DEFAULT 'MSME',
  sector TEXT,
  address TEXT,
  city TEXT DEFAULT 'Addis Ababa',
  region TEXT DEFAULT 'Addis Ababa',
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  articles_of_association_url TEXT,
  board_resolution_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rm_assigned TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  max_daily_limit NUMERIC DEFAULT 1000000,
  max_transaction_limit NUMERIC DEFAULT 500000,
  maker_checker_threshold NUMERIC DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.corporate_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view corporate entities" ON public.corporate_entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert corporate entities" ON public.corporate_entities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update corporate entities" ON public.corporate_entities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Service role manages corporate entities" ON public.corporate_entities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER update_corporate_entities_updated_at BEFORE UPDATE ON public.corporate_entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.corporate_role AS ENUM ('corporate_admin', 'maker', 'checker', 'approver', 'finance_viewer', 'payroll_officer');

CREATE TABLE public.corporate_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_entity_id UUID NOT NULL REFERENCES public.corporate_entities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  role public.corporate_role NOT NULL DEFAULT 'maker',
  designation TEXT,
  department TEXT,
  transaction_limit NUMERIC DEFAULT 50000,
  is_active BOOLEAN DEFAULT true,
  can_approve_own BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corporate_entity_id, profile_id)
);
ALTER TABLE public.corporate_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view corporate users" ON public.corporate_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert corporate users" ON public.corporate_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update corporate users" ON public.corporate_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete corporate users" ON public.corporate_users FOR DELETE TO authenticated USING (true);
CREATE POLICY "Service role manages corporate users" ON public.corporate_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER update_corporate_users_updated_at BEFORE UPDATE ON public.corporate_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== 19: Savings Groups ===========
CREATE TABLE public.savings_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id),
  group_name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.savings_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view savings groups" ON public.savings_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert savings groups" ON public.savings_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update savings groups" ON public.savings_groups FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.savings_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.savings_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  member_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.savings_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view group members" ON public.savings_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert group members" ON public.savings_group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update group members" ON public.savings_group_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete group members" ON public.savings_group_members FOR DELETE TO authenticated USING (true);

CREATE TABLE public.savings_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.savings_groups(id),
  member_id UUID NOT NULL REFERENCES public.savings_group_members(id),
  agent_id UUID REFERENCES public.agents(id),
  amount NUMERIC NOT NULL,
  reference TEXT DEFAULT ('SCOL-' || substr(gen_random_uuid()::text, 1, 10)),
  collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.savings_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view collections" ON public.savings_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert collections" ON public.savings_collections FOR INSERT TO authenticated WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_collections;

-- =========== 20: BDP Dimensions & Facts ===========
CREATE TABLE public.bdp_dim_time (
  date_key date PRIMARY KEY,
  day_of_week integer NOT NULL, day_of_month integer NOT NULL, day_of_year integer NOT NULL,
  week_of_year integer NOT NULL, month integer NOT NULL, month_name text NOT NULL,
  quarter integer NOT NULL, year integer NOT NULL, fiscal_year integer NOT NULL,
  is_weekend boolean NOT NULL DEFAULT false, is_holiday boolean NOT NULL DEFAULT false, holiday_name text
);
INSERT INTO public.bdp_dim_time (date_key, day_of_week, day_of_month, day_of_year, week_of_year, month, month_name, quarter, year, fiscal_year, is_weekend)
SELECT d::date, EXTRACT(dow FROM d)::int, EXTRACT(day FROM d)::int, EXTRACT(doy FROM d)::int,
  EXTRACT(week FROM d)::int, EXTRACT(month FROM d)::int, TO_CHAR(d, 'Month'),
  EXTRACT(quarter FROM d)::int, EXTRACT(year FROM d)::int,
  CASE WHEN EXTRACT(month FROM d) >= 7 THEN EXTRACT(year FROM d)::int ELSE EXTRACT(year FROM d)::int - 1 END,
  EXTRACT(dow FROM d) IN (0, 6)
FROM generate_series('2024-01-01'::date, '2027-12-31'::date, '1 day'::interval) d;
ALTER TABLE public.bdp_dim_time ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view time dim" ON public.bdp_dim_time FOR SELECT TO authenticated USING (true);

CREATE TABLE public.bdp_dim_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid, full_name text NOT NULL, gender text DEFAULT 'unknown',
  age_band text DEFAULT '18-25', region text NOT NULL DEFAULT 'Addis Ababa', sub_city text,
  kyc_tier text DEFAULT 'basic', customer_segment text DEFAULT 'retail',
  account_open_date date, is_active boolean DEFAULT true, source_system text DEFAULT 'cbs',
  cbs_customer_id text, last_synced_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_dim_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view customer dim" ON public.bdp_dim_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert customer dim" ON public.bdp_dim_customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role manages customer dim" ON public.bdp_dim_customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_bdp_dim_customers_region ON public.bdp_dim_customers(region);
CREATE INDEX idx_bdp_dim_customers_segment ON public.bdp_dim_customers(customer_segment);
CREATE INDEX idx_bdp_dim_customers_profile ON public.bdp_dim_customers(profile_id);
CREATE UNIQUE INDEX bdp_dim_customers_profile_id_key ON public.bdp_dim_customers (profile_id) WHERE profile_id IS NOT NULL;

CREATE TABLE public.bdp_dim_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text UNIQUE NOT NULL, product_name text NOT NULL,
  product_category text NOT NULL, product_type text NOT NULL,
  interest_rate numeric DEFAULT 0, currency text DEFAULT 'ETB',
  is_active boolean DEFAULT true, source_system text DEFAULT 'cbs', created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_dim_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view product dim" ON public.bdp_dim_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert product dim" ON public.bdp_dim_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role manages product dim" ON public.bdp_dim_products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.bdp_fact_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL, transaction_time timestamptz DEFAULT now(),
  customer_id uuid REFERENCES public.bdp_dim_customers(id),
  product_id uuid REFERENCES public.bdp_dim_products(id),
  transaction_type text NOT NULL, channel text DEFAULT 'mobile', direction text NOT NULL,
  amount numeric NOT NULL DEFAULT 0, fee numeric DEFAULT 0, currency text DEFAULT 'ETB',
  status text DEFAULT 'completed', cbs_reference text, source_system text DEFAULT 'cbs',
  source_transaction_id uuid, batch_id uuid, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_fact_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view txn facts" ON public.bdp_fact_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert txn facts" ON public.bdp_fact_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_bdp_fact_txn_date ON public.bdp_fact_transactions(transaction_date);
CREATE INDEX idx_bdp_fact_txn_type ON public.bdp_fact_transactions(transaction_type);
CREATE INDEX idx_bdp_fact_txn_customer ON public.bdp_fact_transactions(customer_id);
CREATE INDEX idx_bdp_fact_txn_batch ON public.bdp_fact_transactions(batch_id);
CREATE UNIQUE INDEX idx_bdp_fact_txn_dedup ON bdp_fact_transactions (transaction_date, source_transaction_id) WHERE source_transaction_id IS NOT NULL;

CREATE TABLE public.bdp_fact_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  customer_id uuid REFERENCES public.bdp_dim_customers(id),
  product_id uuid REFERENCES public.bdp_dim_products(id),
  loan_account_number text, disbursement_date date, maturity_date date,
  disbursed_amount numeric DEFAULT 0, outstanding_principal numeric DEFAULT 0,
  outstanding_interest numeric DEFAULT 0, total_outstanding numeric DEFAULT 0,
  days_past_due integer DEFAULT 0, npl_classification text DEFAULT 'pass',
  provision_rate numeric DEFAULT 0, provision_amount numeric DEFAULT 0,
  risk_weight numeric DEFAULT 1.0, collateral_value numeric DEFAULT 0,
  interest_rate numeric DEFAULT 0, tenor_months integer DEFAULT 0,
  source_system text DEFAULT 'los', cbs_loan_id text, batch_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_fact_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view loan facts" ON public.bdp_fact_loans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert loan facts" ON public.bdp_fact_loans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role manages loan facts" ON public.bdp_fact_loans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_bdp_fact_loans_date ON public.bdp_fact_loans(snapshot_date);
CREATE INDEX idx_bdp_fact_loans_npl ON public.bdp_fact_loans(npl_classification);
CREATE INDEX idx_bdp_fact_loans_customer ON public.bdp_fact_loans(customer_id);
CREATE INDEX idx_bdp_fact_loans_batch ON public.bdp_fact_loans(batch_id);
CREATE UNIQUE INDEX bdp_fact_loans_unique_key ON public.bdp_fact_loans (snapshot_date, customer_id, cbs_loan_id);

CREATE TABLE public.bdp_fact_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL, agent_id uuid, agent_code text, agent_name text,
  region text DEFAULT 'Addis Ababa',
  cash_in_count integer DEFAULT 0, cash_in_volume numeric DEFAULT 0,
  cash_out_count integer DEFAULT 0, cash_out_volume numeric DEFAULT 0,
  transfer_count integer DEFAULT 0, transfer_volume numeric DEFAULT 0,
  commission_earned numeric DEFAULT 0, float_balance numeric DEFAULT 0,
  aml_flags integer DEFAULT 0, is_active boolean DEFAULT true,
  source_system text DEFAULT 'cbs', batch_id uuid, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_fact_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view agent facts" ON public.bdp_fact_agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert agent facts" ON public.bdp_fact_agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_bdp_fact_agents_date ON public.bdp_fact_agents(report_date);
CREATE INDEX idx_bdp_fact_agents_region ON public.bdp_fact_agents(region);
CREATE INDEX idx_bdp_fact_agents_batch ON public.bdp_fact_agents(batch_id);

CREATE TABLE public.bdp_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL, snapshot_type text NOT NULL DEFAULT 'daily',
  metric_category text NOT NULL, metrics jsonb NOT NULL DEFAULT '{}',
  source_system text DEFAULT 'bdp_engine', batch_id uuid, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view snapshots" ON public.bdp_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert snapshots" ON public.bdp_snapshots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role manages snapshots" ON public.bdp_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_bdp_snapshots_date ON public.bdp_snapshots(snapshot_date);
CREATE INDEX idx_bdp_snapshots_category ON public.bdp_snapshots(metric_category);
CREATE UNIQUE INDEX idx_bdp_snapshots_unique ON public.bdp_snapshots(snapshot_date, snapshot_type, metric_category);

CREATE TABLE public.bdp_ingestion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_system text NOT NULL, entity_type text NOT NULL,
  records_received integer DEFAULT 0, records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0, errors jsonb DEFAULT '[]',
  started_at timestamptz DEFAULT now(), completed_at timestamptz,
  duration_ms integer, status text DEFAULT 'running',
  triggered_by text DEFAULT 'manual', created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bdp_ingestion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ingestion logs" ON public.bdp_ingestion_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ingestion logs" ON public.bdp_ingestion_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ingestion logs" ON public.bdp_ingestion_logs FOR UPDATE TO authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.bdp_fact_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bdp_fact_loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bdp_fact_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bdp_snapshots;

-- =========== 21+22: BDP populate functions ===========
CREATE OR REPLACE FUNCTION public.bdp_sync_customer_dimension()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO bdp_dim_customers (profile_id, full_name, gender, kyc_tier, region, is_active, account_open_date, customer_segment, last_synced_at)
  SELECT p.id,
    COALESCE(NULLIF(TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.father_name,'')),''), p.email, 'Unknown'),
    COALESCE(p.gender, 'unknown'), COALESCE(p.kyc_tier::text, 'basic'),
    COALESCE(p.region, 'Addis Ababa'),
    EXISTS (SELECT 1 FROM accounts a WHERE a.profile_id = p.id AND a.status = 'active'),
    p.created_at::date,
    CASE WHEN EXISTS (SELECT 1 FROM corporate_users cu WHERE cu.profile_id = p.id) THEN 'corporate'
         WHEN EXISTS (SELECT 1 FROM agents ag WHERE ag.profile_id = p.id) THEN 'agent' ELSE 'retail' END,
    now()
  FROM profiles p
  ON CONFLICT (profile_id) WHERE profile_id IS NOT NULL
  DO UPDATE SET full_name = EXCLUDED.full_name, gender = EXCLUDED.gender, kyc_tier = EXCLUDED.kyc_tier,
    region = EXCLUDED.region, is_active = EXCLUDED.is_active, customer_segment = EXCLUDED.customer_segment, last_synced_at = now();
$$;

CREATE OR REPLACE FUNCTION public.bdp_sync_product_dimension()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bdp_dim_products LIMIT 1) THEN
    INSERT INTO bdp_dim_products (product_code, product_name, product_type, product_category, interest_rate) VALUES
      ('LOAN-MICRO','Micro Loan','micro','loan',24.0),
      ('LOAN-PERSONAL','Personal Loan','personal','loan',22.0),
      ('LOAN-BUSINESS','Business Loan','business','loan',20.0),
      ('LOAN-SALARY','Salary Advance','salary_advance','loan',18.0),
      ('LOAN-AGRI','Agricultural Loan','agricultural','loan',15.0),
      ('DEP-SAVINGS','Savings Account','savings','deposit',7.5),
      ('DEP-CURRENT','Current Account','current','deposit',0.0),
      ('DEP-WALLET','Digital Wallet','wallet','deposit',0.0);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.bdp_populate_loan_facts(p_date date)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH loan_dpd AS (
    SELECT l.id AS loan_id, l.profile_id, l.amount, l.outstanding_balance,
      l.interest_rate, l.tenor_months, l.disbursed_at, l.product_type, l.status,
      GREATEST(0, COALESCE(p_date - (SELECT MIN(ls.due_date) FROM loan_schedules ls
        WHERE ls.loan_id = l.id AND ls.status IN ('pending','overdue') AND ls.due_date < p_date), 0)) AS dpd
    FROM loans l WHERE l.status::text IN ('active', 'disbursed', 'defaulted')
  ),
  loan_classified AS (
    SELECT ld.*,
      CASE WHEN dpd <= 30 THEN 'pass' WHEN dpd <= 90 THEN 'special_mention'
           WHEN dpd <= 180 THEN 'substandard' WHEN dpd <= 360 THEN 'doubtful' ELSE 'loss' END AS npl_class,
      CASE WHEN dpd <= 30 THEN 0.01 WHEN dpd <= 90 THEN 0.10
           WHEN dpd <= 180 THEN 0.20 WHEN dpd <= 360 THEN 0.50 ELSE 1.00 END AS prov_rate
    FROM loan_dpd ld
  )
  INSERT INTO bdp_fact_loans (snapshot_date, customer_id, cbs_loan_id, product_id,
    loan_account_number, disbursement_date, maturity_date, disbursed_amount,
    outstanding_principal, outstanding_interest, total_outstanding,
    days_past_due, npl_classification, provision_rate, provision_amount,
    interest_rate, tenor_months, source_system)
  SELECT p_date, dc.id, lc.loan_id::text, dp.id, lc.loan_id::text,
    lc.disbursed_at::date, (lc.disbursed_at + (lc.tenor_months || ' months')::interval)::date,
    lc.amount, COALESCE(lc.outstanding_balance, lc.amount),
    COALESCE(lc.outstanding_balance, lc.amount) * lc.interest_rate / 100.0 / 12.0,
    COALESCE(lc.outstanding_balance, lc.amount) * (1 + lc.interest_rate / 100.0 / 12.0),
    lc.dpd, lc.npl_class, lc.prov_rate,
    COALESCE(lc.outstanding_balance, lc.amount) * lc.prov_rate,
    lc.interest_rate, lc.tenor_months, 'cbs'
  FROM loan_classified lc
  LEFT JOIN bdp_dim_customers dc ON dc.profile_id = lc.profile_id
  LEFT JOIN bdp_dim_products dp ON dp.product_type = lc.product_type::text AND dp.product_category = 'loan'
  ON CONFLICT (snapshot_date, customer_id, cbs_loan_id) DO UPDATE SET
    outstanding_principal = EXCLUDED.outstanding_principal,
    outstanding_interest = EXCLUDED.outstanding_interest,
    total_outstanding = EXCLUDED.total_outstanding,
    days_past_due = EXCLUDED.days_past_due,
    npl_classification = EXCLUDED.npl_classification,
    provision_rate = EXCLUDED.provision_rate,
    provision_amount = EXCLUDED.provision_amount;
$$;

CREATE OR REPLACE FUNCTION public.bdp_populate_transaction_facts(p_date DATE)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO bdp_fact_transactions (transaction_date, customer_id, transaction_type, channel, direction,
    amount, fee, status, source_transaction_id, source_system)
  SELECT p_date, dc.id, t.transaction_type::text,
    CASE t.transaction_type::text
      WHEN 'transfer' THEN 'mobile' WHEN 'bill_payment' THEN 'mobile'
      WHEN 'airtime' THEN 'ussd' WHEN 'deposit' THEN 'agent'
      WHEN 'withdrawal' THEN 'agent' ELSE 'mobile' END,
    t.direction::text, t.amount, COALESCE(t.fee, 0), t.status::text, t.id, 'cbs'
  FROM transactions t LEFT JOIN bdp_dim_customers dc ON dc.profile_id = t.profile_id
  WHERE t.created_at::date = p_date
  ON CONFLICT DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.bdp_compute_snapshots(p_date DATE)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO bdp_snapshots (snapshot_date, snapshot_type, metric_category, metrics)
  SELECT p_date, 'daily', 'balance_sheet',
    jsonb_build_object('gross_loans_etb', COALESCE(SUM(total_outstanding),0), 'loan_count', COUNT(*),
      'required_provision_etb', COALESCE(SUM(provision_amount),0),
      'npl_outstanding_etb', COALESCE(SUM(CASE WHEN npl_classification IN ('substandard','doubtful','loss') THEN total_outstanding ELSE 0 END),0),
      'par30_etb', COALESCE(SUM(CASE WHEN days_past_due > 30 THEN total_outstanding ELSE 0 END),0),
      'par90_etb', COALESCE(SUM(CASE WHEN days_past_due > 90 THEN total_outstanding ELSE 0 END),0),
      'snapshot_generated_at', now()::text, 'schema_version', '1.0')
  FROM bdp_fact_loans WHERE snapshot_date = p_date
  ON CONFLICT (snapshot_date, snapshot_type, metric_category) DO UPDATE SET metrics = EXCLUDED.metrics;

  INSERT INTO bdp_snapshots (snapshot_date, snapshot_type, metric_category, metrics)
  SELECT p_date, 'daily', 'transaction_volume',
    jsonb_build_object('total_count', COUNT(*), 'total_amount', COALESCE(SUM(amount),0), 'total_fees', COALESCE(SUM(fee),0),
      'credit_count', COUNT(*) FILTER (WHERE direction='credit'), 'credit_amount', COALESCE(SUM(amount) FILTER (WHERE direction='credit'),0),
      'debit_count', COUNT(*) FILTER (WHERE direction='debit'), 'debit_amount', COALESCE(SUM(amount) FILTER (WHERE direction='debit'),0),
      'schema_version', '1.0')
  FROM bdp_fact_transactions WHERE transaction_date = p_date
  ON CONFLICT (snapshot_date, snapshot_type, metric_category) DO UPDATE SET metrics = EXCLUDED.metrics;

  INSERT INTO bdp_snapshots (snapshot_date, snapshot_type, metric_category, metrics)
  SELECT p_date, 'daily', 'liquidity',
    jsonb_build_object('total_deposits', COALESCE(SUM(balance) FILTER (WHERE account_type IN ('savings','current')),0),
      'savings_deposits', COALESCE(SUM(balance) FILTER (WHERE account_type='savings'),0),
      'wallet_balances', COALESCE(SUM(balance) FILTER (WHERE account_type='wallet'),0),
      'total_accounts', COUNT(*), 'active_accounts', COUNT(*) FILTER (WHERE status='active'),
      'schema_version', '1.0')
  FROM accounts
  ON CONFLICT (snapshot_date, snapshot_type, metric_category) DO UPDATE SET metrics = EXCLUDED.metrics;

  INSERT INTO bdp_snapshots (snapshot_date, snapshot_type, metric_category, metrics)
  SELECT p_date, 'daily', 'agent_network',
    jsonb_build_object('total_agents', COUNT(*), 'active_agents', COUNT(*) FILTER (WHERE status='active'),
      'total_float', COALESCE(SUM(float_balance),0),
      'super_agents', COUNT(*) FILTER (WHERE agent_category='super_agent'),
      'agents', COUNT(*) FILTER (WHERE agent_category='agent'),
      'sub_agents', COUNT(*) FILTER (WHERE agent_category='sub_agent'),
      'schema_version', '1.0')
  FROM agents
  ON CONFLICT (snapshot_date, snapshot_type, metric_category) DO UPDATE SET metrics = EXCLUDED.metrics;
END; $$;

-- =========== 23: KYC enhancements & tier limits ===========
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Ethiopian',
  ADD COLUMN IF NOT EXISTS place_of_birth_region TEXT,
  ADD COLUMN IF NOT EXISTS is_foreign_national BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_of_funds TEXT,
  ADD COLUMN IF NOT EXISTS employer_name TEXT,
  ADD COLUMN IF NOT EXISTS msisdn_verified BOOLEAN DEFAULT false;

ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'pending_review' AFTER 'pending';
ALTER TYPE public.consent_type ADD VALUE IF NOT EXISTS 'biometric_data';
ALTER TYPE public.consent_type ADD VALUE IF NOT EXISTS 'credit_bureau';

ALTER TABLE public.kyc_documents
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS issue_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_documents_unique_doc_number
  ON public.kyc_documents (document_number)
  WHERE document_number IS NOT NULL AND status != 'rejected';

CREATE OR REPLACE FUNCTION public.get_tier_limits(p_tier text)
RETURNS TABLE(daily_limit numeric, monthly_limit numeric, balance_ceiling numeric, cashout_per_txn numeric)
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE p_tier WHEN 'simplified' THEN 5000::numeric WHEN 'pending_review' THEN 5000::numeric
      WHEN 'full' THEN 50000::numeric WHEN 'premium' THEN 200000::numeric ELSE 5000::numeric END,
    CASE p_tier WHEN 'simplified' THEN 30000::numeric WHEN 'pending_review' THEN 30000::numeric
      WHEN 'full' THEN 500000::numeric WHEN 'premium' THEN 2000000::numeric ELSE 30000::numeric END,
    CASE p_tier WHEN 'simplified' THEN 10000::numeric WHEN 'pending_review' THEN 10000::numeric
      WHEN 'full' THEN 50000::numeric WHEN 'premium' THEN -1::numeric ELSE 10000::numeric END,
    CASE p_tier WHEN 'simplified' THEN 5000::numeric WHEN 'pending_review' THEN 5000::numeric
      WHEN 'full' THEN 25000::numeric WHEN 'premium' THEN 100000::numeric ELSE 5000::numeric END;
$$;

CREATE OR REPLACE FUNCTION public.set_account_limits_for_tier(p_profile_id uuid, p_tier text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limits RECORD;
BEGIN
  SELECT * INTO v_limits FROM get_tier_limits(p_tier);
  UPDATE accounts SET daily_limit = v_limits.daily_limit, monthly_limit = v_limits.monthly_limit
  WHERE profile_id = p_profile_id;
END; $$;

CREATE OR REPLACE FUNCTION public.check_daily_allowance(p_profile_id uuid, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tier text; v_limits RECORD; v_today_total numeric;
BEGIN
  SELECT kyc_tier::text INTO v_tier FROM profiles WHERE id = p_profile_id;
  SELECT * INTO v_limits FROM get_tier_limits(COALESCE(v_tier, 'pending'));
  SELECT COALESCE(SUM(amount), 0) INTO v_today_total FROM transactions
   WHERE profile_id = p_profile_id AND direction = 'debit' AND status = 'completed' AND created_at::date = CURRENT_DATE;
  IF (v_today_total + p_amount) > v_limits.daily_limit THEN
    RETURN jsonb_build_object('allowed', false,
      'reason', 'Daily transaction limit of ' || v_limits.daily_limit || ' ETB exceeded. Already transacted: ' || v_today_total || ' ETB today.',
      'remaining', GREATEST(0, v_limits.daily_limit - v_today_total));
  END IF;
  RETURN jsonb_build_object('allowed', true, 'remaining', v_limits.daily_limit - v_today_total - p_amount);
END; $$;

CREATE OR REPLACE FUNCTION public.process_transfer(p_from_account_id uuid, p_to_msisdn text, p_amount numeric, p_fee numeric DEFAULT 0, p_description text DEFAULT 'Transfer'::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_from_account RECORD; v_to_account RECORD; v_txn_ref TEXT; v_allowance jsonb;
BEGIN
  SELECT * INTO v_from_account FROM accounts WHERE id = p_from_account_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Sender account not found'); END IF;
  v_allowance := check_daily_allowance(v_from_account.profile_id, p_amount + p_fee);
  IF NOT (v_allowance->>'allowed')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_allowance->>'reason');
  END IF;
  IF v_from_account.available_balance < (p_amount + p_fee) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  SELECT a.* INTO v_to_account FROM accounts a JOIN profiles p ON a.profile_id = p.id
   WHERE p.msisdn = p_to_msisdn AND a.is_primary = true FOR UPDATE;
  UPDATE accounts SET balance = balance - (p_amount + p_fee), available_balance = available_balance - (p_amount + p_fee) WHERE id = p_from_account_id;
  v_txn_ref := 'TXN-' || substr(gen_random_uuid()::text, 1, 12);
  INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description, recipient_msisdn)
  VALUES (p_from_account_id, v_from_account.profile_id, 'transfer', p_amount, p_fee, 'debit', 'completed', v_txn_ref, p_description, p_to_msisdn);
  IF v_to_account.id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + p_amount, available_balance = available_balance + p_amount WHERE id = v_to_account.id;
    INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description)
    VALUES (v_to_account.id, v_to_account.profile_id, 'transfer', p_amount, 0, 'credit', 'completed', 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Received from transfer');
  END IF;
  RETURN jsonb_build_object('success', true, 'reference', v_txn_ref, 'new_balance', v_from_account.available_balance - (p_amount + p_fee));
END; $$;

CREATE OR REPLACE FUNCTION public.process_bill_payment(p_account_id uuid, p_biller_name text, p_biller_account text, p_amount numeric, p_fee numeric DEFAULT 5)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_account RECORD; v_txn_ref TEXT; v_allowance jsonb;
BEGIN
  SELECT * INTO v_account FROM accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Account not found'); END IF;
  v_allowance := check_daily_allowance(v_account.profile_id, p_amount + p_fee);
  IF NOT (v_allowance->>'allowed')::boolean THEN RETURN jsonb_build_object('success', false, 'error', v_allowance->>'reason'); END IF;
  IF v_account.available_balance < (p_amount + p_fee) THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  UPDATE accounts SET balance = balance - (p_amount + p_fee), available_balance = available_balance - (p_amount + p_fee) WHERE id = p_account_id;
  v_txn_ref := 'TXN-' || substr(gen_random_uuid()::text, 1, 12);
  INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description, recipient_name, recipient_account)
  VALUES (p_account_id, v_account.profile_id, 'bill_payment', p_amount, p_fee, 'debit', 'completed', v_txn_ref, 'Bill payment to ' || p_biller_name, p_biller_name, p_biller_account);
  RETURN jsonb_build_object('success', true, 'reference', v_txn_ref, 'new_balance', v_account.available_balance - (p_amount + p_fee));
END; $$;

CREATE OR REPLACE FUNCTION public.process_airtime_purchase(p_account_id uuid, p_phone text, p_amount numeric, p_operator text DEFAULT 'Ethio Telecom'::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_account RECORD; v_txn_ref TEXT; v_allowance jsonb;
BEGIN
  SELECT * INTO v_account FROM accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Account not found'); END IF;
  v_allowance := check_daily_allowance(v_account.profile_id, p_amount);
  IF NOT (v_allowance->>'allowed')::boolean THEN RETURN jsonb_build_object('success', false, 'error', v_allowance->>'reason'); END IF;
  IF v_account.available_balance < p_amount THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  UPDATE accounts SET balance = balance - p_amount, available_balance = available_balance - p_amount WHERE id = p_account_id;
  v_txn_ref := 'TXN-' || substr(gen_random_uuid()::text, 1, 12);
  INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description, recipient_msisdn)
  VALUES (p_account_id, v_account.profile_id, 'airtime', p_amount, 0, 'debit', 'completed', v_txn_ref, p_operator || ' airtime for ' || p_phone, p_phone);
  RETURN jsonb_build_object('success', true, 'reference', v_txn_ref, 'new_balance', v_account.available_balance - p_amount);
END; $$;

CREATE OR REPLACE FUNCTION public.approve_kyc_document(p_doc_id uuid, p_admin_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_doc RECORD;
BEGIN
  SELECT * INTO v_doc FROM kyc_documents WHERE id = p_doc_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Document not found'); END IF;
  IF v_doc.expiry_date IS NOT NULL AND v_doc.expiry_date < CURRENT_DATE THEN
    UPDATE kyc_documents SET status = 'rejected', rejection_reason = 'Document expired', verified_by = p_admin_id, verified_at = now() WHERE id = p_doc_id;
    RETURN jsonb_build_object('success', false, 'error', 'Document has expired on ' || v_doc.expiry_date);
  END IF;
  UPDATE kyc_documents SET status = 'verified', verified_by = p_admin_id, verified_at = now() WHERE id = p_doc_id;
  RETURN jsonb_build_object('success', true, 'profile_id', v_doc.profile_id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_kyc_document(p_doc_id uuid, p_admin_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_doc RECORD;
BEGIN
  SELECT * INTO v_doc FROM kyc_documents WHERE id = p_doc_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Document not found'); END IF;
  UPDATE kyc_documents SET status = 'rejected', rejection_reason = p_reason, verified_by = p_admin_id, verified_at = now() WHERE id = p_doc_id;
  RETURN jsonb_build_object('success', true, 'profile_id', v_doc.profile_id);
END; $$;

-- =========== 24: admin KYC view ===========
CREATE POLICY "Admins can view all KYC docs" ON public.kyc_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- =========== 25: custom integration definitions ===========
CREATE TABLE public.custom_integration_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_type text NOT NULL CHECK (definition_type IN ('category', 'service')),
  slug text NOT NULL, name text NOT NULL, description text,
  icon text DEFAULT '🔌', color text DEFAULT '#185FA5',
  category_id text, config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (definition_type, slug)
);
ALTER TABLE public.custom_integration_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view custom definitions" ON public.custom_integration_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert custom definitions" ON public.custom_integration_definitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update custom definitions" ON public.custom_integration_definitions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete custom definitions" ON public.custom_integration_definitions FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_custom_integration_definitions_updated_at BEFORE UPDATE ON public.custom_integration_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== 26: Retry queue / Circuit breaker / Rate limits ===========
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.integration_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  endpoint text NOT NULL, method text NOT NULL DEFAULT 'POST',
  request_headers jsonb DEFAULT '{}', request_body jsonb,
  response_status int, response_body jsonb, error_message text,
  attempt_count int NOT NULL DEFAULT 0, max_retries int NOT NULL DEFAULT 5,
  next_retry_at timestamptz NOT NULL DEFAULT now(), last_attempted_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','dead_letter','cancelled')),
  source_type text, source_reference text,
  created_at timestamptz DEFAULT now(), completed_at timestamptz, dead_lettered_at timestamptz
);
CREATE INDEX idx_retry_queue_status_next ON public.integration_retry_queue(status, next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_retry_queue_integration ON public.integration_retry_queue(integration_id);
CREATE INDEX idx_retry_queue_dead_letter ON public.integration_retry_queue(status) WHERE status = 'dead_letter';
CREATE UNIQUE INDEX idx_retry_queue_source ON public.integration_retry_queue(integration_id, source_type, source_reference) WHERE status IN ('pending','processing');
ALTER TABLE public.integration_retry_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage retry queue" ON public.integration_retry_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.integration_circuit_breaker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE UNIQUE,
  state text NOT NULL DEFAULT 'closed' CHECK (state IN ('closed','open','half_open')),
  failure_count int NOT NULL DEFAULT 0, failure_threshold int NOT NULL DEFAULT 5,
  success_count_since_half_open int NOT NULL DEFAULT 0, success_threshold int NOT NULL DEFAULT 3,
  last_failure_at timestamptz, last_success_at timestamptz, opened_at timestamptz,
  cooldown_seconds int NOT NULL DEFAULT 60, last_state_change_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.integration_circuit_breaker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage circuit breaker" ON public.integration_circuit_breaker FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.integration_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL, request_count int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (integration_id, window_start)
);
ALTER TABLE public.integration_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage rate limits" ON public.integration_rate_limits FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.audit_integration_config_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_field text; v_old_val text; v_new_val text;
  v_fields text[] := ARRAY['base_url','api_key','api_secret','auth_token','oauth_client_id','oauth_client_secret','oauth_token_url','environment','is_active','custom_headers','extra_params'];
BEGIN
  FOREACH v_field IN ARRAY v_fields LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', v_field, v_field) INTO v_old_val, v_new_val USING OLD, NEW;
    IF v_old_val IS DISTINCT FROM v_new_val THEN
      INSERT INTO integration_audit_logs (integration_id, action, field_changed, old_value, new_value, performed_by)
      VALUES (NEW.integration_id,
        CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN TG_OP = 'UPDATE' THEN 'updated' ELSE 'deleted' END,
        v_field,
        CASE WHEN v_field IN ('api_key','api_secret','auth_token','oauth_client_secret') THEN '***REDACTED***' ELSE v_old_val END,
        CASE WHEN v_field IN ('api_key','api_secret','auth_token','oauth_client_secret') THEN '***REDACTED***' ELSE v_new_val END,
        auth.uid()::text);
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_audit_integration_configs AFTER INSERT OR UPDATE ON public.integration_configs FOR EACH ROW EXECUTE FUNCTION public.audit_integration_config_changes();

CREATE OR REPLACE FUNCTION public.record_integration_failure(p_integration_id uuid, p_error text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_cb RECORD; v_new_state text;
BEGIN
  INSERT INTO integration_circuit_breaker (integration_id) VALUES (p_integration_id) ON CONFLICT (integration_id) DO NOTHING;
  SELECT * INTO v_cb FROM integration_circuit_breaker WHERE integration_id = p_integration_id FOR UPDATE;
  v_cb.failure_count := v_cb.failure_count + 1;
  IF v_cb.state = 'closed' AND v_cb.failure_count >= v_cb.failure_threshold THEN v_new_state := 'open';
  ELSIF v_cb.state = 'half_open' THEN v_new_state := 'open';
  ELSE v_new_state := v_cb.state; END IF;
  UPDATE integration_circuit_breaker SET failure_count = v_cb.failure_count, last_failure_at = now(), state = v_new_state,
    opened_at = CASE WHEN v_new_state = 'open' AND v_cb.state != 'open' THEN now() ELSE opened_at END,
    success_count_since_half_open = CASE WHEN v_new_state = 'open' THEN 0 ELSE success_count_since_half_open END,
    last_state_change_at = CASE WHEN v_new_state != v_cb.state THEN now() ELSE last_state_change_at END,
    updated_at = now() WHERE integration_id = p_integration_id;
  UPDATE integrations SET health_status = CASE WHEN v_new_state = 'open' THEN 'down' ELSE 'degraded' END, last_health_check = now() WHERE id = p_integration_id;
  RETURN jsonb_build_object('state', v_new_state, 'failure_count', v_cb.failure_count, 'tripped', v_new_state = 'open' AND v_cb.state != 'open');
END; $$;

CREATE OR REPLACE FUNCTION public.record_integration_success(p_integration_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_cb RECORD; v_new_state text;
BEGIN
  INSERT INTO integration_circuit_breaker (integration_id) VALUES (p_integration_id) ON CONFLICT (integration_id) DO NOTHING;
  SELECT * INTO v_cb FROM integration_circuit_breaker WHERE integration_id = p_integration_id FOR UPDATE;
  IF v_cb.state = 'half_open' THEN
    v_cb.success_count_since_half_open := v_cb.success_count_since_half_open + 1;
    IF v_cb.success_count_since_half_open >= v_cb.success_threshold THEN v_new_state := 'closed';
    ELSE v_new_state := 'half_open'; END IF;
  ELSE v_new_state := 'closed'; END IF;
  UPDATE integration_circuit_breaker SET state = v_new_state,
    failure_count = CASE WHEN v_new_state = 'closed' THEN 0 ELSE failure_count END,
    success_count_since_half_open = CASE WHEN v_new_state = 'closed' THEN 0 ELSE v_cb.success_count_since_half_open END,
    last_success_at = now(),
    last_state_change_at = CASE WHEN v_new_state != v_cb.state THEN now() ELSE last_state_change_at END,
    updated_at = now() WHERE integration_id = p_integration_id;
  UPDATE integrations SET health_status = 'healthy', last_health_check = now() WHERE id = p_integration_id;
  RETURN jsonb_build_object('state', v_new_state, 'recovered', v_new_state = 'closed' AND v_cb.state != 'closed');
END; $$;

CREATE OR REPLACE FUNCTION public.check_integration_rate_limit(p_integration_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_limit int; v_current_count int; v_window_start timestamptz;
BEGIN
  SELECT rate_limit_per_minute INTO v_limit FROM integrations WHERE id = p_integration_id;
  IF v_limit IS NULL OR v_limit <= 0 THEN RETURN jsonb_build_object('allowed', true, 'limit', -1, 'remaining', -1); END IF;
  v_window_start := date_trunc('minute', now());
  INSERT INTO integration_rate_limits (integration_id, window_start, request_count) VALUES (p_integration_id, v_window_start, 1)
  ON CONFLICT (integration_id, window_start) DO UPDATE SET request_count = integration_rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  IF v_current_count > v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'limit', v_limit, 'current', v_current_count, 'retry_after_seconds', 60 - EXTRACT(SECOND FROM now())::int);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'limit', v_limit, 'remaining', v_limit - v_current_count);
END; $$;

-- =========== 27: Accounting periods + GL bug fix + journal entries ===========
CREATE TABLE public.accounting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name text NOT NULL, period_start date NOT NULL, period_end date NOT NULL,
  is_locked boolean NOT NULL DEFAULT false, locked_at timestamptz, locked_by uuid,
  fiscal_year integer NOT NULL, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (period_start, period_end)
);
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view accounting periods" ON public.accounting_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage accounting periods" ON public.accounting_periods FOR ALL TO authenticated USING (true) WITH CHECK (true);
INSERT INTO accounting_periods (period_name, period_start, period_end, fiscal_year) VALUES
  ('July 2025', '2025-07-01', '2025-07-31', 2025), ('August 2025', '2025-08-01', '2025-08-31', 2025),
  ('September 2025', '2025-09-01', '2025-09-30', 2025), ('October 2025', '2025-10-01', '2025-10-31', 2025),
  ('November 2025', '2025-11-01', '2025-11-30', 2025), ('December 2025', '2025-12-01', '2025-12-31', 2025),
  ('January 2026', '2026-01-01', '2026-01-31', 2026), ('February 2026', '2026-02-01', '2026-02-28', 2026),
  ('March 2026', '2026-03-01', '2026-03-31', 2026), ('April 2026', '2026-04-01', '2026-04-30', 2026),
  ('May 2026', '2026-05-01', '2026-05-31', 2026), ('June 2026', '2026-06-01', '2026-06-30', 2026)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.auto_post_gl_entries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_mapping RECORD; v_period_locked boolean;
BEGIN
  SELECT is_locked INTO v_period_locked FROM accounting_periods
   WHERE period_start <= NEW.created_at::date AND period_end >= NEW.created_at::date LIMIT 1;
  IF v_period_locked IS TRUE THEN RAISE EXCEPTION 'Cannot post to locked accounting period containing %', NEW.created_at::date; END IF;
  SELECT * INTO v_mapping FROM gl_mappings WHERE transaction_type = NEW.transaction_type::text AND direction = NEW.direction::text AND is_active = true LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;
  INSERT INTO gl_entries (debit_account_id, credit_account_id, amount, source_transaction_id, source_type, profile_id, narrative)
  VALUES (v_mapping.debit_gl_id, v_mapping.credit_gl_id, NEW.amount, NEW.id, NEW.transaction_type::text, NEW.profile_id,
    COALESCE(NEW.description, NEW.transaction_type::text || ' - ' || NEW.reference));
  UPDATE chart_of_accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = v_mapping.debit_gl_id;
  UPDATE chart_of_accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = v_mapping.credit_gl_id;
  IF COALESCE(NEW.fee, 0) > 0 AND v_mapping.fee_gl_id IS NOT NULL THEN
    INSERT INTO gl_entries (debit_account_id, credit_account_id, amount, source_transaction_id, source_type, profile_id, narrative)
    VALUES (v_mapping.debit_gl_id, v_mapping.fee_gl_id, NEW.fee, NEW.id, 'fee', NEW.profile_id, 'Fee for ' || NEW.transaction_type::text || ' - ' || NEW.reference);
    UPDATE chart_of_accounts SET balance = balance + NEW.fee, updated_at = now() WHERE id = v_mapping.debit_gl_id;
    UPDATE chart_of_accounts SET balance = balance - NEW.fee, updated_at = now() WHERE id = v_mapping.fee_gl_id;
  END IF;
  RETURN NEW;
END; $function$;

CREATE TRIGGER trg_auto_post_gl_entries AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.auto_post_gl_entries();

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_number text NOT NULL DEFAULT 'JV-' || substr(gen_random_uuid()::text, 1, 8),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  debit_account_id uuid NOT NULL REFERENCES chart_of_accounts(id),
  credit_account_id uuid NOT NULL REFERENCES chart_of_accounts(id),
  amount numeric NOT NULL CHECK (amount > 0),
  narrative text NOT NULL, journal_type text NOT NULL DEFAULT 'adjustment',
  reference text, posted_by uuid, is_reversal boolean DEFAULT false,
  reversed_entry_id uuid REFERENCES gl_entries(id),
  status text NOT NULL DEFAULT 'posted',
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view journal entries" ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create journal entries" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE VIEW public.v_trial_balance AS
SELECT c.id, c.gl_code, c.name, c.account_type, c.parent_id,
  CASE WHEN c.account_type IN ('asset', 'expense') THEN c.balance ELSE 0 END AS debit_balance,
  CASE WHEN c.account_type IN ('liability', 'income', 'equity') THEN ABS(c.balance) ELSE 0 END AS credit_balance,
  c.balance AS net_balance, c.status
FROM chart_of_accounts c
WHERE c.status = 'active' AND NOT EXISTS (SELECT 1 FROM chart_of_accounts child WHERE child.parent_id = c.id)
ORDER BY c.gl_code;

CREATE OR REPLACE FUNCTION public.guard_gl_entry_period_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_locked boolean;
BEGIN
  SELECT is_locked INTO v_locked FROM accounting_periods WHERE period_start <= NEW.entry_date AND period_end >= NEW.entry_date LIMIT 1;
  IF v_locked IS TRUE THEN RAISE EXCEPTION 'Cannot post GL entry to locked period containing date %', NEW.entry_date; END IF;
  RETURN NEW;
END; $function$;
CREATE TRIGGER guard_gl_entry_period BEFORE INSERT ON gl_entries FOR EACH ROW EXECUTE FUNCTION guard_gl_entry_period_lock();

-- =========== 28: AML alerts / STR / CTR / screening ===========
CREATE TABLE public.aml_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL, severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  profile_id uuid, transaction_id uuid, agent_id uuid,
  amount numeric, threshold_breached text,
  screening_result jsonb DEFAULT '{}'::jsonb,
  description text, assigned_to uuid, reviewed_by uuid, reviewed_at timestamptz,
  review_decision text, review_rationale text,
  escalated_at timestamptz, resolved_at timestamptz,
  auto_generated boolean DEFAULT true, metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.aml_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view aml_alerts" ON public.aml_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update aml_alerts" ON public.aml_alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "System can insert aml_alerts" ON public.aml_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_aml_alerts_status ON public.aml_alerts(status);
CREATE INDEX idx_aml_alerts_type ON public.aml_alerts(alert_type);
CREATE INDEX idx_aml_alerts_profile ON public.aml_alerts(profile_id);
CREATE INDEX idx_aml_alerts_created ON public.aml_alerts(created_at DESC);

CREATE TABLE public.aml_str_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.aml_alerts(id),
  profile_id uuid, filing_status text NOT NULL DEFAULT 'draft',
  fic_reference text, filing_date date, submission_deadline timestamptz,
  narrative text, suspicious_indicators jsonb DEFAULT '[]'::jsonb,
  transaction_summary jsonb DEFAULT '{}'::jsonb,
  customer_info jsonb DEFAULT '{}'::jsonb,
  filed_by uuid, approved_by uuid, approved_at timestamptz,
  submitted_at timestamptz, fic_acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.aml_str_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage str_filings" ON public.aml_str_filings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.aml_ctr_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid, report_date date NOT NULL,
  total_amount numeric NOT NULL, transaction_count int NOT NULL DEFAULT 0,
  transaction_ids uuid[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  fic_reference text, reviewed_by uuid, reviewed_at timestamptz,
  submitted_at timestamptz,
  customer_info jsonb DEFAULT '{}'::jsonb, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.aml_ctr_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage ctr_reports" ON public.aml_ctr_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_aml_ctr_date ON public.aml_ctr_reports(report_date);
CREATE INDEX idx_aml_ctr_profile ON public.aml_ctr_reports(profile_id);

CREATE TABLE public.aml_screening_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_type text NOT NULL, profile_id uuid, transaction_id uuid,
  provider text DEFAULT 'internal',
  request_payload jsonb, response_payload jsonb,
  match_found boolean DEFAULT false, match_score numeric,
  screening_lists text[] DEFAULT '{}', latency_ms int,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.aml_screening_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view screening_log" ON public.aml_screening_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert screening_log" ON public.aml_screening_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.aml_check_transaction_thresholds()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_daily_total numeric; v_customer_name text;
BEGIN
  IF NEW.amount >= 50000 THEN
    SELECT COALESCE(first_name || ' ' || father_name, email, 'Unknown') INTO v_customer_name FROM profiles WHERE id = NEW.profile_id;
    INSERT INTO aml_alerts (alert_type, severity, profile_id, transaction_id, amount, threshold_breached, description)
    VALUES ('transaction_threshold',
      CASE WHEN NEW.amount >= 500000 THEN 'critical' WHEN NEW.amount >= 200000 THEN 'high' ELSE 'medium' END,
      NEW.profile_id, NEW.id, NEW.amount,
      CASE WHEN NEW.amount >= 500000 THEN 'mandatory_ctr' ELSE 'enhanced_scrutiny' END,
      'Transaction of ' || NEW.amount || ' ETB by ' || v_customer_name || ' exceeds ' ||
        CASE WHEN NEW.amount >= 500000 THEN 'CTR threshold (ETB 500,000)' ELSE 'enhanced scrutiny threshold (ETB 50,000)' END);
  END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total FROM transactions
   WHERE profile_id = NEW.profile_id AND created_at::date = CURRENT_DATE AND status = 'completed';
  IF v_daily_total >= 500000 THEN
    IF NOT EXISTS (SELECT 1 FROM aml_ctr_reports WHERE profile_id = NEW.profile_id AND report_date = CURRENT_DATE) THEN
      SELECT COALESCE(first_name || ' ' || father_name, email, 'Unknown') INTO v_customer_name FROM profiles WHERE id = NEW.profile_id;
      INSERT INTO aml_ctr_reports (profile_id, report_date, total_amount, transaction_count, customer_info)
      VALUES (NEW.profile_id, CURRENT_DATE, v_daily_total,
        (SELECT COUNT(*) FROM transactions WHERE profile_id = NEW.profile_id AND created_at::date = CURRENT_DATE AND status = 'completed'),
        jsonb_build_object('name', v_customer_name, 'profile_id', NEW.profile_id));
      INSERT INTO aml_alerts (alert_type, severity, profile_id, amount, threshold_breached, description)
      VALUES ('ctr_trigger', 'critical', NEW.profile_id, v_daily_total, 'mandatory_ctr',
        'Daily aggregated transactions of ' || v_daily_total || ' ETB by ' || v_customer_name || ' exceed CTR threshold (ETB 500,000). CTR auto-generated.');
    ELSE
      UPDATE aml_ctr_reports SET total_amount = v_daily_total,
        transaction_count = (SELECT COUNT(*) FROM transactions WHERE profile_id = NEW.profile_id AND created_at::date = CURRENT_DATE AND status = 'completed'),
        updated_at = now() WHERE profile_id = NEW.profile_id AND report_date = CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_aml_transaction_monitor AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.aml_check_transaction_thresholds();

CREATE TRIGGER update_aml_alerts_updated_at BEFORE UPDATE ON public.aml_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_aml_str_updated_at BEFORE UPDATE ON public.aml_str_filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_aml_ctr_updated_at BEFORE UPDATE ON public.aml_ctr_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== 29: savings_goals + approval RLS + transaction limit trigger ===========
CREATE POLICY "Corporate users can update approval requests"
ON public.approval_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.corporate_users
    WHERE corporate_users.profile_id = auth.uid()
      AND corporate_users.is_active = true
      AND corporate_users.role IN ('checker', 'approver', 'corporate_admin')));

CREATE TABLE public.user_savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  goal_name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  target_date date, category text DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own savings goals" ON public.user_savings_goals FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own savings goals" ON public.user_savings_goals FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own savings goals" ON public.user_savings_goals FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own savings goals" ON public.user_savings_goals FOR DELETE USING (auth.uid() = profile_id);

CREATE OR REPLACE FUNCTION public.validate_transaction_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_account RECORD; v_daily_total numeric; v_monthly_total numeric;
BEGIN
  IF NEW.direction != 'debit' THEN RETURN NEW; END IF;
  SELECT daily_limit, monthly_limit INTO v_account FROM accounts WHERE id = NEW.account_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total FROM transactions
   WHERE account_id = NEW.account_id AND direction = 'debit' AND status = 'completed' AND created_at::date = CURRENT_DATE;
  IF (v_daily_total + NEW.amount) > COALESCE(v_account.daily_limit, 50000) THEN
    RAISE EXCEPTION 'Daily transaction limit of % ETB exceeded. Today''s total: % ETB', v_account.daily_limit, v_daily_total;
  END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_total FROM transactions
   WHERE account_id = NEW.account_id AND direction = 'debit' AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE);
  IF (v_monthly_total + NEW.amount) > COALESCE(v_account.monthly_limit, 500000) THEN
    RAISE EXCEPTION 'Monthly transaction limit of % ETB exceeded. This month''s total: % ETB', v_account.monthly_limit, v_monthly_total;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_transaction_limits BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_limits();