-- Apply to the existing main Supabase project: ammwiparzahttzyswlcu.
-- The 33 registration rows are already present in this project; do not import them again.

alter table public.registrations
    alter column source_registration_id set default gen_random_uuid()::text;

create unique index if not exists members_source_registration_id_key
    on public.members (source_registration_id);

drop trigger if exists registrations_sync_approved_member on public.registrations;

create or replace function public.approve_registration(p_registration_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
    registration_name text;
    registration_nickname text;
    assigned_member_id text;
    candidate_member_number bigint;
begin
    perform pg_advisory_xact_lock(724812345);

    select registration.member_id, registration.full_name, registration.nick_name
    into assigned_member_id, registration_name, registration_nickname
    from public.registrations as registration
    where registration.source_registration_id = p_registration_id
    for update;

    if not found then
        raise exception 'Registration not found';
    end if;

    if assigned_member_id is null then
        select greatest(
            coalesce(max(substring(member.id from '^RLE-([0-9]+)$')::bigint), 0),
            coalesce((
                select max(substring(registration.member_id from '^RLE-([0-9]+)$')::bigint)
                from public.registrations as registration
                where registration.member_id is not null
            ), 0)
        ) + 1
        into candidate_member_number
        from public.members as member;

        loop
            assigned_member_id := 'RLE-' || lpad(candidate_member_number::text, 6, '0');

            if not exists (select 1 from public.members where id = assigned_member_id)
                and not exists (select 1 from public.registrations where member_id = assigned_member_id) then
                exit;
            end if;

            candidate_member_number := candidate_member_number + 1;
        end loop;

        insert into public.members (id, name, division, status, source_registration_id)
        values (
            assigned_member_id,
            coalesce(nullif(btrim(registration_nickname), ''), nullif(btrim(registration_name), '')),
            'Driver',
            'ACTIVE',
            p_registration_id
        );
    else
        update public.members
        set name = coalesce(nullif(btrim(registration_nickname), ''), nullif(btrim(registration_name), '')),
            status = 'ACTIVE',
            source_registration_id = coalesce(source_registration_id, p_registration_id)
        where id = assigned_member_id;
    end if;

    update public.registrations
    set status = 'approved',
        member_id = assigned_member_id
    where source_registration_id = p_registration_id;

    return assigned_member_id;
end;
$function$;

revoke all on function public.approve_registration(text) from public;
revoke all on function public.approve_registration(text) from anon;
grant execute on function public.approve_registration(text) to authenticated;

create or replace function public.create_member(
    p_member_id text,
    p_name text,
    p_division text,
    p_status text
)
returns table (id text, name text, division text, status text, joined date)
language plpgsql
security definer
set search_path = ''
as $function$
declare
    assigned_member_id text;
    candidate_member_number bigint;
begin
    if not exists (
        select 1
        from public.profiles as profile
        where profile.id = auth.uid()
            and upper(profile.role) in ('OWNER', 'ADMIN', 'MANAGEMENT')
    ) then
        raise exception 'Admin or Management access required';
    end if;

    if nullif(btrim(p_name), '') is null or nullif(btrim(p_division), '') is null then
        raise exception 'Name and division are required';
    end if;

    if upper(p_status) not in ('ACTIVE', 'INACTIVE') then
        raise exception 'Invalid member status';
    end if;

    perform pg_advisory_xact_lock(724812345);
    assigned_member_id := nullif(upper(btrim(coalesce(p_member_id, ''))), '');

    if assigned_member_id is null then
        select greatest(
            coalesce(max(substring(member.id from '^RLE-([0-9]+)$')::bigint), 0),
            coalesce((
                select max(substring(registration.member_id from '^RLE-([0-9]+)$')::bigint)
                from public.registrations as registration
                where registration.member_id is not null
            ), 0)
        ) + 1
        into candidate_member_number
        from public.members as member;

        loop
            assigned_member_id := 'RLE-' || lpad(candidate_member_number::text, 6, '0');
            exit when not exists (select 1 from public.members where members.id = assigned_member_id)
                and not exists (select 1 from public.registrations where registrations.member_id = assigned_member_id);
            candidate_member_number := candidate_member_number + 1;
        end loop;
    elsif exists (
        select 1
        from public.registrations as registration
        where registration.member_id = assigned_member_id
    ) then
        raise exception using
            errcode = '23505',
            message = 'ID anggota sudah dipakai oleh pendaftar lain: ' || assigned_member_id;
    end if;

    insert into public.members (id, name, division, status, joined)
    values (assigned_member_id, btrim(p_name), btrim(p_division), upper(p_status), current_date);

    return query
    select member.id, member.name, member.division, member.status, member.joined
    from public.members as member
    where member.id = assigned_member_id;
exception
    when unique_violation then
        raise exception using
            errcode = '23505',
            message = 'ID anggota sudah digunakan: ' || coalesce(assigned_member_id, p_member_id);
end;
$function$;

revoke all on function public.create_member(text, text, text, text) from public;
revoke all on function public.create_member(text, text, text, text) from anon;
grant execute on function public.create_member(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
