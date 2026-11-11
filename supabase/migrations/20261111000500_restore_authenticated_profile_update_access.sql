-- Restore the minimum table privileges required by the profile upsert flow.
-- RLS remains the row-level boundary: users can only write their own profile.
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
