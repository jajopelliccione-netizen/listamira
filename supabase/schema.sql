-- Lista Mira — schema Supabase
-- Incolla TUTTO questo file in Supabase → SQL Editor → Run.
-- PRIMA sostituisci 'LA-TUA-EMAIL-ADMIN@esempio.it' con l'email dell'utente admin (riga "admin_email" più sotto).

create table if not exists public.qr_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  label      text not null check (char_length(label) between 1 and 60),
  active     boolean not null default true,
  scans      int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id         uuid primary key default gen_random_uuid(),
  text       text not null check (char_length(text) between 10 and 1000),
  category   text not null,
  place      text not null,
  qr_id      uuid references public.qr_codes(id) on delete set null,
  status     text not null default 'nuova' check (status in ('nuova','letta','in programma','realizzata','archiviata')),
  -- orario arrotondato al minuto: nessun dato che identifichi chi scrive
  created_at timestamptz not null default date_trunc('minute', now())
);

alter table public.qr_codes  enable row level security;
alter table public.proposals enable row level security;

-- Unico amministratore: SOLO questa email può leggere/modificare le tabelle.
-- (Chi non è loggato — cioè tutti gli studenti — non può leggere nulla.)
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'LA-TUA-EMAIL-ADMIN@esempio.it'   -- << admin_email
$$;

drop policy if exists admin_qr   on public.qr_codes;
drop policy if exists admin_prop on public.proposals;
create policy admin_qr   on public.qr_codes  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_prop on public.proposals for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Gli studenti non toccano le tabelle: passano solo da queste due funzioni,
-- che verificano il QR lato server.

-- 1) Il QR è valido? Restituisce il nome del posto (o null) e conta la scansione.
create or replace function public.check_qr(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare v_label text;
begin
  update qr_codes set scans = scans + 1
   where code = p_code and active
   returning label into v_label;
  return v_label;
end $$;

-- 2) Invia una proposta anonima: accettata solo con QR attivo.
create or replace function public.submit_proposal(p_code text, p_text text, p_category text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_qr qr_codes%rowtype; v_text text := btrim(coalesce(p_text, ''));
begin
  select * into v_qr from qr_codes where code = p_code and active;
  if not found then raise exception 'qr_invalid'; end if;
  if char_length(v_text) < 10 or char_length(v_text) > 1000 then raise exception 'text_invalid'; end if;
  -- anti-spam: massimo 20 proposte al minuto per ogni QR
  if (select count(*) from proposals where qr_id = v_qr.id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate_limited';
  end if;
  insert into proposals (text, category, place, qr_id)
  values (v_text, left(coalesce(nullif(btrim(p_category), ''), 'Altro'), 40), v_qr.label, v_qr.id);
  return true;
end $$;

revoke all on function public.check_qr(text) from public;
revoke all on function public.submit_proposal(text, text, text) from public;
grant execute on function public.check_qr(text) to anon, authenticated;
grant execute on function public.submit_proposal(text, text, text) to anon, authenticated;
