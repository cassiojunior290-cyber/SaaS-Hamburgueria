CREATE TYPE public.app_role AS ENUM ('super_admin','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin'))
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'CARTOON BURGUER',
  delivery_fee numeric(10,2) NOT NULL DEFAULT 5.00,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin update" ON public.store_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  available boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (available OR public.is_admin());
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  notes text,
  payment_method text NOT NULL CHECK (payment_method IN ('dinheiro','pix','cartao')),
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido','em_preparo','saiu_entrega','entregue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders own insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'recebido');
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0)
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items read" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "items insert own" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY "product images admin read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product images admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product images admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product images admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

INSERT INTO public.store_settings (id, store_name, delivery_fee, is_open) VALUES (1, 'CARTOON BURGUER', 5.00, true);
WITH c AS (
  INSERT INTO public.categories (name, display_order) VALUES ('Hambúrgueres',1),('Acompanhamentos',2),('Bebidas',3) RETURNING id, name
)
INSERT INTO public.products (category_id, name, description, price, image_url, display_order)
SELECT c.id, p.name, p.descr, p.price, p.img, p.ord FROM c JOIN (VALUES
 ('Hambúrgueres','Cartoon Clássico','Pão brioche, blend 150g, queijo cheddar, alface, tomate e molho da casa.',25.90,'/__l5e/assets-v1/e3621de2-9c23-4778-813a-95b4ae96633c/burger-classico.jpg',1),
 ('Hambúrgueres','Cartoon Bacon','Pão brioche, blend 150g, cheddar duplo, bacon crocante e cebola caramelizada.',29.90,NULL,2),
 ('Acompanhamentos','Batata Frita Crocante','Porção de batatas fritas sequinhas com sal.',12.90,NULL,1),
 ('Bebidas','Refrigerante Lata','Lata 350ml gelada.',6.00,'/__l5e/assets-v1/2e988cb3-cbe5-44fa-b814-0d705b178037/refrigerante.jpg',1)
) AS p(cat,name,descr,price,img,ord) ON p.cat = c.name;