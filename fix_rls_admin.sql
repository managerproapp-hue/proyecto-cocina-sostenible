-- Este script soluciona el problema de "recursión infinita" en las reglas RLS
-- de Supabase, que estaba bloqueando que el administrador viera los datos.

drop policy if exists "Admins ven todos los perfiles" on public.profiles;
create policy "Admins ven todos los perfiles" on public.profiles for select using (
  auth.jwt() ->> 'email' = 'managerproapp@gmail.com'
);

drop policy if exists "Solo admin edita config" on public.config;
create policy "Solo admin edita config" on public.config for all using (
  auth.jwt() ->> 'email' = 'managerproapp@gmail.com'
);

drop policy if exists "Admin ve todos los equipos" on public.teams;
create policy "Admin ve todos los equipos" on public.teams for select using (
  auth.jwt() ->> 'email' = 'managerproapp@gmail.com'
);

drop policy if exists "Admin tiene control total sobre tareas" on public.tasks;
create policy "Admin tiene control total sobre tareas" on public.tasks for all using (
  auth.jwt() ->> 'email' = 'managerproapp@gmail.com'
);

drop policy if exists "Admin edita todos los platos" on public.platos;
create policy "Admin edita todos los platos" on public.platos for all using (
  auth.jwt() ->> 'email' = 'managerproapp@gmail.com'
);
