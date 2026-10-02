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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface StoreBranding {
  banner_url: string | null;
  logo_url: string | null;
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
      <SiteHeader storeName={settings?.store_name} />
      <section className="bg-primary text-primary-foreground">
        {branding?.banner_url && (
          <div className="relative">
            <img
              src={branding.banner_url}
              alt="Banner da loja"
              className="h-44 w-full object-cover sm:h-56"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
          </div>
        )}
        <div className={`mx-auto max-w-6xl px-4 pb-8 ${branding?.banner_url ? "-mt-14" : "pt-8"}`}>
          <div className="flex items-end gap-4">
            {branding?.logo_url && (
              <img
                src={branding.logo_url}
                alt="Logo da loja"
                className="relative z-10 h-24 w-24 shrink-0 rounded-full border-4 border-secondary object-cover shadow-xl sm:h-28 sm:w-28"
              />
            )}
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-2xl text-secondary sm:text-3xl">
                {settings?.store_name ?? "CARTOON BURGUER"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
                    isOpen ? "bg-success text-background" : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                  {isOpen ? "Aberto agora" : "Fechado"}
                </span>
                <span className="rounded-full bg-background/10 px-3 py-1 font-medium text-background">
                  Entrega {brl(fee)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {data && data.categories.length > 0 && (
        <nav className="sticky top-[57px] z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
            {data.categories.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  activeCat === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
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
            <section key={c.id} id={`cat-${c.id}`} className="mb-10 scroll-mt-32">
              <h2 className="mb-4 text-2xl">{c.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prods.map((p) => (
                  <article key={p.id} className="flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:flex-col">
                    <div className="aspect-square w-32 shrink-0 bg-muted sm:aspect-[4/3] sm:w-full">
                      {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="font-sans text-base font-bold">{p.name}</h3>
                      {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-lg font-bold">{brl(p.price)}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!isOpen}
                          onClick={() => {
                            cart.add({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url });
                            toast.success(`${p.name} adicionado`);
                          }}
                        >
                          <Plus className="h-4 w-4" /> Adicionar
                        </Button>
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display">Seu pedido</SheetTitle>
          </SheetHeader>
          <CartAndCheckout fee={fee} isOpen={isOpen} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CartAndCheckout({ fee, isOpen, onDone }: { fee: number; isOpen: boolean; onDone: () => void }) {
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
    navigate({ to: "/meus-pedidos" });
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
                {[[
                  "dinheiro",
                  "Dinheiro"
                ], [
                  "pix",
                  "Pix"
                ], [
                  "cartao",
                  "Cartão"
                ]].map(([v, l]) => (
                  <Label key={v!} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[:checked]:border-primary">
                    <RadioGroupItem value={v!} /> {l}
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