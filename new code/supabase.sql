-- Run this file in Supabase SQL Editor.
-- Setup:
-- 1. Run this SQL in the Supabase project's SQL Editor.
-- 2. Create Admin/Management email-password users in Authentication.
-- 3. Run the matching role-grant statement at the bottom for each user.
-- 4. Set the Project URL and anon/publishable key in ../config.js.

create table if not exists public.members (
    id text primary key check (id = upper(id)),
    name text not null,
    division text not null,
    status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
    joined date not null default current_date
);

create table if not exists public.identity_admins (
    user_id uuid primary key references auth.users (id) on delete cascade,
    role text not null check (role in ('ADMIN', 'MANAGEMENT'))
);

alter table public.members enable row level security;
alter table public.identity_admins enable row level security;

revoke all on public.members from anon, authenticated;
revoke all on public.identity_admins from anon, authenticated;
grant select, insert, delete on public.members to authenticated;
grant select on public.identity_admins to authenticated;

drop policy if exists "Admins can read members" on public.members;
create policy "Admins can read members"
    on public.members for select to authenticated
    using (
        exists (
            select 1
            from public.identity_admins as admins
            where admins.user_id = auth.uid()
                and admins.role in ('ADMIN', 'MANAGEMENT')
        )
    );

drop policy if exists "Admins can add members" on public.members;
create policy "Admins can add members"
    on public.members for insert to authenticated
    with check (
        exists (
            select 1
            from public.identity_admins as admins
            where admins.user_id = auth.uid()
                and admins.role in ('ADMIN', 'MANAGEMENT')
        )
    );

drop policy if exists "Admins can remove members" on public.members;
create policy "Admins can remove members"
    on public.members for delete to authenticated
    using (
        exists (
            select 1
            from public.identity_admins as admins
            where admins.user_id = auth.uid()
                and admins.role in ('ADMIN', 'MANAGEMENT')
        )
    );

drop policy if exists "Users can read their own role" on public.identity_admins;
create policy "Users can read their own role"
    on public.identity_admins for select to authenticated
    using (user_id = auth.uid());

create or replace function public.verify_rle_member(lookup_id text)
returns table (
    id text,
    name text,
    division text,
    status text,
    joined date
)
language sql
stable
security definer
set search_path = ''
as $$
    select member.id, member.name, member.division, member.status, member.joined
    from public.members as member
    where member.id = upper(trim(lookup_id))
    limit 1
$$;

revoke all on function public.verify_rle_member(text) from public;
grant execute on function public.verify_rle_member(text) to anon, authenticated;

insert into public.members (id, name, division, status, joined)
values
    ('RLE-000001', 'Rizal', 'Founder', 'ACTIVE', '2026-01-12'),
    ('RLE-000002', 'GIPA22', 'Management', 'ACTIVE', '2026-02-03'),
    ('RLE-000003', 'Kazeraa', 'Senior Driver', 'ACTIVE', '2026-02-18'),
    ('RLE-000004', 'Tegar', 'Driver', 'ACTIVE', '2026-03-02'),
    ('RLE-000005', 'Verdade De Lucas', 'Driver', 'ACTIVE', '2026-03-15')
on conflict (id) do nothing;

-- After creating users in Supabase Authentication, grant their roles:
-- insert into public.identity_admins (user_id, role)
-- select id, 'ADMIN' from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do update set role = excluded.role;
--
-- insert into public.identity_admins (user_id, role)
-- select id, 'MANAGEMENT' from auth.users where email = 'manager@example.com'
-- on conflict (user_id) do update set role = excluded.role;

notify pgrst, 'reload schema';
