create table public.store_settings (
  id uuid not null default uuid_generate_v4() primary key,
  setting_key text not null unique,
  setting_value text not null,
  description text null,
  updated_at timestamp with time zone default now()
) tablespace pg_default;

-- Insert default whatsapp number
insert into public.store_settings (setting_key, setting_value, description)
values ('whatsapp_number', '6374241896', 'Phone number used for direct WhatsApp orders')
on conflict (setting_key) do nothing;

alter table public.store_settings enable row level security;

-- Policies
create policy "Anyone reads store settings" on store_settings for select using (true);
create policy "Admins can update store settings" on store_settings for all using (is_admin());

-- Realtime
alter publication supabase_realtime add table store_settings;
