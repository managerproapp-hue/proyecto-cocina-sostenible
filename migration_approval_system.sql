-- 🛡️ REPAIR SCRIPT FOR ACCESS APPROVAL SYSTEM

-- 1. Ensure 'status' column exists and has correct default
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'status') then
    alter table public.profiles add column status text default 'pending';
  else
    alter table public.profiles alter column status set default 'pending';
  end if;
end $$;

-- 2. Clean up old/broken RLS policies
drop policy if exists "Admins ven todos los perfiles" on public.profiles;
drop policy if exists "Usuarios gestionan su propio perfil" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- 3. CREATE NEW ROBUST POLICIES

-- ADMIN POLICY: Full access for managerproapp@gmail.com
create policy "Admins ven todos los perfiles" 
on public.profiles for all 
using (auth.jwt() ->> 'email' = 'managerproapp@gmail.com');

-- USER POLICY: Users can see and manage their own profile (crucial for initial creation and status check)
create policy "Usuarios gestionan su propio perfil" 
on public.profiles for all 
using (auth.uid() = id)
with check (auth.uid() = id);

-- 4. Ensure existing admin is approved
update public.profiles set status = 'approved' where email = 'managerproapp@gmail.com';

-- 5. OPTIONAL: Check if there's any conflicting trigger
-- If you see errors about "on_auth_user_created" in your Supabase logs, 
-- you might need to check your database triggers.
