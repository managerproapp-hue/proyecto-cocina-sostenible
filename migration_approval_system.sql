-- Migration to add status column and update RLS for the new approval system

-- 1. Add status column to profiles if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'status') then
    alter table public.profiles add column status text default 'pending';
  end if;
end $$;

-- 2. Update existing profiles (ensure admin is approved)
update public.profiles set status = 'approved' where rol = 'admin' or email = 'managerproapp@gmail.com';

-- 3. Update RLS policies for profiles to allow users to see their own status
-- and allow admins to update statuses
drop policy if exists "Admins ven todos los perfiles" on public.profiles;
create policy "Admins ven todos los perfiles" on public.profiles for all using (
  auth.jwt() ->> 'email' = 'managerproapp@gmail.com'
);

-- 4. Create a policy for students to update their own profile during onboarding (only if approved or to set initial data)
drop policy if exists "Usuarios gestionan su propio perfil" on public.profiles;
create policy "Usuarios gestionan su propio perfil" on public.profiles for all using (
  auth.uid() = id
);
