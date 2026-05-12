
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'owner')
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('owner','admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_above(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('owner','admin','moderator'))
$$;

-- Bans
CREATE TABLE IF NOT EXISTS public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ign text NOT NULL,
  discord_username text,
  reason text NOT NULL DEFAULT '',
  banned_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS bans_ign_lower_idx ON public.bans (lower(ign));
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage bans" ON public.bans;
CREATE POLICY "Admins manage bans" ON public.bans FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid())) WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_ign_banned(_ign text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bans
    WHERE lower(ign) = lower(_ign) AND (banned_until IS NULL OR banned_until > now())
  )
$$;

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category public.post_category NOT NULL DEFAULT 'announcement',
  banner_url text,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_published_idx ON public.posts (is_published, created_at DESC);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view published posts" ON public.posts;
CREATE POLICY "Public view published posts" ON public.posts FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_moderator_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins manage posts" ON public.posts;
CREATE POLICY "Admins manage posts" ON public.posts FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid())) WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS posts_touch ON public.posts;
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Settings expansion
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS event_name text NOT NULL DEFAULT 'ARCTIXMC CHAMPIONSHIP — SEASON 1',
  ADD COLUMN IF NOT EXISTS server_ip text NOT NULL DEFAULT 'play.arctixmc.net',
  ADD COLUMN IF NOT EXISTS homepage_title text NOT NULL DEFAULT 'ARCTIXMC CHAMPIONSHIP — SEASON 1',
  ADD COLUMN IF NOT EXISTS homepage_subtitle text NOT NULL DEFAULT '3 Days. 6 Rounds. 1 Champion.',
  ADD COLUMN IF NOT EXISTS max_registrations integer,
  ADD COLUMN IF NOT EXISTS rules_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prize_details text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS discord_link text,
  ADD COLUMN IF NOT EXISTS store_link text,
  ADD COLUMN IF NOT EXISTS footer_text text NOT NULL DEFAULT 'ARCTIXMC — Season 1',
  ADD COLUMN IF NOT EXISTS visible_sections jsonb NOT NULL DEFAULT '{"news":true,"featured":true,"event_details":true,"schedule":true,"rules":true,"top3":true,"champion":true}'::jsonb;

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Block banned IGN registrations
CREATE OR REPLACE FUNCTION public.players_block_banned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_ign_banned(NEW.ign) THEN
    RAISE EXCEPTION 'BANNED' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS players_block_banned_trg ON public.players;
CREATE TRIGGER players_block_banned_trg BEFORE INSERT ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.players_block_banned();

-- Tighten user_roles policies
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Owner manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "Admin owner read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR auth.uid() = user_id);

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('post-banners','post-banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "post banners public read" ON storage.objects;
CREATE POLICY "post banners public read" ON storage.objects FOR SELECT USING (bucket_id = 'post-banners');
DROP POLICY IF EXISTS "post banners admin write" ON storage.objects;
CREATE POLICY "post banners admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-banners' AND public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "post banners admin update" ON storage.objects;
CREATE POLICY "post banners admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-banners' AND public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "post banners admin delete" ON storage.objects;
CREATE POLICY "post banners admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-banners' AND public.is_admin_or_owner(auth.uid()));
