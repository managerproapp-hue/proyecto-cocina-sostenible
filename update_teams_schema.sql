-- 🏗️ MIGRATION: ROLE ASSIGNMENTS
-- Adds a JSONB column to the teams table to store the names of members assigned to each role.

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS role_assignments JSONB DEFAULT '{
  "coordinador": null,
  "visual": null,
  "digital": null,
  "comunicacion": null,
  "produccion": null
}'::jsonb;

-- Update RLS to allow members to read team assignments
DROP POLICY IF EXISTS "Cualquier usuario autenticado ve equipos" ON public.teams;
CREATE POLICY "Cualquier usuario autenticado ve equipos"
ON public.teams FOR SELECT
TO authenticated
USING (true);
