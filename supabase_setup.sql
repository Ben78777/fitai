-- Run this once in the Supabase SQL editor to create the meal_entries table.
-- Row-level security is enforced at the application layer (Spring Boot JWT filter),
-- so RLS is not enabled here for the MVP.

create table if not exists meal_entries (
    id          uuid primary key default gen_random_uuid(),
    user_id     text        not null,
    date        date        not null,
    meal_type   text        not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name   text        not null,
    quantity_g  numeric(10,2) not null check (quantity_g > 0),
    calories    numeric(10,2) not null check (calories >= 0),
    protein_g   numeric(10,2) not null check (protein_g >= 0),
    carbs_g     numeric(10,2) not null check (carbs_g >= 0),
    fat_g       numeric(10,2) not null check (fat_g >= 0),
    created_at  timestamptz default now()
);

-- Index speeds up the common query: all entries for a user on a given day
create index if not exists idx_meal_entries_user_date
    on meal_entries (user_id, date);
