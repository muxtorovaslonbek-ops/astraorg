CREATE TABLE public.telegram_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  telegram_id bigint not null,
  chat_id bigint not null,
  first_name text,
  last_name text,
  username text,
  photo_url text,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
CREATE INDEX idx_telegram_codes_code ON public.telegram_codes (code) WHERE NOT used;
GRANT ALL ON public.telegram_codes TO service_role;
ALTER TABLE public.telegram_codes ENABLE ROW LEVEL SECURITY;