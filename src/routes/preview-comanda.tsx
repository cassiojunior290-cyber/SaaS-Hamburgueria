import { createFileRoute } from "@tanstack/react-router";
import { PrintableReceipt } from "@/components/PrintableReceipt";

export const Route = createFileRoute("/preview-comanda")({ component: PreviewComanda });

const mockOrder = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  created_at: new Date().toISOString(),
  customer_name: "Maria Silva",
  phone: "(11) 99999-0000",
  address: "Rua das Flores, 123 - Centro",
  notes: "Sem cebola, ponto da carne bem passado",
  payment_method: "pix",
  delivery_fee: 5,
  total: 57.5,
  order_items: [
    { id: "1", product_name: "X-Bacon + Mussarela extra", unit_price: 28.5, quantity: 1 },
    { id: "2", product_name: "Batata Frita Grande", unit_price: 15, quantity: 1 },
    { id: "3", product_name: "Refrigerante Lata", unit_price: 6, quantity: 2 },
  ],
};

function PreviewComanda() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-muted p-8">
      <PrintableReceipt order={mockOrder} />
    </div>
  );
}
