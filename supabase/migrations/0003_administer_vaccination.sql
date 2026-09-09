-- Ubulimi V1 — vaccination logging + the "due & overdue" view.
--
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run), same as 0001_init.sql and 0002.

-- ============ administer_vaccination() ============
-- Parallel to administer_treatment(): one SECURITY DEFINER function so the
-- vaccination_records insert and the medicine stock decrement happen
-- together. Looks the booster interval and linked medicine up from the
-- type row rather than trusting the client to pass them.

create or replace function public.administer_vaccination(
  p_animal_id uuid,
  p_vaccination_type_id uuid,
  p_quantity numeric default 1
) returns uuid
language plpgsql
security definer
as $$
declare
  v_farm_id uuid := public.current_farm_id();
  v_type public.vaccination_types%rowtype;
  v_next_due date;
  v_record_id uuid;
begin
  select * into v_type
    from public.vaccination_types
    where id = p_vaccination_type_id and farm_id = v_farm_id;

  if not found then
    raise exception 'vaccination type % not found for the current farm', p_vaccination_type_id;
  end if;

  if v_type.booster_interval_days is not null then
    v_next_due := current_date + v_type.booster_interval_days;
  end if;

  if v_type.linked_medicine_id is not null then
    update public.medicine_inventory
      set stock_qty = stock_qty - p_quantity
      where id = v_type.linked_medicine_id and farm_id = v_farm_id;

    if not found then
      raise exception 'linked medicine % not found for the current farm', v_type.linked_medicine_id;
    end if;
  end if;

  insert into public.vaccination_records
      (farm_id, animal_id, vaccination_type_id, administered_by, next_due_date)
    values (v_farm_id, p_animal_id, p_vaccination_type_id, auth.uid(), v_next_due)
    returning id into v_record_id;

  return v_record_id;
end;
$$;

-- ============ vaccinations_due view ============
-- One row per (active animal, applicable vaccination type) that is due:
--   * never vaccinated for that type, animal old enough for the initial
--     dose (or the type sets no minimum age); OR
--   * the most recent record's next_due_date is within 7 days or past.
--
-- security_invoker = true so the caller's RLS on animals / vaccination_types
-- / vaccination_records applies — the view is farm-scoped automatically.

create or replace view public.vaccinations_due
with (security_invoker = true) as
with latest as (
  select distinct on (animal_id, vaccination_type_id)
    animal_id,
    vaccination_type_id,
    next_due_date
  from public.vaccination_records
  order by animal_id, vaccination_type_id, administered_at desc
)
select
  a.farm_id,
  a.id                          as animal_id,
  a.tag_id,
  a.species,
  vt.id                         as vaccination_type_id,
  vt.name                       as vaccination_type_name,
  case when l.animal_id is null then 'initial' else 'booster' end as reason,
  l.next_due_date               as due_date
from public.animals a
join public.vaccination_types vt
  on vt.farm_id = a.farm_id
 and a.species = any (vt.target_species)
left join latest l
  on l.animal_id = a.id
 and l.vaccination_type_id = vt.id
where a.status = 'active'
  and (
    (
      l.animal_id is null
      and (
        vt.initial_dose_age_days is null
        or (a.dob is not null and a.dob <= current_date - vt.initial_dose_age_days)
      )
    )
    or (
      l.animal_id is not null
      and l.next_due_date is not null
      and l.next_due_date <= current_date + 7
    )
  );

grant select on public.vaccinations_due to anon, authenticated;
