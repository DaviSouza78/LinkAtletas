-- The development database had applied 004 while the provider-correlation field
-- was being finalized. Keep an additive migration for every existing checkout.
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
ALTER TABLE billing_audit DROP CONSTRAINT billing_audit_actor_id_fkey;
ALTER TABLE billing_audit ADD CONSTRAINT billing_audit_actor_id_fkey FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE SET NULL;
