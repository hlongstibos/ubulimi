-- Ubulimi V1 — sale integrity guards.
--
-- record_sale() now refuses a second sale on the same animal and only
-- sells an animal whose status is currently 'active'. void_sale() undoes
-- a mistaken sale: it deletes the sale row and puts the animal back to
-- 'active' (owner only). The audit-log trigger records both the insert
-- and the delete.
--
-- Run once in the Supabase SQL Editor.

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
  v_farm_id uuid := public.current_farm_id();
  v_status text;
  v_sale_id uuid;
begin
  select status into v_status
    from public.animals
    where id = p_animal_id and farm_id = v_farm_id;

  if v_status is null then
    raise exception 'Animal not found for the current farm';
  end if;

  if v_status <> 'active' then
    raise exception
      'Only an active animal can be sold (this one is "%"). Change its status first if that was a mistake.',
      v_status;
  end if;

  if exists (select 1 from public.sales where animal_id = p_animal_id) then
    raise exception 'A sale is already recorded for this animal.';
  end if;

  insert into public.sales (farm_id, animal_id, buyer, price, sale_date, history_snapshot)
    values (v_farm_id, p_animal_id, p_buyer, p_price, p_sale_date, p_history_snapshot)
    returning id into v_sale_id;

  update public.animals
    set status = 'sold'
    where id = p_animal_id and farm_id = v_farm_id;

  return v_sale_id;
end;
$$;

create or replace function public.void_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_farm_id uuid := public.current_farm_id();
  v_animal_id uuid;
begin
  if public.current_role() <> 'owner' then
    raise exception 'Only an owner can remove a sale.';
  end if;

  select animal_id into v_animal_id
    from public.sales
    where id = p_sale_id and farm_id = v_farm_id;

  if v_animal_id is null then
    raise exception 'Sale not found for the current farm';
  end if;

  delete from public.sales where id = p_sale_id and farm_id = v_farm_id;

  update public.animals
    set status = 'active'
    where id = v_animal_id and farm_id = v_farm_id and status = 'sold';
end;
$$;
