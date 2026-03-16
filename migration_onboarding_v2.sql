-- 🏗️ MIGRATION: ADVANCED ONBOARDING & PRACTICE PROJECTS
-- Adds support for role-specific codes and practice projects.

-- 1. Add project type to teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'official' CHECK (type IN ('official', 'practice'));

-- 2. Add role codes to teams
-- Format: { "coordinador": "CODE1", "visual": "CODE2", ... }
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS role_codes JSONB DEFAULT '{
  "coordinador": null,
  "visual": null,
  "digital": null,
  "comunicacion": null,
  "produccion": null
}'::jsonb;

-- 3. Ensure profiles has brigada_role and target_name (for pre-assignment)
-- target_name will store the name assigned in Phase 1 before the student actually joins.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brigada_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_name TEXT;

-- 4. Function to find a team by role code
-- This helps in the joining process.
CREATE OR REPLACE FUNCTION public.get_team_by_role_code(search_code TEXT)
RETURNS TABLE (team_id UUID, role_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, key
    FROM public.teams t, jsonb_each_text(t.role_codes)
    WHERE value = search_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
