import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { menuQuery } from "@/lib/menu";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { StoreInfo } from "@/components/StoreInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductDialog, type MenuProduct } from "@/components/ProductDialog";

interface StoreBranding {
  banner_url: string | null;
  logo_url: string | null;
}

function generateTrackingToken() {
  return Math.random().toString(36).substring(2, 12);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cardápio — CARTOON BURGUER" },
      { name: "description", content: "Veja o cardápio da CARTOON BURGUER e faça seu pedido para entrega." },
      { property: "og:title", content: "Cardápio — CARTOON BURGUER" },
      { property: "og:description", content: "Hambúrgueres, acompanhamentos e bebidas com entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { data, isLoading, error } = useQuery(menuQuery);
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [branding, setBranding] = useState<StoreBranding | null>(null);
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const settings = data?.settings;
  const isOpen = settings?.is_open ?? false;
  const fee = Number(settings?.delivery_fee ?? 0);

  useEffect(() => {
    async function fetchBranding() {
      const { data, error } = await supabase.from("store_settings").select("banner_url, logo_url").eq("id", 1).single();

      if (!error && data) {
        setBranding(data);
      }
    }

    fetchBranding();
  }, []);

  return (
    <div className="min-h-screen pb-28">
      <SiteHeader />
      <section className="mx-auto max-w-6xl sm:px-4 sm:pt-4">
        <StoreInfo />
      </section>

      {data && data.categories.length > 0 && (
        <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl snap-x gap-2 overflow-x-auto scroll-smooth px-4 py-3">
            {data.categories.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveCat(c.id);
                  const pill = e.currentTarget;
                  const bar = pill.parentElement;
                  if (bar) bar.scrollTo({ left: pill.offsetLeft - bar.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
                  const target = document.getElementById(`cat-${c.id}`);
                  if (target) {
                    const offset = 64;
                    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
                  }
                }}
                className={`snap-start whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-300 ease-out ${
                  activeCat === c.id ? "-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-md" : "border-border hover:-translate-y-0.5 hover:border-primary"
                }`}
              >
                {c.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        {isLoading && <p className="text-muted-foreground">Carregando cardápio...</p>}
        {error && <p className="text-destructive">Não foi possível carregar o cardápio.</p>}
        {data?.categories.map((c) => {
          const prods = data.products.filter((p) => p.category_id === c.id);
          if (!prods.length) return null;
          return (
            <section key={c.id} id={`cat-${c.id}`} className="mb-10 scroll-mt-20">
              <h2 className="mb-4 text-lg tracking-tight sm:text-xl">{c.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prods.map((p) => (
                  <article key={p.id} onClick={() => setSelected(p)} className="group flex cursor-pointer overflow-hidden rounded-2xl bg-card [box-shadow:var(--shadow-soft)] transition-all duration-300 ease-out hover:-translate-y-1 hover:[box-shadow:var(--shadow-lift)] active:scale-[0.99] sm:flex-col">
                    <div className="m-2 aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:m-0 sm:aspect-[4/3] sm:w-full sm:rounded-none">
                      {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                      <h3 className="font-sans text-base font-bold">{p.name}</h3>
                      {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-lg font-extrabold">{brl(p.price)}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform group-hover:scale-110">
                          <Plus className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <Button className="mx-auto flex h-14 w-full max-w-md justify-between rounded-2xl text-base shadow-lg" onClick={() => setOpen(true)}>
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Ver carrinho ({cart.count})
            </span>
            <span>{brl(cart.subtotal)}</span>
          </Button>
        </div>
      )}

      <ProductDialog
        product={selected}
        products={data?.products ?? []}
        categoryName={data?.categories.find((c) => c.id === selected?.category_id)?.name ?? ""}
        isOpen={isOpen}
        onSelect={setSelected}
        onClose={() => setSelected(null)}
        onCheckout={() => {
          setSelected(null);
          setOpen(true);
        }}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display">Seu pedido</SheetTitle>
          </SheetHeader>
          <CartAndCheckout fee={fee} isOpen={isOpen} onDone={() => setOpen(false)} setTrackingToken={setTrackingToken} />
        </SheetContent>
      </Sheet>

      {trackingToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Pedido enviado!</h2>
            <p className="mb-2">Aqui está o link para acompanhar seu pedido:</p>
            <div className="mb-4 rounded bg-gray-100 p-2">
              <a href={`/acompanhar-pedido/${trackingToken}`} className="text-blue-600 hover:underline">
                {window.location.origin}/acompanhar-pedido/{trackingToken}
              </a>
            </div>
            <Button onClick={() => setTrackingToken(null)}>Fechar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CartAndCheckout({ fee, isOpen, onDone, setTrackingToken }: { fee: number; isOpen: boolean; onDone: () => void; setTrackingToken: (token: string) => void }) {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", payment: "pix" });
  const [sending, setSending] = useState(false);
  const total = cart.subtotal + fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Preencha nome, telefone e endereço.");
      return;
    }
    setSending(true);
    const trackingToken = generateTrackingToken();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        payment_method: form.payment,
        delivery_fee: fee,
        total,
        tracking_token: trackingToken,
      })
      .select("id")
      .single();
    if (error || !order) {
      setSending(false);
      toast.error("Não foi possível enviar o pedido.");
      return;
    }
    const { error: e2 } = await supabase.from("order_items").insert(
      cart.items.map((i) => ({ order_id: order.id, product_name: i.name, unit_price: i.price, quantity: i.quantity })),
    );
    setSending(false);
    if (e2) {
      toast.error("Erro ao salvar itens do pedido.");
      return;
    }
    cart.clear();
    qc.invalidateQueries({ queryKey: ["my-orders"] });
    toast.success("Pedido enviado!");
    onDone();
    setTrackingToken(trackingToken);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
      <ul className="divide-y divide-border">
        {cart.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-muted-foreground">{brl(i.price * i.quantity)}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => cart.setQty(i.id, i.quantity - 1)} aria-label="Diminuir">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-semibold">{i.quantity}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => cart.setQty(i.id, i.quantity + 1)} aria-label="Aumentar">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => cart.remove(i.id)} aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
        {cart.items.length === 0 && <li className="py-6 text-center text-muted-foreground">Carrinho vazio.</li>}
      </ul>

      <div className="space-y-1 rounded-xl bg-muted p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{brl(cart.subtotal)}</span></div>
        <div className="flex justify-between"><span>Entrega</span><span>{brl(fee)}</span></div>
        <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{brl(total)}</span></div>
      </div>

      {!isOpen ? (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">A loja está fechada no momento.</p>
      ) : !user ? (
        <Button asChild size="lg">
          <Link to="/auth">Entre para finalizar o pedido</Link>
        </Button>
      ) : (
        cart.items.length > 0 && (
          <form onSubmit={submit} className="space-y-3">
            <div><Label htmlFor="n">Nome</Label><Input id="n" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="t">Telefone</Label><Input id="t" type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="a">Endereço</Label><Textarea id="a" rows={2} maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label htmlFor="o">Observações</Label><Textarea id="o" rows={2} maxLength={300} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div>
              <Label>Pagamento na entrega</Label>
              <RadioGroup value={form.payment} onValueChange={(v) => setForm({ ...form, payment: v })} className="mt-2 grid grid-cols-3 gap-2">
                {[
                  "dinheiro",
                  "pix",
                  "cartao",
                ].map((v) => (
                  <Label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[:checked]:border-primary">
                    <RadioGroupItem value={v} /> {v === "dinheiro" ? "Dinheiro" : v === "pix" ? "Pix" : "Cartão"}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={sending}>
              {sending ? "Enviando..." : `Confirmar pedido • ${brl(total)}`}
            </Button>
          </form>
        )
      )}
    </div>
  );
}