-- Security hardening: every SECURITY DEFINER function runs with the
-- privileges of its owner, but until now none of them pinned search_path.
-- That leaves them exposed to "search path hijacking" — if a lower-privilege
-- role were ever able to create objects in a schema that resolves before
-- public (e.g. a same-named function or table), calls made without an
-- explicit schema, inside a SECURITY DEFINER body, could silently resolve
-- to the attacker's object instead of the real one.
--
-- Every function below already fully schema-qualifies its own references
-- (public.profiles, public.animals, auth.uid(), ...), so pinning an empty
-- search_path is safe — nothing in these bodies relies on an implicit
-- schema lookup — and it closes the gap for good. This is also exactly
-- what Supabase's own database linter flags as "Function Search Path
-- Mutable" for a SECURITY DEFINER function.
--
-- Additive only: changes function configuration, not behavior or signature.

alter function public.current_farm_id() set search_path = '';
alter function public.current_role() set search_path = '';
alter function public.log_audit_event() set search_path = '';
alter function public.administer_treatment(uuid, uuid, uuid, numeric) set search_path = '';
alter function public.administer_vaccination(uuid, uuid, numeric) set search_path = '';
alter function public.log_feeding_event(uuid, uuid, numeric) set search_path = '';
alter function public.record_sale(uuid, text, numeric, date, jsonb) set search_path = '';
alter function public.void_sale(uuid) set search_path = '';
