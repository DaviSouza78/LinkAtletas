CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body_ciphertext TEXT NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX messages_history ON messages(contract_id,created_at DESC,id DESC);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  resource_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX notifications_user ON notifications(user_id,created_at DESC);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK(char_length(body) BETWEEN 5 AND 2000),
  reply TEXT CHECK(char_length(reply) BETWEEN 5 AND 2000),
  replied_at TIMESTAMPTZ,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_coach ON reviews(coach_id,created_at DESC);
CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK(char_length(reason) BETWEEN 5 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id,reporter_id)
);
CREATE TABLE review_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  hidden BOOLEAN NOT NULL,
  reason TEXT NOT NULL CHECK(char_length(reason) BETWEEN 5 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(char_length(title) BETWEEN 3 AND 120),
  description_ciphertext TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 15 AND 180),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','cancelled','completed')),
  meeting_url TEXT,
  external_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX consultations_calendar ON consultations(starts_at) WHERE status='scheduled';
CREATE TABLE consultation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  previous_starts_at TIMESTAMPTZ,
  new_starts_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
