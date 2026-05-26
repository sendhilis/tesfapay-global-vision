-- Nisir port batch 1/4: core customer-portal schema

-- ============== Enums ==============
DO $$ BEGIN CREATE TYPE public.kyc_status AS ENUM ('pending','simplified','full','rejected','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.account_type AS ENUM ('savings','wallet','current'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.account_status AS ENUM ('active','dormant','closed','frozen'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.transaction_type AS ENUM ('transfer','bill_payment','airtime','loan_repayment','deposit','withdrawal','fee','interest'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.transaction_direction AS ENUM ('credit','debit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed','reversed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.loan_status AS ENUM ('draft','submitted','under_review','approved','disbursed','active','closed','defaulted','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.loan_product_type AS ENUM ('micro','retail','msme','consumer','nano','agri'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.repayment_status AS ENUM ('pending','paid','overdue','partial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','resolved','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ticket_priority AS ENUM ('low','medium','high','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.consent_type AS ENUM ('digital_statements','marketing','data_sharing','analytics'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== Updated-at utility ==============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============== Profiles ==============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  father_name TEXT NOT NULL DEFAULT '',
  grandfather_name TEXT DEFAULT '',
  first_name_am TEXT DEFAULT '',
  father_name_am TEXT DEFAULT '',
  grandfather_name_am TEXT DEFAULT '',
  gender TEXT CHECK (gender IN ('male','female','other')),
  date_of_birth DATE,
  marital_status TEXT CHECK (marital_status IN ('single','married','divorced','widowed')),
  region TEXT DEFAULT '',
  woreda TEXT DEFAULT '',
  kebele TEXT DEFAULT '',
  house_number TEXT DEFAULT '',
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  msisdn TEXT,
  alternate_phone TEXT,
  email TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','am')),
  occupation TEXT DEFAULT '',
  business_type TEXT DEFAULT '',
  income_band TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  kyc_tier public.kyc_status DEFAULT 'pending',
  profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
  risk_score INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, msisdn) VALUES (NEW.id, NEW.email, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== KYC documents ==============
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id','kebele_id','passport','driving_license','business_license')),
  document_number TEXT,
  front_image_url TEXT,
  back_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own KYC docs" ON public.kyc_documents;
CREATE POLICY "Users can view own KYC docs" ON public.kyc_documents FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own KYC docs" ON public.kyc_documents;
CREATE POLICY "Users can insert own KYC docs" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ============== Accounts ==============
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL DEFAULT 'NIS-' || substr(gen_random_uuid()::text,1,12),
  account_type public.account_type NOT NULL DEFAULT 'savings',
  product_name TEXT NOT NULL DEFAULT 'Savings Account',
  balance DECIMAL(15,2) DEFAULT 0 CHECK (balance >= 0),
  available_balance DECIMAL(15,2) DEFAULT 0 CHECK (available_balance >= 0),
  blocked_balance DECIMAL(15,2) DEFAULT 0 CHECK (blocked_balance >= 0),
  currency TEXT DEFAULT 'ETB',
  interest_rate DECIMAL(5,2) DEFAULT 0,
  status public.account_status DEFAULT 'active',
  is_primary BOOLEAN DEFAULT false,
  daily_limit DECIMAL(15,2) DEFAULT 50000,
  monthly_limit DECIMAL(15,2) DEFAULT 500000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = profile_id);

CREATE OR REPLACE FUNCTION public.create_default_accounts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.accounts (profile_id, account_type, product_name, balance, available_balance, is_primary, interest_rate)
  VALUES
    (NEW.id, 'savings', 'Savings Account', 10200.00, 10200.00, true, 7.5),
    (NEW.id, 'wallet',  'Digital Wallet',   2250.00,  2250.00, false, 0);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_profile_created_accounts ON public.profiles;
CREATE TRIGGER on_profile_created_accounts AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_default_accounts();
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== Transactions ==============
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_type public.transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'ETB',
  direction public.transaction_direction NOT NULL,
  status public.transaction_status DEFAULT 'completed',
  reference TEXT UNIQUE DEFAULT 'TXN-' || substr(gen_random_uuid()::text,1,12),
  description TEXT,
  recipient_name TEXT,
  recipient_account TEXT,
  recipient_msisdn TEXT,
  channel TEXT DEFAULT 'mobile',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ============== Loans ==============
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_type public.loan_product_type NOT NULL DEFAULT 'micro',
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 15,
  tenor_months INTEGER NOT NULL CHECK (tenor_months > 0),
  monthly_installment DECIMAL(15,2),
  total_payable DECIMAL(15,2),
  purpose TEXT,
  status public.loan_status DEFAULT 'draft',
  disbursement_account_id UUID REFERENCES public.accounts(id),
  disbursed_at TIMESTAMPTZ,
  next_due_date DATE,
  outstanding_balance DECIMAL(15,2),
  collateral_description TEXT,
  guarantor_name TEXT,
  guarantor_msisdn TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (auth.uid() = profile_id);
DROP TRIGGER IF EXISTS update_loans_updated_at ON public.loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal DECIMAL(15,2) NOT NULL,
  interest DECIMAL(15,2) NOT NULL,
  total_due DECIMAL(15,2) NOT NULL,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  status public.repayment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own repayments" ON public.loan_repayments;
CREATE POLICY "Users can view own repayments" ON public.loan_repayments FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own repayments" ON public.loan_repayments;
CREATE POLICY "Users can update own repayments" ON public.loan_repayments FOR UPDATE USING (auth.uid() = profile_id);

-- Loan configurations + scheduler tables
CREATE TABLE IF NOT EXISTS public.loan_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type public.loan_product_type NOT NULL UNIQUE,
  interest_calc_method TEXT NOT NULL DEFAULT 'reducing_balance' CHECK (interest_calc_method IN ('reducing_balance','flat','rule_of_78')),
  grace_period_days INTEGER NOT NULL DEFAULT 5,
  late_penalty_rate NUMERIC NOT NULL DEFAULT 2.0,
  late_penalty_basis TEXT NOT NULL DEFAULT 'per_month' CHECK (late_penalty_basis IN ('per_day','per_month','flat')),
  early_repayment_fee_pct NUMERIC NOT NULL DEFAULT 2.0,
  min_repayment_amount NUMERIC NOT NULL DEFAULT 100,
  allow_partial_payment BOOLEAN NOT NULL DEFAULT true,
  repayment_waterfall TEXT NOT NULL DEFAULT 'penalty_interest_principal' CHECK (repayment_waterfall IN ('penalty_interest_principal','principal_interest_penalty')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone authenticated can view configs" ON public.loan_configurations;
CREATE POLICY "Anyone authenticated can view configs" ON public.loan_configurations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Service role can manage configs" ON public.loan_configurations;
CREATE POLICY "Service role can manage configs" ON public.loan_configurations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS update_loan_configurations_updated_at ON public.loan_configurations;
CREATE TRIGGER update_loan_configurations_updated_at BEFORE UPDATE ON public.loan_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.loan_configurations (product_type, interest_calc_method, grace_period_days, late_penalty_rate, early_repayment_fee_pct) VALUES
('micro','reducing_balance',3,2.5,1.5),
('nano','flat',2,3.0,0),
('retail','reducing_balance',5,2.0,2.0),
('msme','reducing_balance',7,1.5,2.5),
('consumer','reducing_balance',5,2.0,2.0),
('agri','reducing_balance',10,1.0,1.0)
ON CONFLICT (product_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.loan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  principal NUMERIC NOT NULL DEFAULT 0,
  interest NUMERIC NOT NULL DEFAULT 0,
  total_due NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  penalty_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','partial','overdue','waived')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(loan_id, installment_number)
);
ALTER TABLE public.loan_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own schedules" ON public.loan_schedules;
CREATE POLICY "Users can view own schedules" ON public.loan_schedules FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.loan_schedules;
CREATE POLICY "Users can insert own schedules" ON public.loan_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own schedules" ON public.loan_schedules;
CREATE POLICY "Users can update own schedules" ON public.loan_schedules FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.loan_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  schedule_id UUID REFERENCES public.loan_schedules(id),
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('late_payment','early_repayment','default_charge','bounced_payment')),
  amount NUMERIC NOT NULL DEFAULT 0,
  calculation_basis TEXT,
  days_overdue INTEGER DEFAULT 0,
  is_waived BOOLEAN DEFAULT false,
  waived_by TEXT,
  waived_at TIMESTAMPTZ,
  waiver_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_penalties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own penalties" ON public.loan_penalties;
CREATE POLICY "Users can view own penalties" ON public.loan_penalties FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own penalties" ON public.loan_penalties;
CREATE POLICY "Users can insert own penalties" ON public.loan_penalties FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own penalties" ON public.loan_penalties;
CREATE POLICY "Users can update own penalties" ON public.loan_penalties FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.loan_interest_accruals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  accrual_date DATE NOT NULL,
  principal_balance NUMERIC NOT NULL DEFAULT 0,
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  accrued_amount NUMERIC NOT NULL DEFAULT 0,
  accrual_type TEXT NOT NULL DEFAULT 'regular' CHECK (accrual_type IN ('regular','broken_period','penalty','compounding')),
  is_posted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(loan_id, accrual_date, accrual_type)
);
ALTER TABLE public.loan_interest_accruals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own accruals" ON public.loan_interest_accruals;
CREATE POLICY "Users can view own accruals" ON public.loan_interest_accruals FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own accruals" ON public.loan_interest_accruals;
CREATE POLICY "Users can insert own accruals" ON public.loan_interest_accruals FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.loan_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  waiver_type TEXT NOT NULL CHECK (waiver_type IN ('interest','penalty','fee','partial_interest')),
  original_amount NUMERIC NOT NULL DEFAULT 0,
  waived_amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  requested_by TEXT,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_waivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own waivers" ON public.loan_waivers;
CREATE POLICY "Users can view own waivers" ON public.loan_waivers FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Service role can manage waivers" ON public.loan_waivers;
CREATE POLICY "Service role can manage waivers" ON public.loan_waivers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can request waivers" ON public.loan_waivers;
CREATE POLICY "Users can request waivers" ON public.loan_waivers FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.loan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ORIGINATION','DISBURSEMENT','REPAYMENT','PARTIAL_REPAYMENT','PENALTY_APPLIED','WAIVER_GRANTED','EARLY_CLOSURE','RESTRUCTURED','DEFAULT','WRITE_OFF','INTEREST_ACCRUAL','SCHEDULE_GENERATED','STATUS_CHANGE','STATEMENT_GENERATED')),
  amount NUMERIC DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  posted_to_cbs BOOLEAN DEFAULT false,
  cbs_reference TEXT,
  cbs_posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own events" ON public.loan_events;
CREATE POLICY "Users can view own events" ON public.loan_events FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own events" ON public.loan_events;
CREATE POLICY "Users can insert own events" ON public.loan_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.loan_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  statement_period_start DATE NOT NULL,
  statement_period_end DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  disbursements NUMERIC DEFAULT 0,
  repayments NUMERIC DEFAULT 0,
  interest_charged NUMERIC DEFAULT 0,
  penalties_charged NUMERIC DEFAULT 0,
  waivers_applied NUMERIC DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own statements" ON public.loan_statements;
CREATE POLICY "Users can view own statements" ON public.loan_statements FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own statements" ON public.loan_statements;
CREATE POLICY "Users can insert own statements" ON public.loan_statements FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- ============== Saved billers ==============
CREATE TABLE IF NOT EXISTS public.saved_billers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  biller_name TEXT NOT NULL,
  biller_category TEXT NOT NULL CHECK (biller_category IN ('utility','telecom','school','government','tax','other')),
  account_number TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.saved_billers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own billers" ON public.saved_billers;
CREATE POLICY "Users can view own billers" ON public.saved_billers FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own billers" ON public.saved_billers;
CREATE POLICY "Users can insert own billers" ON public.saved_billers FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can delete own billers" ON public.saved_billers;
CREATE POLICY "Users can delete own billers" ON public.saved_billers FOR DELETE USING (auth.uid() = profile_id);

-- ============== Support tickets ==============
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL DEFAULT 'TKT-' || substr(gen_random_uuid()::text,1,8),
  category TEXT NOT NULL CHECK (category IN ('accounts','loans','payments','cards','agents','security','other')),
  subject TEXT NOT NULL,
  description TEXT,
  priority public.ticket_priority DEFAULT 'medium',
  status public.ticket_status DEFAULT 'open',
  assigned_to TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = profile_id);
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== Notifications (allows 'info','warning','success','alert','transaction','loan') ==============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','alert','transaction','loan')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- ============== Consents ==============
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  granted BOOLEAN DEFAULT false,
  method TEXT DEFAULT 'digital' CHECK (method IN ('digital','branch','agent')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (profile_id, consent_type)
);
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own consents" ON public.consents;
CREATE POLICY "Users can view own consents" ON public.consents FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can manage own consents" ON public.consents;
CREATE POLICY "Users can manage own consents" ON public.consents FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own consents" ON public.consents;
CREATE POLICY "Users can update own consents" ON public.consents FOR UPDATE USING (auth.uid() = profile_id);

