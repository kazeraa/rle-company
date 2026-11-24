-- Apply to the existing main Supabase project: ammwiparzahttzyswlcu.
-- The 33 registration rows are already present in this project; do not import them again.

alter table public.registrations
    alter column source_registration_id set default gen_random_uuid()::text;

create unique index if not exists members_source_registration_id_key
    on public.members (source_registration_id);

-- The previous trigger referenced NEW.id, but this project's key is
-- registrations.source_registration_id.
create or replace function public.add_approved_registration_to_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
    assigned_member_id text;
    linked_source_id text;
    next_member_number bigint;
begin
    if new.status <> 'approved' then
        return new;
    end if;

    perform pg_advisory_xact_lock(724812345);

    select member.id
    into assigned_member_id
    from public.members as member
    where member.source_registration_id = new.source_registration_id;

    if assigned_member_id is null and new.member_id is not null then
        select member.id, member.source_registration_id
        into assigned_member_id, linked_source_id
        from public.members as member
        where member.id = new.member_id;

        if assigned_member_id is not null
            and linked_source_id is not null
            and linked_source_id <> new.source_registration_id then
            raise exception 'Member ID % is linked to another registration', assigned_member_id;
        end if;
    end if;

    if assigned_member_id is null then
        select coalesce(max(substring(member.id from '^RLE-([0-9]+)$')::bigint), 0) + 1
        into next_member_number
        from public.members as member;

        assigned_member_id := 'RLE-' || lpad(next_member_number::text, 6, '0');
        insert into public.members (
            id,
            name,
            division,
            status,
            source_registration_id
        )
        values (
            assigned_member_id,
            new.nick_name,
            'Driver',
            'ACTIVE',
            new.source_registration_id
        );
    else
        update public.members
        set source_registration_id = new.source_registration_id
        where id = assigned_member_id
            and source_registration_id is null;
    end if;

    update public.registrations
    set member_id = assigned_member_id
    where source_registration_id = new.source_registration_id
        and member_id is distinct from assigned_member_id;

    return new;
end;
$function$;

revoke all on function public.add_approved_registration_to_members() from public;

drop trigger if exists registrations_sync_approved_member on public.registrations;
create trigger registrations_sync_approved_member
    after insert or update of status on public.registrations
    for each row
    execute function public.add_approved_registration_to_members();

create or replace function public.approve_registration(p_registration_id text)
returns text
language plpgsql
set search_path = ''
as $function$
declare
    assigned_member_id text;
begin
    update public.registrations
    set status = 'approved'
    where source_registration_id = p_registration_id;

    if not found then
        raise exception 'Registration not found';
    end if;

    select registration.member_id
    into assigned_member_id
    from public.registrations as registration
    where registration.source_registration_id = p_registration_id;

    return assigned_member_id;
end;
$function$;

revoke all on function public.approve_registration(text) from public;
revoke all on function public.approve_registration(text) from anon;
grant execute on function public.approve_registration(text) to authenticated;

update public.registrations
set status = status
where status = 'approved'
    and member_id is null;

notify pgrst, 'reload schema';
