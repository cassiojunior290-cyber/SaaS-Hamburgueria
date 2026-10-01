import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const menuQuery = queryOptions({
  queryKey: ["menu"],
  queryFn: async () => {
    const [s, c, p] = await Promise.all([
      supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("products").select("*").eq("available", true).order("display_order"),
    ]);
    if (s.error) throw s.error;
    if (c.error) throw c.error;
    if (p.error) throw p.error;
    return { settings: s.data, categories: c.data ?? [], products: p.data ?? [] };
  },
});
