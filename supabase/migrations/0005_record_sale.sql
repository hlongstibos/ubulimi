-- Ubulimi V1 — atomic "record a sale" operation.
--
-- Same pattern as administer_treatment() / administer_vaccination() /
-- log_feeding_event(): one SECURITY DEFINER function so the sales insert
-- and the animals.status change ('sold') happen together.
--
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run), same as the earlier migrations.

create or replace function public.record_sale(
  p_animal_id uuid,
  p_buyer text,
  p_price numeric,
  p_sale_date date,
  p_history_snapshot jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
  v_sale_id uuid;
begin
  insert into public.sales (farm_id, animal_id, buyer, price, sale_date, history_snapshot)
    values (public.current_farm_id(), p_animal_id, p_buyer, p_price, p_sale_date, p_history_snapshot)
    returning id into v_sale_id;

  update public.animals
    set status = 'sold'
    where id = p_animal_id and farm_id = public.current_farm_id();

  return v_sale_id;
end;
$$;