-- ============== Merchant portal tables ==============
CREATE TABLE IF NOT EXISTS public.merchant_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_balance NUMERIC NOT NULL DEFAULT 0,
  savings_balance NUMERIC NOT NULL DEFAULT 0,
  bank_name TEXT NOT NULL DEFAULT 'Nisir Microfinance',
  bank_account_number TEXT NOT NULL DEFAULT '****4521',
  bank_account_holder TEXT NOT NULL DEFAULT 'Nisir Merchant',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);
ALTER TABLE public.merchant_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own merchant wallet" ON public.merchant_wallets;
CREATE POLICY "Users can view own merchant wallet" ON public.merchant_wallets FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own merchant wallet" ON public.merchant_wallets;
CREATE POLICY "Users can insert own merchant wallet" ON public.merchant_wallets FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own merchant wallet" ON public.merchant_wallets;
CREATE POLICY "Users can update own merchant wallet" ON public.merchant_wallets FOR UPDATE USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.merchant_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('qr_received','vendor_payment','wallet_transfer','settlement')),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending')),
  reference TEXT NOT NULL DEFAULT ('MTX-' || substr(gen_random_uuid()::text,1,12)),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own merchant transactions" ON public.merchant_transactions;
CREATE POLICY "Users can view own merchant transactions" ON public.merchant_transactions FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own merchant transactions" ON public.merchant_transactions;
CREATE POLICY "Users can insert own merchant transactions" ON public.merchant_transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.merchant_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_amount NUMERIC NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  fee_percent NUMERIC NOT NULL DEFAULT 0.015,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','settled','failed')),
  bank_account TEXT NOT NULL DEFAULT '',
  tx_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.merchant_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own settlements" ON public.merchant_settlements;
