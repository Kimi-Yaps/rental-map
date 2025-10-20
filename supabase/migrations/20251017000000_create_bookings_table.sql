create table public.bookings (
  id bigint generated always as identity not null,
  property_id uuid not null,
  owner_id uuid not null,
  tenant_id uuid not null,
  booking_status jsonb not null default '{"current_status": "pending", "payment_status": "unpaid", "special_requests": null, "additional_guests": null, "cancellation_reason": null, "confirmation_status": "awaiting_confirmation"}'::jsonb,
  check_in_date date not null,
  check_out_date date not null,
  total_guests integer not null,
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bookings_pkey primary key (id),
  constraint unique_booking unique (property_id, check_in_date, check_out_date),
  constraint bookings_tenant_id_fkey foreign KEY (tenant_id) references auth.users (id) on delete CASCADE,
  constraint bookings_total_guests_check check ((total_guests > 0)),
  constraint check_dates check ((check_out_date > check_in_date))
) TABLESPACE pg_default;

create index IF not exists idx_bookings_property_id on public.bookings using btree (property_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_tenant_id on public.bookings using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_check_in_date on public.bookings using btree (check_in_date) TABLESPACE pg_default;

create index IF not exists idx_bookings_check_out_date on public.bookings using btree (check_out_date) TABLESPACE pg_default;

-- The function validate_booking_status() needs to be created for this trigger to work.
-- CREATE OR REPLACE FUNCTION validate_booking_status() RETURNS TRIGGER AS $$
-- BEGIN
--   -- Add your validation logic here
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- create trigger booking_status_validation BEFORE INSERT
-- or
-- update on bookings for EACH row
-- execute FUNCTION validate_booking_status ();
