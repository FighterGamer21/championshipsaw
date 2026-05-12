-- Stable admin RPC v2 functions with simple argument names for PostgREST.
-- Run this in Supabase SQL editor, then redeploy. The NOTIFY reloads Supabase's schema cache.

CREATE OR REPLACE FUNCTION public.admin_set_player_status_v2(
  player_id uuid,
  status public.player_status,
  current_day integer DEFAULT NULL,
  current_round text DEFAULT NULL
)
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.players;
BEGIN
  IF NOT public.is_moderator_or_above(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.players
  SET
    status = admin_set_player_status_v2.status,
    current_day = COALESCE(admin_set_player_status_v2.current_day, players.current_day),
    current_round = COALESCE(admin_set_player_status_v2.current_round, players.current_round),
    checked_in_at = CASE
      WHEN admin_set_player_status_v2.status = 'CHECKED_IN' AND checked_in_at IS NULL THEN now()
      ELSE checked_in_at
    END
  WHERE id = player_id
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN RAISE EXCEPTION 'Player not found'; END IF;

  IF admin_set_player_status_v2.status IN ('ELIMINATED', 'DISQUALIFIED') THEN
    INSERT INTO public.eliminations (player_id, day, round_name, reason)
    VALUES (
      updated.id,
      GREATEST(updated.current_day, 1),
      COALESCE(updated.current_round, 'Unknown'),
      CASE WHEN admin_set_player_status_v2.status = 'DISQUALIFIED' THEN 'Disqualified' ELSE 'Eliminated' END
    );
  END IF;

  RETURN updated;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_player_v2(player_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_id uuid;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  DELETE FROM public.players WHERE id = player_id RETURNING id INTO deleted_id;
  IF deleted_id IS NULL THEN RAISE EXCEPTION 'Player not found'; END IF;
  RETURN deleted_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_ban_player_v2(player_id uuid)
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.players;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO target FROM public.players WHERE id = player_id;
  IF target.id IS NULL THEN RAISE EXCEPTION 'Player not found'; END IF;
  INSERT INTO public.bans (ign, discord_username, reason, banned_until)
  VALUES (target.ign, NULLIF(target.discord_username, ''), 'Banned by admin', NULL);
  UPDATE public.players SET status = 'BANNED' WHERE id = player_id RETURNING * INTO target;
  RETURN target;
END $$;

CREATE OR REPLACE FUNCTION public.admin_start_round_v2(day integer, round_name text)
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_round public.rounds;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;

  UPDATE public.rounds
  SET status = 'active', started_at = now(), ended_at = NULL
  WHERE rounds.round_name = admin_start_round_v2.round_name
  RETURNING * INTO updated_round;

  IF updated_round.id IS NULL THEN
    INSERT INTO public.rounds (day, round_name, status, started_at)
    VALUES (admin_start_round_v2.day, admin_start_round_v2.round_name, 'active', now())
    RETURNING * INTO updated_round;
  END IF;

  UPDATE public.settings
  SET current_day = admin_start_round_v2.day,
      current_round = admin_start_round_v2.round_name,
      event_status = 'live',
      updated_at = now()
  WHERE id = 1;

  UPDATE public.players
  SET current_day = admin_start_round_v2.day,
      current_round = admin_start_round_v2.round_name
  WHERE status IN ('CHECKED_IN', 'ALIVE', 'QUALIFIED', 'SEMI_FINALIST', 'FINALIST', 'TOP_3');

  RETURN updated_round;
END $$;

CREATE OR REPLACE FUNCTION public.admin_end_round_v2(round_name text)
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_round public.rounds;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.rounds
  SET status = 'completed', ended_at = now()
  WHERE rounds.round_name = admin_end_round_v2.round_name
  RETURNING * INTO updated_round;
  IF updated_round.id IS NULL THEN RAISE EXCEPTION 'Round has not been started yet'; END IF;
  RETURN updated_round;
END $$;

CREATE OR REPLACE FUNCTION public.admin_select_top3_v2()
RETURNS SETOF public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ids uuid[];
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT array_agg(id) INTO ids
  FROM (SELECT id FROM public.players WHERE status IN ('ALIVE', 'QUALIFIED', 'FINALIST') ORDER BY registered_at LIMIT 3) s;
  IF ids IS NULL OR array_length(ids, 1) < 3 THEN RAISE EXCEPTION 'Need at least 3 alive players to select Top 3'; END IF;
  RETURN QUERY UPDATE public.players SET status = 'TOP_3' WHERE id = ANY(ids) RETURNING *;
END $$;

CREATE OR REPLACE FUNCTION public.admin_declare_champion_v2()
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  champ public.players;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO champ FROM public.players WHERE status = 'TOP_3' ORDER BY registered_at LIMIT 1;
  IF champ.id IS NULL THEN RAISE EXCEPTION 'No TOP_3 players to declare champion from'; END IF;
  UPDATE public.players SET status = 'CHAMPION' WHERE id = champ.id RETURNING * INTO champ;
  UPDATE public.settings SET event_status = 'completed', updated_at = now() WHERE id = 1;
  RETURN champ;
END $$;

CREATE OR REPLACE FUNCTION public.admin_save_post_v2(
  post_id uuid,
  title text,
  slug text,
  excerpt text,
  content text,
  category public.post_category,
  banner_url text,
  is_published boolean,
  is_featured boolean
)
RETURNS public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  saved public.posts;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;

  IF post_id IS NULL THEN
    INSERT INTO public.posts (title, slug, excerpt, content, category, banner_url, is_published, is_featured, author_id)
    VALUES (title, slug, COALESCE(excerpt, ''), COALESCE(content, ''), category, banner_url, is_published, is_featured, auth.uid())
    RETURNING * INTO saved;
  ELSE
    UPDATE public.posts
    SET title = admin_save_post_v2.title,
        slug = admin_save_post_v2.slug,
        excerpt = COALESCE(admin_save_post_v2.excerpt, ''),
        content = COALESCE(admin_save_post_v2.content, ''),
        category = admin_save_post_v2.category,
        banner_url = admin_save_post_v2.banner_url,
        is_published = admin_save_post_v2.is_published,
        is_featured = admin_save_post_v2.is_featured
    WHERE id = post_id
    RETURNING * INTO saved;
  END IF;

  IF saved.id IS NULL THEN RAISE EXCEPTION 'Post not found'; END IF;
  RETURN saved;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_set_player_status_v2(uuid, public.player_status, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_player_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_player_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_round_v2(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_end_round_v2(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_select_top3_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_declare_champion_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_post_v2(uuid, text, text, text, text, public.post_category, text, boolean, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
