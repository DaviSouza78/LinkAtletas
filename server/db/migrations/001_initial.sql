CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete','coach','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  city TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '',
  sports TEXT[] NOT NULL DEFAULT '{}', goals TEXT[] NOT NULL DEFAULT '{}',
  levels TEXT[] NOT NULL DEFAULT '{}', availability TEXT[] NOT NULL DEFAULT '{}',
  mode TEXT NOT NULL DEFAULT 'online' CHECK(mode IN ('online','presencial','hibrido')),
  budget NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(budget >= 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(price >= 0),
  cref TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'unsubmitted' CHECK(verification_status IN ('unsubmitted','pending','approved','rejected')),
  verification_reason TEXT NOT NULL DEFAULT ''
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cref TEXT NOT NULL, evidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reason TEXT NOT NULL DEFAULT '', submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ, reviewer_id UUID REFERENCES users(id)
);
CREATE UNIQUE INDEX one_pending_verification ON verifications(coach_id) WHERE status='pending';
CREATE TABLE verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id), decision TEXT NOT NULL CHECK(decision IN ('approved','rejected')),
  reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), decided_at TIMESTAMPTZ,
  UNIQUE(athlete_id,coach_id), CHECK(athlete_id <> coach_id)
);
CREATE INDEX contracts_coach ON contracts(coach_id,status);
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL, sport TEXT NOT NULL, scheduled_date DATE NOT NULL,
  instructions TEXT NOT NULL DEFAULT '', status TEXT NOT NULL CHECK(status IN ('draft','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX workouts_contract ON workouts(contract_id);
CREATE TABLE exercise_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK(position >= 0), definition JSONB NOT NULL,
  UNIQUE(workout_id,position)
);
CREATE TABLE metric_types (
  sport TEXT NOT NULL, key TEXT NOT NULL, label TEXT NOT NULL, unit TEXT NOT NULL,
  min DOUBLE PRECISION NOT NULL, max DOUBLE PRECISION NOT NULL,
  PRIMARY KEY(sport,key), CHECK(min <= max)
);
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), workout_id UUID NOT NULL UNIQUE REFERENCES workouts(id) ON DELETE CASCADE,
  completed_blocks INTEGER[] NOT NULL, effort INTEGER NOT NULL CHECK(effort BETWEEN 1 AND 10),
  notes TEXT NOT NULL DEFAULT '', metrics JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO metric_types(sport,key,label,unit,min,max) VALUES
 ('Corrida','durationMinutes','Duração','min',0,1440),('Corrida','distanceKm','Distância','km',0,500),
 ('Musculação','loadKg','Carga','kg',0,1000),('Musculação','repetitions','Repetições','rep',0,10000),
 ('Musculação','durationMinutes','Duração','min',0,1440),
 ('Natação','durationMinutes','Duração','min',0,1440),('Natação','distanceKm','Distância','km',0,100),
 ('Ciclismo','durationMinutes','Duração','min',0,1440),('Ciclismo','distanceKm','Distância','km',0,1500),
 ('Triatlo','durationMinutes','Duração','min',0,1440),('Triatlo','distanceKm','Distância total','km',0,1500);