CREATE POLICY "Users can view own settlements" ON public.merchant_settlements FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own settlements" ON public.merchant_settlements;
CREATE POLICY "Users can insert own settlements" ON public.merchant_settlements FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own settlements" ON public.merchant_settlements;
CREATE POLICY "Users can update own settlements" ON public.merchant_settlements FOR UPDATE USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.merchant_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  bank TEXT NOT NULL DEFAULT '',
  total_paid NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.merchant_vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own vendors" ON public.merchant_vendors;
CREATE POLICY "Users can view own vendors" ON public.merchant_vendors FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can insert own vendors" ON public.merchant_vendors;
CREATE POLICY "Users can insert own vendors" ON public.merchant_vendors FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can update own vendors" ON public.merchant_vendors;
CREATE POLICY "Users can update own vendors" ON public.merchant_vendors FOR UPDATE USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can delete own vendors" ON public.merchant_vendors;
CREATE POLICY "Users can delete own vendors" ON public.merchant_vendors FOR DELETE USING (auth.uid() = profile_id);

-- ============== Notification triggers ==============
CREATE OR REPLACE FUNCTION public.notify_on_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, title, message, type, metadata)
  VALUES (
    NEW.profile_id,
    CASE NEW.transaction_type
      WHEN 'transfer' THEN CASE NEW.direction WHEN 'credit' THEN 'Money Received' ELSE 'Transfer Sent' END
      WHEN 'bill_payment' THEN 'Bill Payment'
      WHEN 'airtime' THEN 'Airtime Purchase'
      WHEN 'deposit' THEN 'Deposit Received'
      WHEN 'withdrawal' THEN 'Withdrawal'
      ELSE 'Transaction' END,
    CASE NEW.direction WHEN 'credit' THEN 'You received ' || NEW.amount || ' ETB' ELSE 'You sent ' || NEW.amount || ' ETB' END
      || COALESCE(' - ' || NEW.description, ''),
    'transaction',
    jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount, 'direction', NEW.direction, 'type', NEW.transaction_type)
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_new_transaction_notify ON public.transactions;
CREATE TRIGGER on_new_transaction_notify AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_transaction();

