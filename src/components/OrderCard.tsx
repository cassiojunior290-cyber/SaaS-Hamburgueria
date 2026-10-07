import type { ReactNode } from "react";
import { brl, PAYMENT_LABEL, STATUS_FLOW, STATUS_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PrintableReceipt } from "@/components/PrintableReceipt";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bluetooth, BluetoothOff } from "lucide-react";
import { toast } from "sonner";
import { useBluetoothPrinter } from "@/lib/bluetoothPrinter";


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

export function OrderCard({ order, showCustomer, actions, allowPrint = false }: { order: Order; showCustomer?: boolean; actions?: ReactNode; allowPrint?: boolean }) {
  const idx = STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number]);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  const handlePrint = () => {
    window.print();
    setIsPrintDialogOpen(false);
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold">Pedido #{order.id.slice(0, 6).toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
          {STATUS_LABEL[order.status]}
        </span>
      </div>
      <div className="mt-3 flex gap-1">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} title={STATUS_LABEL[s]} />
        ))}
      </div>
      {showCustomer && (
        <div className="mt-3 text-sm">
          <p><b>{order.customer_name}</b> · {order.phone}</p>
          <p className="text-muted-foreground">{order.address}</p>
        </div>
      )}
      <ul className="mt-3 space-y-1 text-sm">
        {order.order_items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>{i.quantity}x {i.product_name}</span>
            <span>{brl(Number(i.unit_price) * i.quantity)}</span>
          </li>
        ))}
      </ul>
      {order.notes && <p className="mt-2 text-sm italic text-muted-foreground">Obs.: {order.notes}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        <span>Pagamento: {PAYMENT_LABEL[order.payment_method]} · Entrega {brl(order.delivery_fee)}</span>
        <span className="text-base font-bold">{brl(order.total)}</span>
      </div>
      <div className="mt-3 flex justify-between">
        {actions && <div>{actions}</div>}
        {allowPrint && (
          <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PrinterIcon className="mr-2 h-4 w-4" />
                Imprimir Comanda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Pré-visualização da Comanda</DialogTitle>
              </DialogHeader>
              <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-lg bg-muted/40 p-3">
                <PrintableReceipt order={order} />
              </div>
              <Button onClick={handlePrint} className="mt-4 w-full" size="lg">
                <PrinterIcon className="mr-2 h-4 w-4" />
                Imprimir Comanda
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </article>
  );
}

function PrinterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" rx="2" />
    </svg>
  );
}