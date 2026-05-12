
CREATE OR REPLACE FUNCTION public.claim_role()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  has_owner boolean;
BEGIN
  IF uid IS NULL THEN RETURN 'unauthenticated'; END IF;
  SELECT email INTO uemail FROM auth.users WHERE id = uid;
  -- Owner email always claims owner role
  IF lower(coalesce(uemail,'')) = 'fightergamerofficial1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'owner') ON CONFLICT DO NOTHING;
    RETURN 'owner';
  END IF;
  -- Bootstrap: if no owners or admins exist, this user becomes admin
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('owner','admin')) INTO has_owner;
  IF NOT has_owner THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    RETURN 'admin';
  END IF;
  RETURN 'none';
END $$;

REVOKE ALL ON FUNCTION public.claim_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_role() TO authenticated;
