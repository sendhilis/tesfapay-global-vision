
-- ============================================================
-- 1. Role infrastructure (separate user_roles table + has_role)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','staff','compliance','support','analyst');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','staff','compliance','support','analyst')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- ============================================================
-- 2. profiles — replace blanket "admins" policy with real check
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- 3. kyc_documents
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all KYC docs" ON public.kyc_documents;
CREATE POLICY "Compliance can view all KYC docs" ON public.kyc_documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 4. agents — restrict SELECT to own profile, parent agent, or staff
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view all agents" ON public.agents;
CREATE POLICY "Agents view own or staff" ON public.agents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = profile_id
    OR public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agents p WHERE p.id = agents.parent_agent_id AND p.profile_id = auth.uid())
  );

-- ============================================================
-- 5. agent_transactions — scope to owning agent or staff
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view agent transactions" ON public.agent_transactions;
DROP POLICY IF EXISTS "Authenticated can insert agent transactions" ON public.agent_transactions;
CREATE POLICY "Agent transactions: owner or staff read" ON public.agent_transactions
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_transactions.agent_id AND a.profile_id = auth.uid())
    OR customer_profile_id = auth.uid()
  );
CREATE POLICY "Agent transactions: agent inserts own" ON public.agent_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_transactions.agent_id AND a.profile_id = auth.uid())
  );

-- ============================================================
-- 6. agent_float_requests
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view float requests" ON public.agent_float_requests;
DROP POLICY IF EXISTS "Authenticated can insert float requests" ON public.agent_float_requests;
DROP POLICY IF EXISTS "Authenticated can update float requests" ON public.agent_float_requests;
CREATE POLICY "Float requests: party or staff read" ON public.agent_float_requests
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_float_requests.requesting_agent_id AND a.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_float_requests.providing_agent_id AND a.profile_id = auth.uid())
  );
CREATE POLICY "Float requests: requester inserts" ON public.agent_float_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_float_requests.requesting_agent_id AND a.profile_id = auth.uid())
  );
CREATE POLICY "Float requests: provider or staff updates" ON public.agent_float_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_float_requests.providing_agent_id AND a.profile_id = auth.uid())
  );

-- ============================================================
-- 7. AML tables — compliance/admin only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view aml_alerts" ON public.aml_alerts;
DROP POLICY IF EXISTS "Authenticated users can update aml_alerts" ON public.aml_alerts;
DROP POLICY IF EXISTS "System can insert aml_alerts" ON public.aml_alerts;
CREATE POLICY "Compliance manages aml_alerts" ON public.aml_alerts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated users can manage ctr_reports" ON public.aml_ctr_reports;
CREATE POLICY "Compliance manages ctr_reports" ON public.aml_ctr_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated users can manage str_filings" ON public.aml_str_filings;
CREATE POLICY "Compliance manages str_filings" ON public.aml_str_filings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated users can view screening_log" ON public.aml_screening_log;
DROP POLICY IF EXISTS "System can insert screening_log" ON public.aml_screening_log;
CREATE POLICY "Compliance reads screening_log" ON public.aml_screening_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'admin'));
-- writes done by service_role / edge functions

-- ============================================================
-- 8. bank_configs — public read OK, writes admin only
-- ============================================================
DROP POLICY IF EXISTS "Public can insert bank configs" ON public.bank_configs;
DROP POLICY IF EXISTS "Public can update bank configs" ON public.bank_configs;
CREATE POLICY "Admins insert bank configs" ON public.bank_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update bank configs" ON public.bank_configs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 9. BDP analytics tables — analyst/admin only
-- ============================================================
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bdp_dim_customers','bdp_fact_transactions','bdp_fact_loans','bdp_fact_agents','bdp_snapshots','bdp_ingestion_logs']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can view %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %I" ON public.%I', t, t);
  END LOOP;
END $$;

-- Use explicit drops by actual names captured earlier:
DROP POLICY IF EXISTS "Authenticated can view customer dim" ON public.bdp_dim_customers;
DROP POLICY IF EXISTS "Authenticated can insert customer dim" ON public.bdp_dim_customers;
DROP POLICY IF EXISTS "Authenticated can view txn facts" ON public.bdp_fact_transactions;
DROP POLICY IF EXISTS "Authenticated can insert txn facts" ON public.bdp_fact_transactions;
DROP POLICY IF EXISTS "Authenticated can view loan facts" ON public.bdp_fact_loans;
DROP POLICY IF EXISTS "Authenticated can insert loan facts" ON public.bdp_fact_loans;
DROP POLICY IF EXISTS "Authenticated can view agent facts" ON public.bdp_fact_agents;
DROP POLICY IF EXISTS "Authenticated can insert agent facts" ON public.bdp_fact_agents;
DROP POLICY IF EXISTS "Authenticated can view snapshots" ON public.bdp_snapshots;
DROP POLICY IF EXISTS "Authenticated can insert snapshots" ON public.bdp_snapshots;
DROP POLICY IF EXISTS "Authenticated can view ingestion logs" ON public.bdp_ingestion_logs;
DROP POLICY IF EXISTS "Authenticated can insert ingestion logs" ON public.bdp_ingestion_logs;
DROP POLICY IF EXISTS "Authenticated can update ingestion logs" ON public.bdp_ingestion_logs;

