import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STATUS_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function ActiveOrderBar() {
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
        .neq("status", "entregue")
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
    "preparando": "bg-blue-500",
    "pronto": "bg-green-500",
    "saiu": "bg-purple-500",
    "entregue": "bg-gray-500",
  }[activeOrder.status] || "bg-gray-500";

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto w-full max-w-md px-4">
        <DialogTrigger asChild>
          <Button className={`flex w-full items-center justify-between rounded-full px-6 py-3 shadow-lg ${statusColor}`}>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white"></span>
              <span className="text-white">Pedido #{activeOrder.id.slice(0, 6).toUpperCase()} — {STATUS_LABEL[activeOrder.status]}</span>
            </span>
            <span className="text-white">Acompanhar</span>
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