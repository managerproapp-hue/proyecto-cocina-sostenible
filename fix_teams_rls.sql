-- 🤝 FIX: PERMISOS PARA CREAR EQUIPOS (RLS)
-- Este script permite que los alumnos aprobados puedan crear su propio equipo/restaurante.

-- 1. Asegurar que RLS está activo
alter table public.teams enable row level security;

-- 2. Limpiar políticas antiguas para evitar conflictos
drop policy if exists "Admin ve todos los equipos" on public.teams;
drop policy if exists "Cualquier usuario autenticado ve equipos" on public.teams;
drop policy if exists "Usuarios aprobados crean equipos" on public.teams;
drop policy if exists "Miembros actualizan su equipo" on public.teams;

-- 3. Crear políticas DEFINITIVAS

-- ADMIN: Control total para managerproapp@gmail.com
create policy "Admin control total sobre equipos"
on public.teams for all
using (auth.jwt() ->> 'email' = 'managerproapp@gmail.com');

-- LECTURA: Todos los alumnos autenticados pueden ver los equipos (necesario para unirse con código)
create policy "Cualquier usuario autenticado ve equipos"
on public.teams for select
to authenticated
using (true);

-- INSERCIÓN: Solo alumnos con estado 'approved' pueden CREAR un equipo
create policy "Usuarios aprobados crean equipos"
on public.teams for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and status = 'approved'
  )
);

-- ACTUALIZACIÓN: Los alumnos solo pueden editar su propio equipo si ya están vinculados a él
create policy "Miembros actualizan su equipo"
on public.teams for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and team_id = teams.id
  )
);

-- NOTA: Si el administrador no ve a alguien para aprobar, es porque ya está aprobado.
-- Los alumnos en la pantalla de "Crear Proyecto" ya están aprobados en el sistema (profiles.status = 'approved').
