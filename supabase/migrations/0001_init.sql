-- Ubulimi V1 schema
-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Postgres 13+ (Supabase default) includes gen_random_uuid() natively — no extension needed.

-- ============ FARMS & PROFILES ============

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  full_name text,
  role text not null check (role in ('owner', 'worker')),
  created_at timestamptz not null default now()
);

-- Helper functions used by RLS policies below.
-- SECURITY DEFINER lets these bypass RLS on profiles when looking up the
-- caller's own row, which avoids recursive policy checks.
create or replace function public.current_farm_id()
returns uuid
language sql
security definer
stable
as $$
  select farm_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============ CAMPS ============

create table if not exists public.camps (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ============ ANIMALS ============
-- last_mating_date / expected_birth_date added per the August 2026 survey
-- analysis — the most repeated unprompted feature request.

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  tag_id text not null,
  species text not null,
  breed text,
  dob date,
  sex text,
  camp_id uuid references public.camps(id) on delete set null,
  status text not null default 'active',
  last_mating_date date,
  expected_birth_date date,
  created_at timestamptz not null default now(),
  unique (farm_id, tag_id)
);

-- ============ MEDICINE INVENTORY (+ owner-only cost split) ============

create table if not exists public.medicine_inventory (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  type text not null check (type in ('treatment', 'vaccine')),
  treats_conditions text[] not null default '{}',
  stock_qty numeric not null default 0,
  unit text not null default 'units',
  expiry_date date,
  restock_threshold numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Cost/supplier is the one field workers shouldn't see. RLS is row-level,
-- not column-level, so this lives in its own table rather than being hidden
-- app-side, which would rely on the frontend behaving rather than the database.
create table if not exists public.medicine_costs (
  medicine_id uuid primary key references public.medicine_inventory(id) on delete cascade,
  cost numeric,
  supplier text
);

-- ============ HEALTH EVENTS & TREATMENTS ============

create table if not exists public.health_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  logged_by uuid references public.profiles(id),
  symptoms text[] not null default '{}',
  notes text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  health_event_id uuid references public.health_events(id) on delete set null,
  animal_id uuid not null references public.animals(id) on delete cascade,
  medicine_id uuid not null references public.medicine_inventory(id),
  dosage text,
  administered_by uuid references public.profiles(id),
  administered_at timestamptz not null default now()
);

-- ============ FEED INVENTORY & FEEDING EVENTS ============

create table if not exists public.feed_inventory (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  type text not null check (type in ('roughage', 'concentrate', 'lick-mineral', 'lick-protein', 'lick-production')),
  stock_qty numeric not null default 0,
  unit text not null default 'kg',
  cost numeric,
  restock_threshold numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.feeding_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  camp_id uuid not null references public.camps(id) on delete cascade,
  feed_id uuid not null references public.feed_inventory(id),
  quantity numeric not null,
  logged_by uuid references public.profiles(id),
  logged_at timestamptz not null default now()
);

-- ============ VACCINATION TYPES & RECORDS ============

create table if not exists public.vaccination_types (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  target_species text[] not null default '{}',
  linked_medicine_id uuid references public.medicine_inventory(id),
  initial_dose_age_days integer,
  booster_interval_days integer,
  created_at timestamptz not null default now()
);

create table if not exists public.vaccination_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  vaccination_type_id uuid not null references public.vaccination_types(id),
  administered_by uuid references public.profiles(id),
  administered_at timestamptz not null default now(),
  next_due_date date
);

-- ============ SALES (owner-only) ============

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id),
  buyer text,
  price numeric,
  sale_date date not null default current_date,
  history_snapshot jsonb,
  created_at timestamptz not null default now()
);

-- ============ AUDIT LOG ============
-- Every write to the tables below lands here automatically via trigger.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid,
  table_name text not null,
  record_id uuid,
  action text not null,
  user_id uuid,
  changed_at timestamptz not null default now()
);

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_log (farm_id, table_name, record_id, action, user_id)
  values (
    coalesce(new.farm_id, old.farm_id),
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_animals after insert or update or delete on public.animals
  for each row execute function public.log_audit_event();
create trigger audit_health_events after insert or update or delete on public.health_events
  for each row execute function public.log_audit_event();
create trigger audit_treatments after insert or update or delete on public.treatments
  for each row execute function public.log_audit_event();
create trigger audit_vaccination_records after insert or update or delete on public.vaccination_records
  for each row execute function public.log_audit_event();
create trigger audit_sales after insert or update or delete on public.sales
  for each row execute function public.log_audit_event();

-- ============ ROW LEVEL SECURITY ============

alter table public.farms enable row level security;
alter table public.profiles enable row level security;
alter table public.camps enable row level security;
alter table public.animals enable row level security;
alter table public.medicine_inventory enable row level security;
alter table public.medicine_costs enable row level security;
alter table public.health_events enable row level security;
alter table public.treatments enable row level security;
alter table public.feed_inventory enable row level security;
alter table public.feeding_events enable row level security;
alter table public.vaccination_types enable row level security;
alter table public.vaccination_records enable row level security;
alter table public.sales enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: a user can see their own profile and teammates on the same farm
create policy "profiles_select_own_farm" on public.profiles
  for select using (farm_id = public.current_farm_id());

-- Farms: readable by members of that farm
create policy "farms_select_member" on public.farms
  for select using (id = public.current_farm_id());

-- Shared tables: both roles get full read/write, scoped to their own farm
create policy "camps_all_farm" on public.camps
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "animals_all_farm" on public.animals
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "medicine_inventory_all_farm" on public.medicine_inventory
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "health_events_all_farm" on public.health_events
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "treatments_all_farm" on public.treatments
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "feed_inventory_all_farm" on public.feed_inventory
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "feeding_events_all_farm" on public.feeding_events
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "vaccination_types_all_farm" on public.vaccination_types
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

create policy "vaccination_records_all_farm" on public.vaccination_records
  for all using (farm_id = public.current_farm_id()) with check (farm_id = public.current_farm_id());

-- Owner-only: sales
create policy "sales_owner_only" on public.sales
  for all using (farm_id = public.current_farm_id() and public.current_role() = 'owner')
  with check (farm_id = public.current_farm_id() and public.current_role() = 'owner');

-- Owner-only: medicine cost/supplier details
create policy "medicine_costs_owner_only" on public.medicine_costs
  for all using (
    exists (
      select 1 from public.medicine_inventory m
      where m.id = medicine_costs.medicine_id
      and m.farm_id = public.current_farm_id()
    ) and public.current_role() = 'owner'
  )
  with check (
    exists (
      select 1 from public.medicine_inventory m
      where m.id = medicine_costs.medicine_id
      and m.farm_id = public.current_farm_id()
    ) and public.current_role() = 'owner'
  );

-- Audit log: owner-only, read-only from the app (writes only ever come from the trigger)
create policy "audit_log_owner_read" on public.audit_log
  for select using (farm_id = public.current_farm_id() and public.current_role() = 'owner');

-- ============ MANUAL SETUP PER PILOT FARM ============
-- V1 has no self-service signup. For each pilot farm:
--
-- 1. In the Supabase Dashboard: Authentication → Users → Add user
--    (create one for the owner, one for the worker, with email + password)
-- 2. Then run, filling in the real values:
--
--    insert into public.farms (name) values ('Example Farm') returning id;
--
--    insert into public.profiles (id, farm_id, full_name, role) values
--      ('<owner-auth-user-uuid>', '<farm-id-from-above>', 'Owner Name', 'owner'),
--      ('<worker-auth-user-uuid>', '<farm-id-from-above>', 'Worker Name', 'worker');
