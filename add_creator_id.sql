-- Añadir creator_id a la tabla teams para identificar permanentemente al líder
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.profiles(id);

-- Opcional: Actualizar equipos existentes (si es posible, asumiendo que el primer miembro fue el creador)
-- UPDATE public.teams t SET creator_id = (SELECT id FROM public.profiles p WHERE p.team_id = t.id ORDER BY p.created_at ASC LIMIT 1) WHERE creator_id IS NULL;
