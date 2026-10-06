import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl, PAYMENT_LABEL } from "@/lib/format";

export type ReceiptOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  payment_method: string;
  delivery_fee: number;
  total: number;
  order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
};

export function PrintableReceipt({ order, paperWidth = 58 }: { order: ReceiptOrder; paperWidth?: 58 | 80 }) {
  const [storeName, setStoreName] = useState("Cartoon Burguer");

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("store_name")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.store_name) setStoreName(data.store_name);
      });
  }, []);

  const maxWidth = paperWidth === 80 ? "48ch" : "32ch";
  const fee = Number(order.delivery_fee) || 0;
  const total = Number(order.total) || 0;

  return (
    <div className="printable-receipt" style={{ maxWidth }}>
      <style>{`
        .printable-receipt { background:#fff; color:#000; font-family:'Courier New',monospace; font-size:12px; line-height:1.3; padding:10px; border:1px solid #ccc; margin:0 auto; width:${maxWidth}; }
        @media print {
          body * { visibility:hidden; }
          .printable-receipt, .printable-receipt * { visibility:visible; }
          .printable-receipt { position:absolute; left:0; top:0; border:none; margin:0; }
        }
      `}</style>
      <div className="mb-3 text-center">
        <p className="text-base font-bold">{storeName}</p>
        <p>Pedido #{order.id.slice(0, 6).toUpperCase()}</p>
        <p>{new Date(order.created_at).toLocaleString("pt-BR")}</p>
      </div>
      <div className="mb-3">
        <p className="font-bold">Cliente</p>
        <p>{order.customer_name}</p>
        <p>{order.phone}</p>
        {order.address && <p>{order.address}</p>}
        {order.notes && <p className="italic">Obs.: {order.notes}</p>}
      </div>
      <div className="mb-3">
        <p className="font-bold">Itens</p>
        {(order.order_items ?? []).map((item) => (
          <p key={item.id}>
            {item.quantity}x {item.product_name} - {brl(Number(item.unit_price) * item.quantity)}
          </p>
        ))}
      </div>
      <div className="mb-3">
        <div className="flex justify-between"><span>Subtotal:</span><span>{brl(total - fee)}</span></div>
        <div className="flex justify-between"><span>Entrega:</span><span>{brl(fee)}</span></div>
        <div className="flex justify-between font-bold"><span>Total:</span><span>{brl(total)}</span></div>
      </div>
      <p className="mb-3">Pagamento: {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}</p>
      <p className="text-center">Obrigado pela preferência!</p>
    </div>
  );
}
