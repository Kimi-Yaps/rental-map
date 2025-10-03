create table public.profiles (
  id uuid not null,
  full_name text null,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  nickname text null,
  user_type jsonb null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
);

-- The following indexes seem to be referencing a 'user_id' column which is not present in the schema provided.
-- I will comment them out for now. If 'user_id' is intended, the schema needs to be updated.
-- create index IF not exists idx_profiles_user_id on public.profiles using btree (user_id) TABLESPACE pg_default;

-- The following index references 'user_type ->> 'type'::text' which is valid for jsonb.
create index IF not exists idx_profiles_user_type_type on public.profiles using btree (((user_type ->> 'type'::text))) TABLESPACE pg_default;
