import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  payment_method: string;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
  }[];
}

export const Route = createFileRoute("/acompanhar-pedido/$token")({
  head: () => ({
    meta: [
      { title: "Acompanhar Pedido — CARTOON BURGUER" },
      { name: "description", content: "Acompanhe o status do seu pedido." },
      { property: "og:title", content: "Acompanhar Pedido — CARTOON BURGUER" },
      { property: "og:description", content: "Acompanhe o status do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackOrder,
});

function TrackOrder() {
  const { token } = Route.useParams();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["track-order", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("tracking_token", token)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 20000,
  });

  if (isLoading) return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground">Carregando informações do pedido...</p>
      </main>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-destructive">Não foi possível encontrar o pedido.</p>
      </main>
    </div>
  );

  const statusMap: Record<string, { label: string; color: string }> = {
    recebido: { label: "Recebido", color: "bg-blue-500" },
    em_preparo: { label: "Em preparo", color: "bg-yellow-500" },
    saiu_entrega: { label: "Saiu para entrega", color: "bg-orange-500" },
    entregue: { label: "Entregue", color: "bg-green-500" },
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl">Acompanhar Pedido</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedido #{order.id.substring(0, 8)}</span>
              <Badge className={`{statusMap[order.status]?.color} text-white`}>{statusMap[order.status]?.label || "Desconhecido"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-lg font-semibold">Itens do pedido</h2>
                <ul className="divide-y divide-border">
                  {order.order_items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2">
                      <span>
                        {item.product_name} x {item.quantity}
                      </span>
                      <span>{brl(item.unit_price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1 rounded-xl bg-muted p-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{brl(order.total - order.delivery_fee)}</span></div>
                <div className="flex justify-between"><span>Entrega</span><span>{brl(order.delivery_fee)}</span></div>
                <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{brl(order.total)}</span></div>
              </div>
              <div>
                <h2 className="mb-2 text-lg font-semibold">Informações de entrega</h2>
                <p><strong>Nome:</strong> {order.customer_name}</p>
                <p><strong>Telefone:</strong> {order.phone}</p>
                <p><strong>Endereço:</strong> {order.address}</p>
                {order.notes && <p><strong>Observações:</strong> {order.notes}</p>}
                <p><strong>Pagamento:</strong> {order.payment_method === "dinheiro" ? "Dinheiro" : order.payment_method === "pix" ? "Pix" : "Cartão"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}