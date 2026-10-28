--
-- PostgreSQL database dump
--

\restrict EwgQCHnnHuDaOp7S14GIYWoS1YwHYzVMYsyPm16I1Vhtd16808uBkSF3UVIpRwY

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    athlete_id uuid NOT NULL,
    coach_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    decided_at timestamp with time zone,
    CONSTRAINT contracts_check CHECK ((athlete_id <> coach_id)),
    CONSTRAINT contracts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'rejected'::text])))
);


--
-- Name: executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workout_id uuid NOT NULL,
    completed_blocks integer[] NOT NULL,
    effort integer NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT executions_effort_check CHECK (((effort >= 1) AND (effort <= 10)))
);


--
-- Name: exercise_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workout_id uuid NOT NULL,
    "position" integer NOT NULL,
    definition jsonb NOT NULL,
    CONSTRAINT exercise_blocks_position_check CHECK (("position" >= 0))
);


--
-- Name: metric_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metric_types (
    sport text NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    unit text NOT NULL,
    min double precision NOT NULL,
    max double precision NOT NULL,
    CONSTRAINT metric_types_check CHECK ((min <= max))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    city text DEFAULT ''::text NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    sports text[] DEFAULT '{}'::text[] NOT NULL,
    goals text[] DEFAULT '{}'::text[] NOT NULL,
    levels text[] DEFAULT '{}'::text[] NOT NULL,
    availability text[] DEFAULT '{}'::text[] NOT NULL,
    mode text DEFAULT 'online'::text NOT NULL,
    budget numeric(10,2) DEFAULT 0 NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    cref text DEFAULT ''::text NOT NULL,
    verification_status text DEFAULT 'unsubmitted'::text NOT NULL,
    verification_reason text DEFAULT ''::text NOT NULL,
    CONSTRAINT profiles_budget_check CHECK ((budget >= (0)::numeric)),
    CONSTRAINT profiles_mode_check CHECK ((mode = ANY (ARRAY['online'::text, 'presencial'::text, 'hibrido'::text]))),
    CONSTRAINT profiles_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT profiles_verification_status_check CHECK ((verification_status = ANY (ARRAY['unsubmitted'::text, 'pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    token_hash text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_check CHECK ((email = lower(email))),
    CONSTRAINT users_name_check CHECK (((length(name) >= 2) AND (length(name) <= 100))),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['athlete'::text, 'coach'::text, 'admin'::text])))
);


--
-- Name: verification_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    decision text NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verification_audit_decision_check CHECK ((decision = ANY (ARRAY['approved'::text, 'rejected'::text])))
);


--
-- Name: verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_id uuid NOT NULL,
    cref text NOT NULL,
    evidence text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reason text DEFAULT ''::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewer_id uuid,
    CONSTRAINT verifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: workouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid NOT NULL,
    title text NOT NULL,
    sport text NOT NULL,
    scheduled_date date NOT NULL,
    instructions text DEFAULT ''::text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workouts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: contracts contracts_athlete_id_coach_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_athlete_id_coach_id_key UNIQUE (athlete_id, coach_id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: executions executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_pkey PRIMARY KEY (id);


--
-- Name: executions executions_workout_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_workout_id_key UNIQUE (workout_id);


--
-- Name: exercise_blocks exercise_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_blocks
    ADD CONSTRAINT exercise_blocks_pkey PRIMARY KEY (id);


--
-- Name: exercise_blocks exercise_blocks_workout_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_blocks
    ADD CONSTRAINT exercise_blocks_workout_id_position_key UNIQUE (workout_id, "position");


--
-- Name: metric_types metric_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metric_types
    ADD CONSTRAINT metric_types_pkey PRIMARY KEY (sport, key);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token_hash);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_audit verification_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_audit
    ADD CONSTRAINT verification_audit_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: workouts workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);


--
-- Name: contracts_coach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_coach ON public.contracts USING btree (coach_id, status);


--
-- Name: one_pending_verification; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_pending_verification ON public.verifications USING btree (coach_id) WHERE (status = 'pending'::text);


--
-- Name: sessions_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_expiry ON public.sessions USING btree (expires_at);


--
-- Name: workouts_contract; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workouts_contract ON public.workouts USING btree (contract_id);


--
-- Name: contracts contracts_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: executions executions_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;


--
-- Name: exercise_blocks exercise_blocks_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_blocks
    ADD CONSTRAINT exercise_blocks_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_audit verification_audit_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_audit
    ADD CONSTRAINT verification_audit_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: verification_audit verification_audit_verification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_audit
    ADD CONSTRAINT verification_audit_verification_id_fkey FOREIGN KEY (verification_id) REFERENCES public.verifications(id) ON DELETE CASCADE;


--
-- Name: verifications verifications_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verifications verifications_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: workouts workouts_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EwgQCHnnHuDaOp7S14GIYWoS1YwHYzVMYsyPm16I1Vhtd16808uBkSF3UVIpRwY
