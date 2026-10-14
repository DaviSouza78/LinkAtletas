ALTER TABLE users ADD COLUMN disabled_at TIMESTAMPTZ;
ALTER TABLE profiles DROP CONSTRAINT profiles_verification_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_verification_status_check CHECK(verification_status IN ('unsubmitted','pending','approved','rejected','suspended','expired'));
ALTER TABLE profiles ADD COLUMN verification_expires_at TIMESTAMPTZ;
ALTER TABLE verifications ADD COLUMN document_id UUID;
ALTER TABLE verifications ADD COLUMN expires_at TIMESTAMPTZ;
ALTER TABLE verifications ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
CREATE TABLE password_resets (
 token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE mail_outbox (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 recipient TEXT NOT NULL, subject TEXT NOT NULL, encrypted_body TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, sent_at TIMESTAMPTZ, next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_error TEXT
);
CREATE TABLE consents (
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL CHECK(purpose IN ('performance','health','communications')),
 granted BOOLEAN NOT NULL, version TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,purpose)
);
CREATE TABLE consent_history (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL, granted BOOLEAN NOT NULL, version TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE private_health (
 user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, encrypted_data TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE media (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL CHECK(purpose IN ('verification','instruction','performance','message')),
 resource_id UUID NOT NULL, name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL CHECK(size>0),
 object_key TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
ALTER TABLE verifications ADD CONSTRAINT verification_document FOREIGN KEY(document_id) REFERENCES media(id);
CREATE INDEX media_resource ON media(resource_id) WHERE deleted_at IS NULL;
CREATE TABLE media_feedback (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
 author_id UUID NOT NULL REFERENCES users(id), encrypted_text TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE administrative_audit (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id), subject_id UUID REFERENCES users(id),
 action TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE privacy_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','retained-financial')),
 requested_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ
);
ALTER TABLE executions ADD COLUMN private_payload TEXT;
