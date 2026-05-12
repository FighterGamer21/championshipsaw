GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_above(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_ign_banned(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_role() TO authenticated;

-- Ensure owner role for the designated email if account already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role FROM auth.users
WHERE lower(email) = 'fightergamerofficial1@gmail.com'
ON CONFLICT DO NOTHING;