CREATE OR REPLACE FUNCTION public.notify_loan_overdue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'overdue' AND (OLD.status IS DISTINCT FROM 'overdue') THEN
    INSERT INTO public.notifications (profile_id, title, message, type, metadata)
    VALUES (NEW.profile_id, 'Loan Payment Overdue',
      'Installment #' || NEW.installment_number || ' of ' || ROUND(NEW.total_due - COALESCE(NEW.amount_paid,0), 2) || ' ETB is overdue.',
      'loan',
      jsonb_build_object('loan_id', NEW.loan_id, 'schedule_id', NEW.id, 'installment_number', NEW.installment_number, 'amount_due', NEW.total_due - COALESCE(NEW.amount_paid,0)));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_loan_overdue_notification ON public.loan_schedules;
CREATE TRIGGER trg_loan_overdue_notification AFTER UPDATE ON public.loan_schedules FOR EACH ROW EXECUTE FUNCTION public.notify_loan_overdue();

CREATE OR REPLACE FUNCTION public.notify_loan_repayment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.notifications (profile_id, title, message, type, metadata)
    VALUES (NEW.profile_id, 'Loan Repayment Received',
      'Installment #' || NEW.installment_number || ' of ' || ROUND(NEW.total_due, 2) || ' ETB has been paid successfully.',
      'loan',
      jsonb_build_object('loan_id', NEW.loan_id, 'schedule_id', NEW.id, 'installment_number', NEW.installment_number, 'amount_paid', NEW.total_due));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_loan_repayment_notification ON public.loan_schedules;
