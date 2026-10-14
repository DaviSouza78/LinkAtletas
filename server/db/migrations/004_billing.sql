ALTER TABLE contracts DROP CONSTRAINT contracts_athlete_id_coach_id_key;
ALTER TABLE contracts DROP CONSTRAINT contracts_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check CHECK(status IN ('pending','active','rejected','cancelled','suspended'));
ALTER TABLE contracts ADD COLUMN ended_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN cancellation_reason TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX one_current_contract ON contracts(athlete_id,coach_id) WHERE status IN ('pending','active','suspended');
CREATE TABLE billing_settings (
 id INTEGER PRIMARY KEY CHECK(id=1), commission_bps INTEGER NOT NULL DEFAULT 1000 CHECK(commission_bps BETWEEN 0 AND 5000),
 grace_days INTEGER NOT NULL DEFAULT 3 CHECK(grace_days BETWEEN 0 AND 30)
);
INSERT INTO billing_settings(id) VALUES(1);
CREATE TABLE billing_wallets (
 coach_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, wallet_id TEXT NOT NULL UNIQUE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE billing_plans (
 coach_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents BETWEEN 100 AND 10000000), active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE billing_subscriptions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contract_id UUID NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
 plan_name TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>0), commission_bps INTEGER NOT NULL,
 environment TEXT NOT NULL CHECK(environment IN ('sandbox','production')),
 state TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK(state IN ('awaiting_payment','regular','grace','suspended','cancellation_requested','ended','uncertain')),
 provider_checkout_id TEXT UNIQUE, provider_subscription_id TEXT UNIQUE, provider_customer_id TEXT, checkout_url TEXT,
 paid_until TIMESTAMPTZ, grace_until TIMESTAMPTZ, cancellation_confirmed BOOLEAN NOT NULL DEFAULT false,
 cancellation_reason TEXT NOT NULL DEFAULT '', cancellation_started_at TIMESTAMPTZ,
 last_event_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE billing_payments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
 provider_payment_id TEXT NOT NULL UNIQUE, amount_cents INTEGER NOT NULL, net_cents INTEGER NOT NULL,
 status TEXT NOT NULL, paid_at TIMESTAMPTZ, due_date DATE, event_at TIMESTAMPTZ NOT NULL,
 coach_share_cents INTEGER NOT NULL DEFAULT 0, platform_share_cents INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE billing_splits (
 provider_split_id TEXT PRIMARY KEY, payment_id UUID NOT NULL REFERENCES billing_payments(id) ON DELETE CASCADE,
 wallet_id TEXT NOT NULL, amount_cents INTEGER NOT NULL, status TEXT NOT NULL, event_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE billing_events (
 id TEXT PRIMARY KEY, event TEXT NOT NULL, event_at TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL,
 received_at TIMESTAMPTZ NOT NULL DEFAULT now(), processed_at TIMESTAMPTZ, attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(), processing_note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE billing_jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('checkout','cancellation','reconciliation')), state TEXT NOT NULL CHECK(state IN ('running','uncertain','confirmed','failed')),
 attempts INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE billing_audit (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id), contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
 action TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
