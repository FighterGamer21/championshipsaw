
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.player_status ADD VALUE IF NOT EXISTS 'BANNED';

DO $$ BEGIN
  CREATE TYPE public.post_category AS ENUM ('announcement','event_update','result','rule_update','prize_update','maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
