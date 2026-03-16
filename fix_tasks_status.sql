-- Script para asegurar que la tabla tasks tiene la columna status y recargar la caché
-- Ejecuta esto en el SQL Editor de Supabase

-- Añadir columna status si no existe
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Forzar la recarga de la caché de PostgREST para que la API detecte la columna nueva
NOTIFY pgrst, 'reload schema';

-- Fin del script
