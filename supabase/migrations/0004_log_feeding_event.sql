-- Ubulimi V1 — atomic "log a feeding" operation.
--
-- Parallel to administer_treatment() / administer_vaccination(): one
-- SECURITY DEFINER function so the feeding_events insert and the
-- feed_inventory stock decrement happen together. Feeding is scoped to a
-- camp, not an individual animal.
--
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run), same as the earlier migrations.

create or replace function public.log_feeding_event(
  p_camp_id uuid,
  p_feed_id uuid,
  p_quantity numeric
) returns uuid
language plpgsql
security definer
as $$
declare
  v_farm_id uuid := public.current_farm_id();
  v_event_id uuid;
begin
  if not exists (
    select 1 from public.camps
    where id = p_camp_id and farm_id = v_farm_id
  ) then
    raise exception 'camp % not found for the current farm', p_camp_id;
  end if;

  update public.feed_inventory
    set stock_qty = stock_qty - p_quantity
    where id = p_feed_id and farm_id = v_farm_id;

  if not found then
    raise exception 'feed % not found for the current farm', p_feed_id;
  end if;

  insert into public.feeding_events (farm_id, camp_id, feed_id, quantity, logged_by)
    values (v_farm_id, p_camp_id, p_feed_id, p_quantity, auth.uid())
    returning id into v_event_id;

  return v_event_id;
end;
$$;
