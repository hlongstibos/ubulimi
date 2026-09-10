-- Ubulimi V1 — medicine dosage reference fields + animal weight.
--
-- Supports transcribing dosing information straight off the product label
-- and (later) a per-animal dose calculator. All columns are nullable and
-- additive — no functions or existing data change.
--
-- Run once in the Supabase SQL Editor.

alter table public.medicine_inventory
  add column if not exists label_dosage_instructions text,
  add column if not exists dose_per_kg numeric,
  add column if not exists dose_unit text;

comment on column public.medicine_inventory.label_dosage_instructions is
  'Exact dosing wording transcribed from the product label.';
comment on column public.medicine_inventory.dose_per_kg is
  'Clean per-kilogram dose figure — only when the label gives one.';
comment on column public.medicine_inventory.dose_unit is
  'Unit for dose_per_kg, e.g. ml, mg, tablet.';

alter table public.animals
  add column if not exists estimated_weight_kg numeric;

comment on column public.animals.estimated_weight_kg is
  'Estimated live weight in kilograms, for dose calculation.';
