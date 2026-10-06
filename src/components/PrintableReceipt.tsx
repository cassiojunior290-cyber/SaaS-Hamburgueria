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

export function PrintableReceipt({ order, paperWidth }: { order: ReceiptOrder; paperWidth?: 58 | 80 }) {
  const [storeName, setStoreName] = useState("Cartoon Burguer");
  const [dbPaperWidth, setDbPaperWidth] = useState<58 | 80>(58);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("store_name, paper_width")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.store_name) setStoreName(data.store_name);
        if (data?.paper_width === 80) setDbPaperWidth(80);
      });
  }, []);

  const width = paperWidth ?? dbPaperWidth;
  const chars = width === 80 ? 48 : 32;
  const maxWidth = `${chars}ch`;
  const line = "-".repeat(chars);
  const doubleLine = "=".repeat(chars);
  const fee = Number(order.delivery_fee) || 0;
  const total = Number(order.total) || 0;

  return (
    <div className="printable-receipt" style={{ maxWidth }}>
      <style>{`
        .printable-receipt { background:#fff; color:#000; font-family:'Courier New',monospace; font-size:12px; line-height:1.35; padding:12px 8px; border:1px dashed #999; margin:0 auto; width:${maxWidth}; white-space:pre-wrap; word-break:break-word; }
        .printable-receipt .sep { overflow:hidden; white-space:nowrap; }
        .printable-receipt .row { display:flex; justify-content:space-between; gap:8px; }
        .printable-receipt .row span:last-child { white-space:nowrap; }
        @media print {
          @page { size: ${width}mm auto; margin: 0; }
          body * { visibility:hidden; }
          .printable-receipt, .printable-receipt * { visibility:visible; }
          .printable-receipt { position:absolute; left:0; top:0; border:none; margin:0; width:${width}mm; max-width:${width}mm; }
        }
      `}</style>

      <div className="text-center">
        <p className="text-sm font-bold uppercase">{storeName}</p>
        <p className="sep">{doubleLine}</p>
        <p className="font-bold">PEDIDO #{order.id.slice(0, 6).toUpperCase()}</p>
        <p>{new Date(order.created_at).toLocaleString("pt-BR")}</p>
      </div>

      <p className="sep">{line}</p>
      <p className="font-bold">CLIENTE</p>
      <p>{order.customer_name}</p>
      <p>Tel: {order.phone}</p>
      {order.address && <p>End: {order.address}</p>}

      <p className="sep">{line}</p>
      <p className="font-bold">ITENS</p>
      {(order.order_items ?? []).map((item) => (
        <div key={item.id} className="row">
          <span>{item.quantity}x {item.product_name}</span>
          <span>{brl(Number(item.unit_price) * item.quantity)}</span>
        </div>
      ))}

      <p className="sep">{line}</p>
      <div className="row"><span>Subtotal</span><span>{brl(total - fee)}</span></div>
      <div className="row"><span>Entrega</span><span>{brl(fee)}</span></div>
      <div className="row font-bold"><span>TOTAL</span><span>{brl(total)}</span></div>

      <p className="sep">{line}</p>
      <p>Pagamento: {PAYMENT_LABEL[order.payment_method] ?? order.payment_method} (na entrega)</p>
      {order.notes && <p>Obs.: {order.notes}</p>}

      <p className="sep">{doubleLine}</p>
      <p className="text-center">Obrigado pela preferencia!</p>
      <p className="text-center">.</p>
    </div>
  );
}
