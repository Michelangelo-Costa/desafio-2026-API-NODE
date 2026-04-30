-- Enable Row Level Security on both tables.
-- This blocks all direct access via Supabase's auto-generated PostgREST API.
-- Our Express API connects with the postgres/service role which bypasses RLS,
-- so it is NOT affected by these policies.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

-- Deny all anon/authenticated access via PostgREST (no permissive policies = deny by default).
-- Only the service role (our Express API) can read/write these tables.