CREATE TRIGGER trg_loan_repayment_notification AFTER UPDATE ON public.loan_schedules FOR EACH ROW EXECUTE FUNCTION public.notify_loan_repayment();

-- ============== Atomic stored procedures ==============
CREATE OR REPLACE FUNCTION public.process_transfer(p_from_account_id UUID, p_to_msisdn TEXT, p_amount DECIMAL, p_fee DECIMAL DEFAULT 0, p_description TEXT DEFAULT 'Transfer')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_from_account RECORD; v_to_account RECORD; v_txn_ref TEXT;
BEGIN
  SELECT * INTO v_from_account FROM accounts WHERE id = p_from_account_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Sender account not found'); END IF;
  IF v_from_account.available_balance < (p_amount + p_fee) THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  SELECT a.* INTO v_to_account FROM accounts a JOIN profiles p ON a.profile_id = p.id WHERE p.msisdn = p_to_msisdn AND a.is_primary = true FOR UPDATE;
  UPDATE accounts SET balance = balance - (p_amount + p_fee), available_balance = available_balance - (p_amount + p_fee) WHERE id = p_from_account_id;
  v_txn_ref := 'TXN-' || substr(gen_random_uuid()::text,1,12);
  INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description, recipient_msisdn)
  VALUES (p_from_account_id, v_from_account.profile_id, 'transfer', p_amount, p_fee, 'debit', 'completed', v_txn_ref, p_description, p_to_msisdn);
  IF v_to_account.id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + p_amount, available_balance = available_balance + p_amount WHERE id = v_to_account.id;
    INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description)
    VALUES (v_to_account.id, v_to_account.profile_id, 'transfer', p_amount, 0, 'credit', 'completed', 'TXN-' || substr(gen_random_uuid()::text,1,12), 'Received from transfer');
  END IF;
  RETURN jsonb_build_object('success', true, 'reference', v_txn_ref, 'new_balance', v_from_account.available_balance - (p_amount + p_fee));
