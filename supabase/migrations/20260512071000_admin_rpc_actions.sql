-- Admin RPC actions: role-checked SECURITY DEFINER writes for the admin panel.
-- These avoid client-side RLS write failures while still requiring owner/admin/moderator roles.

CREATE OR REPLACE FUNCTION public.admin_set_player_status(
  _player_id uuid,
  _status public.player_status,
  _current_day integer DEFAULT NULL,
  _current_round text DEFAULT NULL
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
    status = _status,
    current_day = COALESCE(_current_day, current_day),
    current_round = COALESCE(_current_round, current_round),
    checked_in_at = CASE
      WHEN _status = 'CHECKED_IN' AND checked_in_at IS NULL THEN now()
      ELSE checked_in_at
    END
  WHERE id = _player_id
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  IF _status IN ('ELIMINATED', 'DISQUALIFIED') THEN
    INSERT INTO public.eliminations (player_id, day, round_name, reason)
    VALUES (
      updated.id,
      GREATEST(updated.current_day, 1),
      COALESCE(updated.current_round, 'Unknown'),
      CASE WHEN _status = 'DISQUALIFIED' THEN 'Disqualified' ELSE 'Eliminated' END
    );
  END IF;

  RETURN updated;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_player(_player_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_id uuid;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.players WHERE id = _player_id RETURNING id INTO deleted_id;
  IF deleted_id IS NULL THEN RAISE EXCEPTION 'Player not found'; END IF;
  RETURN deleted_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_ban_player(_player_id uuid)
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.players;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO target FROM public.players WHERE id = _player_id;
  IF target.id IS NULL THEN RAISE EXCEPTION 'Player not found'; END IF;

  INSERT INTO public.bans (ign, discord_username, reason, banned_until)
  VALUES (target.ign, NULLIF(target.discord_username, ''), 'Banned by admin', NULL);

  UPDATE public.players SET status = 'BANNED' WHERE id = _player_id RETURNING * INTO target;
  RETURN target;
END $$;

CREATE OR REPLACE FUNCTION public.admin_start_round(_day integer, _round_name text)
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_round public.rounds;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.rounds
  SET status = 'active', started_at = now(), ended_at = NULL
  WHERE round_name = _round_name
  RETURNING * INTO updated_round;

  IF updated_round.id IS NULL THEN
    INSERT INTO public.rounds (day, round_name, status, started_at)
    VALUES (_day, _round_name, 'active', now())
    RETURNING * INTO updated_round;
  END IF;

  UPDATE public.settings
  SET current_day = _day, current_round = _round_name, event_status = 'live', updated_at = now()
  WHERE id = 1;

  UPDATE public.players
  SET current_day = _day, current_round = _round_name
  WHERE status IN ('CHECKED_IN', 'ALIVE', 'QUALIFIED', 'SEMI_FINALIST', 'FINALIST', 'TOP_3');

  RETURN updated_round;
END $$;

CREATE OR REPLACE FUNCTION public.admin_end_round(_round_name text)
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_round public.rounds;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.rounds
  SET status = 'completed', ended_at = now()
  WHERE round_name = _round_name
  RETURNING * INTO updated_round;

  IF updated_round.id IS NULL THEN RAISE EXCEPTION 'Round has not been started yet'; END IF;
  RETURN updated_round;
END $$;

CREATE OR REPLACE FUNCTION public.admin_select_top3()
RETURNS SETOF public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ids uuid[];
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT array_agg(id) INTO ids
  FROM (SELECT id FROM public.players WHERE status IN ('ALIVE', 'QUALIFIED', 'FINALIST') ORDER BY registered_at LIMIT 3) s;

  IF ids IS NULL OR array_length(ids, 1) < 3 THEN
    RAISE EXCEPTION 'Need at least 3 alive players to select Top 3';
  END IF;

  RETURN QUERY UPDATE public.players SET status = 'TOP_3' WHERE id = ANY(ids) RETURNING *;
END $$;

CREATE OR REPLACE FUNCTION public.admin_declare_champion()
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  champ public.players;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO champ FROM public.players WHERE status = 'TOP_3' ORDER BY registered_at LIMIT 1;
  IF champ.id IS NULL THEN RAISE EXCEPTION 'No TOP_3 players to declare champion from'; END IF;

  UPDATE public.players SET status = 'CHAMPION' WHERE id = champ.id RETURNING * INTO champ;
  UPDATE public.settings SET event_status = 'completed', updated_at = now() WHERE id = 1;
  RETURN champ;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_set_player_status(uuid, public.player_status, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_player(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_player(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_round(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_end_round(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_select_top3() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_declare_champion() TO authenticated;
