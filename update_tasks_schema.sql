-- Migración para añadir el sistema de bloqueo a las tareas
-- Este script añade la columna is_locked a la tabla de tasks y asegura que se pueda usar para el dashboard interactivo.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Opcional: Si quieres que el admin sea el único que pueda modificar el bloqueo mediante RLS,
-- podrías añadir políticas, pero por ahora lo manejaremos por la interfaz y Upsert.

-- Asegurar que la tabla de tasks tenga una restricción única por equipo y número de tarea para usar UPSERT
-- ALTER TABLE tasks ADD CONSTRAINT unique_team_task UNIQUE (team_id, task_number);
-- Nota: Si ya existe una pk o constraint similar, omite este paso.
