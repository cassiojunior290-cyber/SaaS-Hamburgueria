import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";

export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  category_id: string;
};

export function ProductDialog({
  product,
  products,
  isOpen,
  onSelect,
  onClose,
  onCheckout,
}: {
  product: MenuProduct | null;
  products: MenuProduct[];
  isOpen: boolean;
  onSelect: (p: MenuProduct) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => setQty(1), [product?.id]);

  const extras = product ? products.filter((p) => p.category_id !== product.category_id).slice(0, 6) : [];

  function addItem(p: MenuProduct, n = 1) {
    for (let i = 0; i < n; i++) cart.add({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url });
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
        {product && (
          <>
            <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
              {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
            </div>
            <div className="space-y-2 p-5">
              <DialogTitle className="font-sans text-xl font-extrabold">{product.name}</DialogTitle>
              {product.description && <DialogDescription>{product.description}</DialogDescription>}
              <p className="pt-1 text-2xl font-extrabold">{brl(product.price)}</p>
            </div>

            {extras.length > 0 && (
              <div className="border-t border-border px-5 py-4">
                <p className="mb-3 text-sm font-bold">Peça também</p>
                <div className="space-y-2">
                  {extras.map((e) => {
                    const inCart = cart.items.find((i) => i.id === e.id)?.quantity ?? 0;
                    return (
                      <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2">
                        <button type="button" onClick={() => onSelect(e)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {e.image_url && <img src={e.image_url} alt={e.name} className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{brl(e.price)}</p>
                          </div>
                        </button>
                        <Button
                          size="sm"
                          variant={inCart ? "default" : "outline"}
                          className="shrink-0 rounded-full"
                          disabled={!isOpen}
                          onClick={() => {
                            addItem(e);
                            toast.success(`${e.name} adicionado`);
                          }}
                        >
                          <Plus className="h-4 w-4" /> {inCart ? inCart : ""}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-card p-4">
              <div className="flex items-center rounded-full bg-muted">
                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center font-bold">{qty}</span>
                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setQty((q) => q + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="h-11 flex-1 justify-between rounded-full"
                disabled={!isOpen}
                onClick={() => {
                  addItem(product, qty);
                  toast.success(`${qty}x ${product.name} adicionado`);
                  onClose();
                }}
              >
                <span>{isOpen ? "Adicionar" : "Loja fechada"}</span>
                <span>{brl(Number(product.price) * qty)}</span>
              </Button>
            </div>
            {cart.count > 0 && (
              <button type="button" onClick={onCheckout} className="w-full pb-4 text-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline">
                Ir para o carrinho ({cart.count})
              </button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
