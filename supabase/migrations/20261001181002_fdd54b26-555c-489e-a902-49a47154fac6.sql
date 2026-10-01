DROP POLICY "products public read" ON public.products;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (available);
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;