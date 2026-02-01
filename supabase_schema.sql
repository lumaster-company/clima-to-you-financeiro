-- Enable UUID extension
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. Transactions Table
--------------------------------------------------------------------------------
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  date date not null,
  status text check (status in ('pending', 'paid', 'overdue')) not null,
  is_fiscal boolean default false,
  tax_amount numeric,
  contract_id uuid, -- Optional link to a contract
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table transactions enable row level security;

-- Drop existing policies to avoid errors or duplication
drop policy if exists "Allow all operations for public" on transactions;
drop policy if exists "Allow all operations for authenticated" on transactions;

-- Create secure policy
create policy "Allow all operations for authenticated" on transactions
  for all to authenticated using (true) with check (true);


--------------------------------------------------------------------------------
-- 2. Employees Table
--------------------------------------------------------------------------------
create table if not exists employees (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  type text check (type in ('CLT', 'Sócio')) not null,
  base_salary numeric,
  benefits_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table employees enable row level security;

drop policy if exists "Allow all operations for public" on employees;
drop policy if exists "Allow all operations for authenticated" on employees;

create policy "Allow all operations for authenticated" on employees
  for all to authenticated using (true) with check (true);


--------------------------------------------------------------------------------
-- 3. Fixed Costs Table
--------------------------------------------------------------------------------
create table if not exists fixed_costs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  amount numeric not null,
  due_day integer not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table fixed_costs enable row level security;

drop policy if exists "Allow all operations for public" on fixed_costs;
drop policy if exists "Allow all operations for authenticated" on fixed_costs;

create policy "Allow all operations for authenticated" on fixed_costs
  for all to authenticated using (true) with check (true);


--------------------------------------------------------------------------------
-- 4. Categories Table
--------------------------------------------------------------------------------
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name, type)
);

alter table categories enable row level security;

drop policy if exists "Allow all operations for public" on categories;
drop policy if exists "Allow all operations for authenticated" on categories;

create policy "Allow all operations for authenticated" on categories
  for all to authenticated using (true) with check (true);


--------------------------------------------------------------------------------
-- 5. Contracts Table
--------------------------------------------------------------------------------
create table if not exists contracts (
  id uuid default uuid_generate_v4() primary key,
  client_name text not null,
  cnpj text not null,
  type text check (type in ('PMOC', 'Manutenção', 'Outro')) not null,
  client_type text check (client_type in ('Comercial', 'Residencial')) not null,
  value numeric not null,
  billing_frequency text check (billing_frequency in ('Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual')) not null,
  start_date date not null,
  end_date date,
  duration_months integer check (duration_months in (12, 24)) not null,
  status text check (status in ('Ativo', 'Encerrado', 'Perdido')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table contracts enable row level security;

drop policy if exists "Allow all operations for public" on contracts;
drop policy if exists "Allow all operations for authenticated" on contracts;

create policy "Allow all operations for authenticated" on contracts
  for all to authenticated using (true) with check (true);


--------------------------------------------------------------------------------
-- 6. Allowed Users Table (Whitelist)
--------------------------------------------------------------------------------
create table if not exists allowed_users (
  email text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table allowed_users enable row level security;

drop policy if exists "Allow public read access" on allowed_users;
drop policy if exists "Allow all operations for public" on allowed_users;
drop policy if exists "Allow all operations for authenticated" on allowed_users;

-- Public read needed for login check (before full session is strictly validated by context in some flows)
-- Or authenticated read if user is at least logged in to Supabase (User is 'authenticated' role even if not in whitelist yet)
create policy "Allow public read access" on allowed_users
  for select using (true);

-- Allow authenticated users (who are in the list) to manage it
create policy "Allow all operations for authenticated" on allowed_users
  for all to authenticated using (true) with check (true);

-- Initial Seed (Idempotent)
insert into allowed_users (email) values 
  ('lumaster.company1023@gmail.com'),
  ('climatoyou@gmail.com')
on conflict (email) do nothing;
