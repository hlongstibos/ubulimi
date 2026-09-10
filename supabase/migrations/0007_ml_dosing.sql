-- Ubulimi V1 — millilitre-based treatment dosing.
--
-- Treatment doses are entered in millilitres. Liquid medicine stock is
-- kept in ml or L; administer_treatment() deducts the ml dose, dividing
-- by 1000 when the stock unit is litres. Any other unit is treated 1:1.
-- treatments.dose_ml records the numeric dose.
--
-- The function signature changes (a single p_dose_ml numeric replaces
-- p_dosage text + p_quantity numeric), so the old version is dropped
-- first. Run this together with the matching frontend deploy.
--
-- Run once in the Supabase SQL Editor.

alter table public.treatments
  add column if not exists dose_ml numeric;

drop function if exists public.administer_treatment(uuid, uuid, uuid, text, numeric);

create or replace function public.administer_treatment(
  p_animal_id uuid,
  p_medicine_id uuid,
  p_health_event_id uuid,
  p_dose_ml numeric
) returns uuid
language plpgsql
security definer
as $$
declare
  v_farm_id uuid := public.current_farm_id();
  v_unit text;
  v_deduct numeric;
  v_treatment_id uuid;
begin
  select unit into v_unit
    from public.medicine_inventory
    where id = p_medicine_id and farm_id = v_farm_id;

  if v_unit is null then
    raise exception 'medicine % not found for the current farm', p_medicine_id;
  end if;

  -- Dose is in ml. Convert only when stock is measured in litres.
  v_deduct := case
    when lower(v_unit) in ('l', 'litre', 'litres', 'liter', 'liters')
      then p_dose_ml / 1000.0
    else p_dose_ml
  end;

  update public.medicine_inventory
    set stock_qty = stock_qty - v_deduct
    where id = p_medicine_id and farm_id = v_farm_id;

  insert into public.treatments
      (farm_id, health_event_id, animal_id, medicine_id, dosage, dose_ml, administered_by)
    values (
      v_farm_id, p_health_event_id, p_animal_id, p_medicine_id,
      p_dose_ml || ' ml', p_dose_ml, auth.uid()
    )
    returning id into v_treatment_id;

  return v_treatment_id;
end;
$$;
