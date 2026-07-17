
-- Tighten open inserts with light checks (avoid literal true)
DROP POLICY "contact public insert" ON public.contact_messages;
CREATE POLICY "contact public insert" ON public.contact_messages
  FOR INSERT WITH CHECK (length(name) > 0 AND email ~ '@' AND length(message) > 0);

DROP POLICY "newsletter public insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter public insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email ~ '@');

-- Trigger functions don't need public execute
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_product_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order(JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, TEXT) TO authenticated;
