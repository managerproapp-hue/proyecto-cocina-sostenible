-- 🤝 MIGRATION: INTERNAL COLLABORATION & GUEST ROLES
-- This script adds support for Professor Invitado and Peer-to-Peer help within teams.

-- 1. Create Suggestions Table (Tablón de Consenso / Ayuda)
create table if not exists public.user_suggestions (
    id uuid default gen_random_uuid() primary key,
    team_id uuid references public.teams(id) on delete cascade,
    from_id uuid references public.profiles(id) on delete cascade,
    to_id uuid references public.profiles(id) on delete cascade, -- Null if it's for the whole team
    task_id uuid references public.tasks(id) on delete cascade, -- Optional
    message text not null,
    status text default 'unread', -- unread, read, addressed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Task Permissions Table (Internal Help Authorization)
create table if not exists public.task_permissions (
    id uuid default gen_random_uuid() primary key,
    granter_id uuid references public.profiles(id) on delete cascade,
    grantee_id uuid references public.profiles(id) on delete cascade,
    task_id uuid references public.tasks(id) on delete cascade,
    status text default 'pending', -- pending, approved, revoked
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(granter_id, grantee_id, task_id)
);

-- 3. Enable RLS on new tables
alter table public.user_suggestions enable row level security;
alter table public.task_permissions enable row level security;

-- 4. RLS Policies for Suggestions
create policy "Users can see suggestions for their team"
on public.user_suggestions for select
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.team_id = user_suggestions.team_id
    ) or (auth.jwt() ->> 'email' = 'managerproapp@gmail.com')
);

create policy "Users can create suggestions for their team"
on public.user_suggestions for insert
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.team_id = user_suggestions.team_id
    )
);

-- 5. RLS Policies for Task Permissions
create policy "Users can see their own grants"
on public.task_permissions for select
using (auth.uid() = granter_id or auth.uid() = grantee_id);

create policy "Users can manage their own grants"
on public.task_permissions for all
using (auth.uid() = granter_id);

-- 6. Support for 'invitado' role in existing policies
-- Note: We assume 'invitado' is a value in profiles.rol
-- We need to update existing policies to allow 'invitado' read access.

-- Example update (Admin policies usually check email, we can add role check too)
-- create policy "Invitados can view everything" on public.profiles for select ...
