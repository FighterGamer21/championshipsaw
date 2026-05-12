
-- Roles enum & table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Player status enum
CREATE TYPE public.player_status AS ENUM (
  'REGISTERED','CHECKED_IN','ALIVE','QUALIFIED','ELIMINATED','SEMI_FINALIST','FINALIST','TOP_3','CHAMPION','DISQUALIFIED','SPECTATOR'
);

CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ign TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  minecraft_version TEXT NOT NULL,
  timezone TEXT NOT NULL,
  can_attend_all_days BOOLEAN NOT NULL DEFAULT true,
  status player_status NOT NULL DEFAULT 'REGISTERED',
  current_day INT NOT NULL DEFAULT 0,
  current_round TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_at TIMESTAMPTZ
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Public can register (insert) but only with REGISTERED status
CREATE POLICY "Anyone can register" ON public.players FOR INSERT TO anon, authenticated WITH CHECK (status = 'REGISTERED');
-- Public live view (limited fields handled in app, but allow select for live page)
CREATE POLICY "Public can view players" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage players" ON public.players FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete players" ON public.players FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Rounds
CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INT NOT NULL,
  round_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view rounds" ON public.rounds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage rounds" ON public.rounds FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Eliminations
CREATE TABLE public.eliminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  day INT NOT NULL,
  round_name TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.eliminations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view eliminations" ON public.eliminations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage eliminations" ON public.eliminations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Settings (single-row keyed)
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  current_day INT NOT NULL DEFAULT 0,
  current_round TEXT,
  event_status TEXT NOT NULL DEFAULT 'upcoming',
  api_key TEXT,
  event_start_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (id, registration_open, event_status, event_start_at)
VALUES (1, true, 'upcoming', now() + INTERVAL '7 days');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eliminations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
