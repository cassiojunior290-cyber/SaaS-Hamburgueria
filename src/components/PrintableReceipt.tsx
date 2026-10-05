import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  payment_method: string;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface StoreSettings {
  store_name: string;
  paper_width: number;
}

export function PrintableReceipt({ orderId }: { orderId: string }) {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>();
  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      return { ...data, items };
    },
  });

  useEffect(() => {
    async function fetchStoreSettings() {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();
      setStoreSettings(data);
    }
    fetchStoreSettings();
  }, []);

  if (!order || !storeSettings) return null;

  const is80mm = storeSettings.paper_width === 80;
  const maxWidth = is80mm ? "48ch" : "32ch";

  return (
    <div className="printable-receipt" style={{ maxWidth }}>
      <style>{`
        .printable-receipt {
          background: white;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
          padding: 10px;
          border: 1px solid #ccc;
          margin: 0 auto;
          width: ${maxWidth};
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${maxWidth};
            background: white;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            padding: 10px;
            border: none;
            margin: 0;
          }
        }
      `}</style>
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{storeSettings.store_name}</h1>
        <p>Pedido #{order.id.substring(0, 6)}</p>
        <p>{new Date(order.created_at).toLocaleString()}</p>
        <p>{order.status === "delivery" ? "Delivery" : "Retirada"}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">Cliente</h2>
        <p>{order.customer_name}</p>
        <p><a href={`tel:${order.phone}`}>{order.phone}</a></p>
        {order.address && <p>{order.address}</p>}
        {order.notes && <p className="italic">Observações: {order.notes}</p>}
      </div>

      <div className="mb-4">
        <h2 className="font-bold">Itens</h2>
        {order.items.map((item) => (
          <div key={item.id} className="mb-2">
            <p>
              {item.quantity}x {item.product_name} - {formatCurrency(item.unit_price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.total - order.delivery_fee)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxa de entrega:</span>
          <span>{formatCurrency(order.delivery_fee)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">Pagamento</h2>
        <p>{order.payment_method}</p>
      </div>

      <div className="text-center">
        <p>Obrigado pela preferência!</p>
      </div>
    </div>
  );
}