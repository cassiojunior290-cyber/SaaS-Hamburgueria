import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Share2, ShoppingBag, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  category_id: string | null;
};

type Opt = { id: string; label: string; price: number };

const DONENESS = ["Mal passado", "Ao ponto", "Bem passado"];
const FREE: Opt[] = [
  { id: "guardanapo", label: "Guardanapo", price: 0 },
  { id: "canudo", label: "Canudo", price: 0 },
  { id: "ketchup", label: "Sachê de ketchup", price: 0 },
  { id: "mostarda", label: "Sachê de mostarda", price: 0 },
  { id: "maionese-sache", label: "Sachê de maionese", price: 0 },
];
const PAID: Opt[] = [
  { id: "molho-casa", label: "Maionese especial da casa", price: 3 },
  { id: "alface", label: "Alface extra", price: 1.5 },
  { id: "mussarela", label: "Mussarela extra", price: 4 },
  { id: "cheddar", label: "Cheddar extra", price: 4 },
  { id: "bacon", label: "Bacon crocante extra", price: 5 },
];

export function ProductDialog({
  product,
  isOpen,
  categoryName = "",
  onClose,
  onCheckout,
}: {
  product: MenuProduct | null;
  products: MenuProduct[];
  isOpen: boolean;
  categoryName?: string;
  onSelect: (p: MenuProduct) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [doneness, setDoneness] = useState("Ao ponto");
  const [picked, setPicked] = useState<string[]>([]);
  const isBurger = /hamb|burg|lanche/i.test(categoryName);

  useEffect(() => {
    setQty(1);
    setDoneness("Ao ponto");
    setPicked([]);
  }, [product?.id]);

  const options = isBurger ? [...PAID, ...FREE] : FREE;
  const chosen = options.filter((o) => picked.includes(o.id));
  const unit = useMemo(() => Number(product?.price ?? 0) + chosen.reduce((s, o) => s + o.price, 0), [product, chosen]);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function add() {
    if (!product) return;
    const parts = [...(isBurger ? [doneness] : []), ...chosen.map((o) => (o.price ? `+ ${o.label}` : o.label))];
    const name = parts.length ? `${product.name} (${parts.join(", ")})` : product.name;
    const key = [product.id, isBurger ? doneness : "", ...chosen.map((o) => o.id).sort()].join("|");
    for (let i = 0; i < qty; i++) cart.add({ id: key, name, price: unit, image_url: product.image_url });
    toast.success(`${qty}x ${product.name} adicionado`);
    onClose();
  }

  async function share() {
    if (!product) return;
    const url = `${window.location.origin}/?produto=${product.id}`;
    const text = `${product.name} — ${brl(product.price)}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Link copiado");
      }
    } catch {}
  }

  const Row = ({ o }: { o: Opt }) => {
    const on = picked.includes(o.id);
    return (
      <button
        type="button"
        onClick={() => toggle(o.id)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-medium text-foreground">{o.label}</span>
        <span className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{o.price ? `+ ${brl(o.price)}` : "Grátis"}</span>
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
            {on && <Check className="h-4 w-4" />}
          </span>
        </span>
      </button>
    );
  };

  const Section = ({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) => (
    <div className="border-t border-border">
      <div className="bg-muted px-5 py-3">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="divide-y divide-border px-5">{children}</div>
    </div>
  );

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto rounded-3xl bg-card p-0 text-card-foreground sm:max-w-lg [&>button]:hidden">
        {product && (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
              <div className="absolute left-3 right-3 top-3 flex justify-between">
                <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md">
                  <X className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={share} aria-label="Compartilhar" className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={onCheckout} aria-label="Ver carrinho" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md">
                    <ShoppingBag className="h-5 w-5" />
                    {cart.count > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{cart.count}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-card p-5">
              <DialogTitle className="font-sans text-xl font-extrabold text-foreground">{product.name}</DialogTitle>
              {product.description && <DialogDescription className="text-sm text-muted-foreground">{product.description}</DialogDescription>}
              <p className="pt-1 text-2xl font-extrabold text-foreground">{brl(product.price)}</p>
            </div>

            {isBurger && (
              <Section title="Ponto da carne" hint="Escolha 1 opção">
                {DONENESS.map((d) => (
                  <button key={d} type="button" onClick={() => setDoneness(d)} className="flex w-full items-center justify-between py-3 text-left">
                    <span className="text-sm font-medium text-foreground">{d}</span>
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", doneness === d ? "border-primary" : "border-border")}>
                      {doneness === d && <span className="h-3 w-3 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </Section>
            )}

            {isBurger && (
              <Section title="Acréscimos e molhos" hint="Opcional — escolha quantos quiser">
                {PAID.map((o) => <Row key={o.id} o={o} />)}
              </Section>
            )}

            <Section title="Itens de cortesia" hint="Opcional — sem custo">
              {FREE.map((o) => <Row key={o.id} o={o} />)}
            </Section>

            <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-card p-4">
              <div className="flex items-center rounded-full bg-muted">
                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center font-bold text-foreground">{qty}</span>
                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setQty((q) => q + 1)} aria-label="Aumentar">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button className="h-11 flex-1 justify-between rounded-full" disabled={!isOpen} onClick={add}>
                <span>{isOpen ? "Adicionar" : "Loja fechada"}</span>
                <span>{brl(unit * qty)}</span>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
