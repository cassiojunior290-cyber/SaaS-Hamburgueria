import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { OrderCard } from "@/components/OrderCard";

export const Route = createFileRoute("/_authenticated/meus-pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — CARTOON BURGUER" },
      { name: "description", content: "Acompanhe o status dos seus pedidos." },
      { property: "og:title", content: "Meus pedidos — CARTOON BURGUER" },
      { property: "og:description", content: "Acompanhe seus pedidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyOrders,
});

function MyOrders() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 20000,
  });
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl">Meus pedidos</h1>
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {data?.length === 0 && <p className="text-muted-foreground">Você ainda não fez pedidos.</p>}
        <div className="space-y-4">{data?.map((o) => <OrderCard key={o.id} order={o} />)}</div>
      </main>
    </div>
  );
}
