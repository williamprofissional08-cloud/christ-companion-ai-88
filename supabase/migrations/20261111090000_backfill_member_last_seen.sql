-- Backfill the last known sign-in for existing accounts.
-- Future activity is maintained by the authenticated client through the
-- user's own-row RLS policy on public.profiles.
UPDATE public.profiles AS profile
SET last_seen_at = auth_user.last_sign_in_at
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND profile.last_seen_at IS NULL
  AND auth_user.last_sign_in_at IS NOT NULL;
