-- 🛠️ NUCLEAR REPAIR FOR AUTH & PROFILES
-- Ejecuta este script si los alumnos NO logran entrar o si el profesor NO ve las solicitudes.

-- 1. DROP ALL OLD TRIGGERS (Common culprits for rollback)
-- Esto eliminará cualquier lógica antigua que estuviera bloqueando registros.
do $$
declare
  trig record;
begin
  for trig in (select trigger_name, event_object_table 
               from information_schema.triggers 
               where event_object_schema = 'public' 
               and (event_object_table = 'profiles' or event_object_table = 'auth.users')) 
  loop
    execute 'drop trigger if exists ' || trig.trigger_name || ' on public.' || trig.event_object_table;
  end loop;
end $$;

-- 2. Asegurar esquema de 'profiles'
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'status') then
    alter table public.profiles add column status text default 'pending';
  else
    alter table public.profiles alter column status set default 'pending';
  end if;
end $$;

-- 3. Limpiar políticas de seguridad (Evitar bloqueos)
drop policy if exists "Admins ven todos los perfiles" on public.profiles;
drop policy if exists "Usuarios gestionan su propio perfil" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;

-- 4. Crear políticas DEFINITIVAS
-- ADMIN: Acceso total para managerproapp@gmail.com
create policy "Admins ven todos los perfiles" 
on public.profiles for all 
using (auth.jwt() ->> 'email' = 'managerproapp@gmail.com');

-- USUARIO: Permiso TOTAL de inserción y lectura para el propio usuario (Crucial para el primer login)
create policy "Usuarios gestionan su propio perfil" 
on public.profiles for all 
using (auth.uid() = id)
with check (auth.uid() = id);

-- 5. Dar permisos de inserción pública (Si fuera necesario para el primer guardado)
-- alter table public.profiles enable row level security; -- (Ya debería estar)

-- 6. Forzar Admin
update public.profiles set status = 'approved' where email = 'managerproapp@gmail.com';
