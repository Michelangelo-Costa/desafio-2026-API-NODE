CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_tokenHash_key
  ON public.password_reset_tokens("tokenHash");

CREATE INDEX IF NOT EXISTS password_reset_tokens_userId_idx
  ON public.password_reset_tokens("userId");

ALTER TABLE public.password_reset_tokens
  ADD CONSTRAINT password_reset_tokens_userId_fkey
  FOREIGN KEY ("userId") REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;
