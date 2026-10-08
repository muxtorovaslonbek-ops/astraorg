create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users see own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

alter table public.profiles add column status text not null default 'pending' check (status in ('pending','approved','rejected'));
alter table public.profiles add column email text;

create policy "Admins view all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update all profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Only admins may change status
create or replace function public.guard_profile_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and not public.has_role(auth.uid(), 'admin') then
    new.status := old.status;
  end if;
  return new;
end $$;
create trigger guard_profile_status before update on public.profiles for each row execute function public.guard_profile_status();

create or replace function public.guard_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin') then
    new.status := 'pending';
  end if;
  return new;
end $$;
create trigger guard_profile_insert before insert on public.profiles for each row execute function public.guard_profile_insert();

-- Auto-create profile on signup; first ever user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_admin boolean;
begin
  first_admin := not exists (select 1 from public.user_roles where role = 'admin');
  insert into public.profiles (id, display_name, avatar_url, provider, email, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    case when new.email like '%@telegram.astra.local' then null else new.email end,
    case when first_admin then 'approved' else 'pending' end
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  if first_admin then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Backfill existing users
insert into public.profiles (id, email, provider)
select u.id, u.email, coalesce(u.raw_app_meta_data->>'provider','email') from auth.users u
on conflict (id) do update set email = excluded.email;
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users order by created_at limit 1 on conflict do nothing;
update public.profiles set status = 'approved' where id in (select user_id from public.user_roles where role = 'admin');