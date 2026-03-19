-- GlobalPay Flyway Migration V5 — Seed Data
-- Maps to: DATABASE_SCHEMA.md §13 (Seed Data)

-- Billers
INSERT INTO billers (id, name, category, icon, description, is_popular, requires_account_number) VALUES
    (gen_random_uuid(), 'Ethio Telecom', 'TELECOM', '📱', 'Mobile Airtime & Data', true, true),
    (gen_random_uuid(), 'Ethiopian Electric Utility', 'UTILITY', '⚡', 'Electricity bill', true, true),
    (gen_random_uuid(), 'Addis Ababa Water', 'WATER', '💧', 'Water & sewerage', false, true),
    (gen_random_uuid(), 'EthioSat TV', 'TV', '📺', 'Satellite subscription', false, true),
    (gen_random_uuid(), 'EOTC School Fees', 'EDUCATION', '🎓', 'School & university fees', false, true),
    (gen_random_uuid(), 'Internet (ETC)', 'TELECOM', '🌐', 'Fixed broadband', false, true),
    (gen_random_uuid(), 'Addis Gas', 'UTILITY', '🔥', 'LPG gas payment', false, true),
    (gen_random_uuid(), 'Nib Insurance', 'UTILITY', '🛡️', 'Insurance premium', false, true);

-- Telecom Operators
INSERT INTO telecom_operators (id, name, icon) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ethio Telecom', '📱'),
    ('22222222-2222-2222-2222-222222222222', 'Safaricom ET', '🟢');

-- Airtime Bundles
INSERT INTO airtime_bundles (id, operator_id, name, price, validity, type, sort_order) VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '50 MB Data', 5.00, '1 day', 'DATA', 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '1 GB Data', 25.00, '7 days', 'DATA', 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '5 GB Data', 85.00, '30 days', 'DATA', 3),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ETB 10 Airtime', 10.00, 'No expiry', 'AIRTIME', 4),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ETB 50 Airtime', 50.00, 'No expiry', 'AIRTIME', 5),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ETB 100 Airtime', 100.00, 'No expiry', 'AIRTIME', 6),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '200 MB Data', 10.00, '3 days', 'DATA', 1),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '2 GB Data', 45.00, '30 days', 'DATA', 2),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'ETB 20 Airtime', 20.00, 'No expiry', 'AIRTIME', 3);

-- Redemption Catalog
INSERT INTO redemption_catalog (id, name, icon, points_cost, reward_type, reward_value, min_tier) VALUES
    (gen_random_uuid(), 'ETB 10 Cashback', '💵', 200, 'CASHBACK', 10.00, NULL),
    (gen_random_uuid(), '1 GB Data Bundle', '📱', 500, 'DATA_BUNDLE', NULL, NULL),
    (gen_random_uuid(), 'ETB 50 Cashback', '💰', 1000, 'CASHBACK', 50.00, NULL),
    (gen_random_uuid(), 'Free Bill Payment', '📄', 800, 'FREE_BILL', NULL, NULL),
    (gen_random_uuid(), '0% Loan Discount', '🏦', 2000, 'LOAN_DISCOUNT', NULL, 'GOLD'),
    (gen_random_uuid(), 'Priority Support', '⭐', 3000, 'PRIORITY_SUPPORT', NULL, 'PLATINUM');

-- System Config
INSERT INTO system_config (key, value, description) VALUES
    ('kyc_level_1_daily_limit', '25000.00', 'Daily transaction limit for KYC Level 1'),
    ('kyc_level_2_daily_limit', '50000.00', 'Daily transaction limit for KYC Level 2'),
    ('kyc_level_1_monthly_limit', '100000.00', 'Monthly limit for KYC Level 1'),
    ('kyc_level_2_monthly_limit', '200000.00', 'Monthly limit for KYC Level 2'),
    ('p2p_fee_flat', '2.50', 'Flat fee for P2P transfers'),
    ('agent_commission_rate', '0.003', 'Agent commission rate (0.3%)'),
    ('agent_min_commission', '2.00', 'Minimum agent commission per transaction'),
    ('loyalty_points_per_etb', '0.1', 'Points earned per ETB transacted'),
    ('loyalty_point_value_etb', '0.05', 'ETB value of one loyalty point'),
    ('max_failed_pin_attempts', '5', 'Lock account after N failed PIN attempts'),
    ('pin_lockout_duration_minutes', '30', 'Account lockout duration'),
    ('otp_validity_seconds', '300', 'OTP validity window (5 minutes)'),
    ('cash_in_fee', '5.00', 'Cash-in service fee'),
    ('cash_out_fee', '5.00', 'Cash-out service fee');
