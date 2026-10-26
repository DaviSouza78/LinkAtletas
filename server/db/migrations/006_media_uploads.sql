CREATE TABLE media_uploads (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verification','instruction','performance','message')),
  resource_id UUID NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0 AND size <= 52428800),
  parts INTEGER NOT NULL CHECK (parts > 0 AND parts <= 17),
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '1 hour'
);
CREATE INDEX media_uploads_expiry ON media_uploads(expires_at);
CREATE INDEX media_uploads_owner ON media_uploads(owner_id);