CREATE POLICY "Analysts read bdp_dim_customers" ON public.bdp_dim_customers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'analyst') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Analysts read bdp_fact_transactions" ON public.bdp_fact_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'analyst') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Analysts read bdp_fact_loans" ON public.bdp_fact_loans
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'analyst') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Analysts read bdp_fact_agents" ON public.bdp_fact_agents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'analyst') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Analysts read bdp_snapshots" ON public.bdp_snapshots
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'analyst') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Analysts read bdp_ingestion_logs" ON public.bdp_ingestion_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'analyst') OR public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 10. corporate_entities — scope to members or staff
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view corporate entities" ON public.corporate_entities;
DROP POLICY IF EXISTS "Authenticated can insert corporate entities" ON public.corporate_entities;
DROP POLICY IF EXISTS "Authenticated can update corporate entities" ON public.corporate_entities;
CREATE POLICY "Members or staff read corporate entities" ON public.corporate_entities
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.corporate_users cu
               WHERE cu.corporate_entity_id = corporate_entities.id
                 AND cu.profile_id = auth.uid()
                 AND cu.is_active = true)
  );
CREATE POLICY "Admins manage corporate entities" ON public.corporate_entities
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update corporate entities" ON public.corporate_entities
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 11. corporate_users — privilege escalation fix
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view corporate users" ON public.corporate_users;
DROP POLICY IF EXISTS "Authenticated can insert corporate users" ON public.corporate_users;
DROP POLICY IF EXISTS "Authenticated can update corporate users" ON public.corporate_users;
DROP POLICY IF EXISTS "Authenticated can delete corporate users" ON public.corporate_users;
CREATE POLICY "Self or staff read corporate users" ON public.corporate_users
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Admins insert corporate users" ON public.corporate_users
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update corporate users" ON public.corporate_users
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete corporate users" ON public.corporate_users
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 12. fee_definitions — read OK for authenticated, writes admin
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert fee defs" ON public.fee_definitions;
DROP POLICY IF EXISTS "Authenticated can update fee defs" ON public.fee_definitions;
CREATE POLICY "Admins insert fee defs" ON public.fee_definitions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update fee defs" ON public.fee_definitions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 13. Accounting / GL tables — staff/admin only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage accounting periods" ON public.accounting_periods;
DROP POLICY IF EXISTS "Authenticated users can view accounting periods" ON public.accounting_periods;
CREATE POLICY "Staff read accounting periods" ON public.accounting_periods
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage accounting periods" ON public.accounting_periods
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated can view GL entries" ON public.gl_entries;
DROP POLICY IF EXISTS "Authenticated can insert GL entries" ON public.gl_entries;
CREATE POLICY "Staff read GL entries" ON public.gl_entries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins insert GL entries" ON public.gl_entries
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated can view COA" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Authenticated can insert COA" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Authenticated can update COA" ON public.chart_of_accounts;
CREATE POLICY "Staff read COA" ON public.chart_of_accounts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage COA" ON public.chart_of_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated can view GL mappings" ON public.gl_mappings;
DROP POLICY IF EXISTS "Authenticated can insert GL mappings" ON public.gl_mappings;
DROP POLICY IF EXISTS "Authenticated can update GL mappings" ON public.gl_mappings;
CREATE POLICY "Staff read GL mappings" ON public.gl_mappings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage GL mappings" ON public.gl_mappings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated users can view journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Authenticated users can create journal entries" ON public.journal_entries;
CREATE POLICY "Staff read journal entries" ON public.journal_entries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins create journal entries" ON public.journal_entries
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated can view batches" ON public.pool_gl_batches;
DROP POLICY IF EXISTS "Authenticated can insert batches" ON public.pool_gl_batches;
DROP POLICY IF EXISTS "Authenticated can update batches" ON public.pool_gl_batches;
CREATE POLICY "Staff read GL batches" ON public.pool_gl_batches
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage GL batches" ON public.pool_gl_batches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 14. integration_configs — admin only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view configs" ON public.integration_configs;
DROP POLICY IF EXISTS "Authenticated can insert configs" ON public.integration_configs;
DROP POLICY IF EXISTS "Authenticated can update configs" ON public.integration_configs;
DROP POLICY IF EXISTS "Authenticated can delete configs" ON public.integration_configs;
CREATE POLICY "Admins manage integration_configs" ON public.integration_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 15. savings_group_members — scope to member self, group owner, or staff
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view group members" ON public.savings_group_members;
DROP POLICY IF EXISTS "Authenticated can insert group members" ON public.savings_group_members;
DROP POLICY IF EXISTS "Authenticated can update group members" ON public.savings_group_members;
DROP POLICY IF EXISTS "Authenticated can delete group members" ON public.savings_group_members;
CREATE POLICY "Self or staff read savings_group_members" ON public.savings_group_members
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.savings_group_members m
               WHERE m.group_id = savings_group_members.group_id
                 AND m.profile_id = auth.uid()
                 AND m.is_active = true)
  );
CREATE POLICY "Staff manage savings_group_members" ON public.savings_group_members
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
