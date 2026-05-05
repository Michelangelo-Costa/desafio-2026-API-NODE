ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE INDEX IF NOT EXISTS species_createdById_idx
  ON public.species("createdById");

ALTER TABLE public.species
  ADD CONSTRAINT species_createdById_fkey
  FOREIGN KEY ("createdById") REFERENCES public.users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
