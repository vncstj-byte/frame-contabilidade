-- =============================================
-- FRAME Finance - Esquema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Tabela de perfis (vinculada ao auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'cliente' check (role in ('admin', 'gestor', 'cliente')),
  fee_mensal numeric,
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  data_vencimento date,
  created_at timestamptz default now()
);

-- 2. Tabela de clientes
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  nome_empresa text not null,
  cnpj text,
  endereco text,
  nome_socio text,
  cpf_socio text,
  tipo_contrato text check (tipo_contrato in ('Pack', 'Mensal', 'Anual')),
  valor_contrato numeric,
  prazo_contrato text,
  data_inicio_contrato date,
  data_termino_contrato date,
  contrato_url text,
  user_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Tabela de lançamentos financeiros
create table public.financial_entries (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id),
  reference_month text not null,
  entry_type text not null check (entry_type in ('Receita', 'Despesa')),
  category_group text not null check (category_group in ('Honorários', 'Impostos', 'Time', 'Infraestrutura', 'Comercial')),
  category text not null,
  amount numeric not null,
  description text,
  entry_date date not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tabela de atualizações do dashboard
create table public.dashboard_updates (
  id uuid default gen_random_uuid() primary key,
  reference_month text not null,
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id)
);

-- =============================================
-- FUNÇÃO: Criar perfil automaticamente ao registrar
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para criar perfil ao registrar
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.financial_entries enable row level security;
alter table public.dashboard_updates enable row level security;

-- Profiles: usuários veem seu próprio perfil, admins/gestores veem todos
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'gestor')
    )
  );

create policy "Admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'gestor')
    )
  );

-- Clients: admins/gestores podem tudo, clientes veem só o seu
create policy "Admins can manage clients"
  on public.clients for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'gestor')
    )
  );

create policy "Clients can view own record"
  on public.clients for select
  using (user_id = auth.uid());

-- Financial Entries: admins/gestores podem tudo, clientes veem só os seus
create policy "Admins can manage entries"
  on public.financial_entries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'gestor')
    )
  );

create policy "Clients can view own entries"
  on public.financial_entries for select
  using (client_id = auth.uid());

-- Dashboard Updates: admins/gestores podem tudo
create policy "Admins can manage dashboard updates"
  on public.dashboard_updates for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'gestor')
    )
  );
