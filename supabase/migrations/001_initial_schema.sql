-- ============================================================
-- Rezzi — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- HOUSEHOLDS
-- ============================================================
create table if not exists public.households (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text not null unique,
  created_at   timestamptz not null default now()
);

comment on table public.households is 'Shared household group for a couple';

-- ============================================================
-- PROFILES
-- One per Supabase auth user
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid references public.households(id) on delete set null,
  display_name  text not null,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profile linked to Supabase auth';

-- ============================================================
-- HELPER FUNCTION — my_household_id()
-- Returns the household_id for the currently authenticated user.
-- Used in RLS policies so each user only sees their household data.
-- ============================================================
create or replace function public.my_household_id()
  returns uuid
  language sql
  security definer
  stable
as $$
  select household_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- RECIPES
-- ============================================================
create table if not exists public.recipes (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households(id) on delete cascade,
  created_by       uuid not null references auth.users(id),
  title            text not null,
  description      text,
  image_url        text,
  source_url       text,
  prep_time_mins   integer check (prep_time_mins >= 0),
  cook_time_mins   integer check (cook_time_mins >= 0),
  servings         integer check (servings > 0),
  ingredients      jsonb not null default '[]'::jsonb,
  steps            jsonb not null default '[]'::jsonb,
  is_favorite      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.recipes is 'Core recipe data';
comment on column public.recipes.ingredients is '[{amount, unit, name, group?}]';
comment on column public.recipes.steps is '[{order, instruction, image_url?}]';

create index if not exists recipes_household_id_idx on public.recipes(household_id);
create index if not exists recipes_created_by_idx on public.recipes(created_by);
create index if not exists recipes_is_favorite_idx on public.recipes(household_id, is_favorite);

-- ============================================================
-- TAGS
-- ============================================================
create table if not exists public.tags (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  color         text not null default '#e8572a',
  created_at    timestamptz not null default now(),
  unique (household_id, name)
);

comment on table public.tags is 'Household-scoped recipe labels';

create index if not exists tags_household_id_idx on public.tags(household_id);

-- ============================================================
-- RECIPE_TAGS (many-to-many)
-- ============================================================
create table if not exists public.recipe_tags (
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- ============================================================
-- MEAL_PLANS
-- ============================================================
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create table if not exists public.meal_plans (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  recipe_id      uuid references public.recipes(id) on delete set null,
  custom_title   text,
  planned_date   date not null,
  meal_type      public.meal_type not null,
  servings       integer check (servings > 0),
  notes          text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.meal_plans is 'One row per planned meal slot';

create index if not exists meal_plans_household_date_idx on public.meal_plans(household_id, planned_date);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_recipes_updated
  before update on public.recipes
  for each row execute procedure public.handle_updated_at();

create trigger on_meal_plans_updated
  before update on public.meal_plans
  for each row execute procedure public.handle_updated_at();

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.households    enable row level security;
alter table public.profiles      enable row level security;
alter table public.recipes       enable row level security;
alter table public.tags          enable row level security;
alter table public.recipe_tags   enable row level security;
alter table public.meal_plans    enable row level security;

-- ---- HOUSEHOLDS ----
-- Users can see their own household
create policy "households_select" on public.households
  for select using (id = public.my_household_id());

-- Only allow insert via trusted code (signup flow uses service role or RPC)
-- Authenticated users can insert a new household (for signup)
create policy "households_insert" on public.households
  for insert with check (true);

-- Members can update their household name
create policy "households_update" on public.households
  for update using (id = public.my_household_id());

-- ---- PROFILES ----
-- Users can read profiles in their household
create policy "profiles_select" on public.profiles
  for select using (household_id = public.my_household_id() or id = auth.uid());

-- Users can only insert their own profile
create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());

-- Users can only update their own profile
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid());

-- ---- RECIPES ----
create policy "recipes_select" on public.recipes
  for select using (household_id = public.my_household_id());

create policy "recipes_insert" on public.recipes
  for insert with check (household_id = public.my_household_id());

create policy "recipes_update" on public.recipes
  for update using (household_id = public.my_household_id());

create policy "recipes_delete" on public.recipes
  for delete using (household_id = public.my_household_id());

-- ---- TAGS ----
create policy "tags_select" on public.tags
  for select using (household_id = public.my_household_id());

create policy "tags_insert" on public.tags
  for insert with check (household_id = public.my_household_id());

create policy "tags_update" on public.tags
  for update using (household_id = public.my_household_id());

create policy "tags_delete" on public.tags
  for delete using (household_id = public.my_household_id());

-- ---- RECIPE_TAGS ----
-- Allow access based on the related recipe's household
create policy "recipe_tags_select" on public.recipe_tags
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.household_id = public.my_household_id()
    )
  );

create policy "recipe_tags_insert" on public.recipe_tags
  for insert with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.household_id = public.my_household_id()
    )
  );

create policy "recipe_tags_delete" on public.recipe_tags
  for delete using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.household_id = public.my_household_id()
    )
  );

-- ---- MEAL_PLANS ----
create policy "meal_plans_select" on public.meal_plans
  for select using (household_id = public.my_household_id());

create policy "meal_plans_insert" on public.meal_plans
  for insert with check (household_id = public.my_household_id());

create policy "meal_plans_update" on public.meal_plans
  for update using (household_id = public.my_household_id());

create policy "meal_plans_delete" on public.meal_plans
  for delete using (household_id = public.my_household_id());

-- ============================================================
-- REALTIME — enable for recipes and meal_plans
-- ============================================================
alter publication supabase_realtime add table public.recipes;
alter publication supabase_realtime add table public.meal_plans;
alter publication supabase_realtime add table public.recipe_tags;
