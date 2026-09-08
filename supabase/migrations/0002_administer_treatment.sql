-- Ubulimi V1 — atomic "record a treatment" operation.
--
-- Decrementing medicine stock and inserting the treatments row must
-- succeed or fail together. Doing them as two separate client writes
-- could race or leave stock decremented with no treatment recorded (or
-- vice versa). Both live here in one SECURITY DEFINER function, called
-- via supabase.rpc('administer_treatment', ...).
--
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run), same as 0001_init.sql.

create or replace function public.administer_treatment(
  p_animal_id uuid,
  p_medicine_id uuid,
  p_health_event_id uuid,
  p_dosage text,
  p_quantity numeric
) returns uuid
language plpgsql
security definer
as $$
declare
  v_treatment_id uuid;
begin
  update public.medicine_inventory
    set stock_qty = stock_qty - p_quantity
    where id = p_medicine_id and farm_id = public.current_farm_id();

  -- No row updated means the medicine doesn't belong to the caller's
  -- farm — stop before inserting an orphan treatment row.
  if not found then
    raise exception 'medicine % not found for the current farm', p_medicine_id;
  end if;

  insert into public.treatments (farm_id, health_event_id, animal_id, medicine_id, dosage, administered_by)
    values (public.current_farm_id(), p_health_event_id, p_animal_id, p_medicine_id, p_dosage, auth.uid())
    returning id into v_treatment_id;

  return v_treatment_id;
end;
$$;
