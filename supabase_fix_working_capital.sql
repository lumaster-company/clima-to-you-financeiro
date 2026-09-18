-- ==============================================================================
-- SCRIPT DE CORREÇÃO E BLINDAGEM DO CAPITAL DE GIRO E PERSISTÊNCIA NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Tabela de Contas de Capital de Giro (financial_accounts)
create table if not exists financial_accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  balance numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table financial_accounts enable row level security;
drop policy if exists "Allow all operations for authenticated" on financial_accounts;
drop policy if exists "Allow all operations for public" on financial_accounts;
drop policy if exists "Allow all operations for anon" on financial_accounts;

create policy "Allow all operations for authenticated" on financial_accounts
  for all to authenticated using (true) with check (true);
create policy "Allow all operations for anon" on financial_accounts
  for all to anon using (true) with check (true);


-- 2. Tabela de Movimentações / Transferências (financial_transfers)
create table if not exists financial_transfers (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('Aporte', 'Resgate', 'Transferência')) not null,
  amount numeric not null,
  reason text,
  origin_account_id uuid references financial_accounts(id),
  destination_account_id uuid references financial_accounts(id),
  transfer_date timestamp with time zone default now() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table financial_transfers enable row level security;
drop policy if exists "Allow all operations for authenticated" on financial_transfers;
drop policy if exists "Allow all operations for public" on financial_transfers;
drop policy if exists "Allow all operations for anon" on financial_transfers;

create policy "Allow all operations for authenticated" on financial_transfers
  for all to authenticated using (true) with check (true);
create policy "Allow all operations for anon" on financial_transfers
  for all to anon using (true) with check (true);


-- 3. Tabela de Configurações do Capital de Giro (financial_settings)
create table if not exists financial_settings (
  id uuid default uuid_generate_v4() primary key,
  global_goal numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table financial_settings enable row level security;
drop policy if exists "Allow all operations for authenticated" on financial_settings;
drop policy if exists "Allow all operations for public" on financial_settings;
drop policy if exists "Allow all operations for anon" on financial_settings;

create policy "Allow all operations for authenticated" on financial_settings
  for all to authenticated using (true) with check (true);
create policy "Allow all operations for anon" on financial_settings
  for all to anon using (true) with check (true);


-- 4. Habilitar Supabase Realtime para sincronização instantânea entre sessões e máquinas
do $$
begin
  alter publication supabase_realtime add table financial_accounts;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table financial_transfers;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table financial_settings;
exception when others then null;
end $$;