END; $$;

CREATE OR REPLACE FUNCTION public.process_bill_payment(p_account_id UUID, p_biller_name TEXT, p_biller_account TEXT, p_amount DECIMAL, p_fee DECIMAL DEFAULT 5)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_account RECORD; v_txn_ref TEXT;
BEGIN
  SELECT * INTO v_account FROM accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Account not found'); END IF;
  IF v_account.available_balance < (p_amount + p_fee) THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  UPDATE accounts SET balance = balance - (p_amount + p_fee), available_balance = available_balance - (p_amount + p_fee) WHERE id = p_account_id;
  v_txn_ref := 'TXN-' || substr(gen_random_uuid()::text,1,12);
  INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description, recipient_name, recipient_account)
  VALUES (p_account_id, v_account.profile_id, 'bill_payment', p_amount, p_fee, 'debit', 'completed', v_txn_ref, 'Bill payment to ' || p_biller_name, p_biller_name, p_biller_account);
  RETURN jsonb_build_object('success', true, 'reference', v_txn_ref, 'new_balance', v_account.available_balance - (p_amount + p_fee));
END; $$;

CREATE OR REPLACE FUNCTION public.process_airtime_purchase(p_account_id UUID, p_phone TEXT, p_amount DECIMAL, p_operator TEXT DEFAULT 'Ethio Telecom')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_account RECORD; v_txn_ref TEXT;
BEGIN
  SELECT * INTO v_account FROM accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Account not found'); END IF;
  IF v_account.available_balance < p_amount THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  UPDATE accounts SET balance = balance - p_amount, available_balance = available_balance - p_amount WHERE id = p_account_id;
  v_txn_ref := 'TXN-' || substr(gen_random_uuid()::text,1,12);
  INSERT INTO transactions (account_id, profile_id, transaction_type, amount, fee, direction, status, reference, description, recipient_msisdn)
  VALUES (p_account_id, v_account.profile_id, 'airtime', p_amount, 0, 'debit', 'completed', v_txn_ref, p_operator || ' airtime for ' || p_phone, p_phone);
  RETURN jsonb_build_object('success', true, 'reference', v_txn_ref, 'new_balance', v_account.available_balance - p_amount);
END; $$;

-- ============== Realtime + storage ==============
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts'; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions'; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications'; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_events'; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_schedules'; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Users can upload KYC docs" ON storage.objects;
CREATE POLICY "Users can upload KYC docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can view own KYC docs" ON storage.objects;
CREATE POLICY "Users can view own KYC docs" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
