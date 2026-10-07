import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STATUS_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bike, ShoppingBag } from "lucide-react";
import { useState } from "react";


type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  payment_method: string;
  delivery_fee: number;
  total: number;
  status: string;
  order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
};

export function ActiveOrderBar({ hasCartBar }: { hasCartBar?: boolean }) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: activeOrder, isLoading } = useQuery({
    queryKey: ["active-order"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading || !activeOrder) return null;

  const statusColor = {
    "recebido": "bg-yellow-500",
    "preparando": "bg-orange-500",
    "pronto": "bg-green-500",
    "saiu": "bg-blue-500",
    "entregue": "bg-green-500",
  }[activeOrder.status] || "bg-gray-500";

  const statusIcon = {
    "recebido": <ShoppingBag className="h-6 w-6" />,
    "preparando": <ShoppingBag className="h-6 w-6" />,
    "pronto": <ShoppingBag className="h-6 w-6" />,
    "saiu": <Bike className="h-6 w-6" />,
    "entregue": <ShoppingBag className="h-6 w-6" />,
  }[activeOrder.status] || <ShoppingBag className="h-6 w-6" />;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className={`fixed right-6 z-40 ${hasCartBar ? "bottom-24" : "bottom-6"}`}>
        <DialogTrigger asChild>
          <Button className={`relative h-14 w-14 rounded-full bg-card shadow-lg transition-transform active:scale-95 hover:scale-105`}>
            {statusIcon}
            <span className={`absolute right-1 top-1 h-3 w-3 rounded-full ${statusColor}`}></span>
            <span className={`absolute right-1 top-1 h-3 w-3 rounded-full ${statusColor} animate-ping`}></span>
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${statusColor}`}></span>
            <span className="font-semibold">Status: {STATUS_LABEL[activeOrder.status]}</span>
          </div>
          <div>
            <h3 className="font-semibold">Itens do Pedido</h3>
            <ul className="mt-2 space-y-1">
              {activeOrder.order_items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span>{brl(Number(item.unit_price) * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{brl(activeOrder.total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}