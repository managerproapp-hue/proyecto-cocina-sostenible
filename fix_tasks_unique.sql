-- Añadir restricción única en tasks para (team_id, task_number)
-- Esto es necesario para que funcione el UPSERT al guardar las fases.

ALTER TABLE public.tasks ADD CONSTRAINT unique_team_task UNIQUE (team_id, task_number);
