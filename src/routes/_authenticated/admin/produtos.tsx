import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/produtos")({ component: AdminProducts });

type Form = { id?: string; name: string; description: string; price: string; category_id: string; image_url: string; available: boolean; display_order: number };
const empty: Form = { name: "", description: "", price: "", category_id: "", image_url: "", available: true, display_order: 0 };

function AdminProducts() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").order("display_order"),
        supabase.from("categories").select("*").order("display_order"),
      ]);
      return { products: p.data ?? [], categories: c.data ?? [] };
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["menu"] });
  };

  async function upload(file: File) {
    if (!form) return;
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error("Falha no envio da imagem.");
    }
    const { data: s } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (s?.signedUrl) setForm({ ...form, image_url: s.signedUrl });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const price = Number(form.price.replace(",", "."));
    if (!form.name.trim() || isNaN(price) || price < 0) return toast.error("Informe nome e preço válidos.");
    const row = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      category_id: form.category_id || null,
      image_url: form.image_url.trim() || null,
      available: form.available,
      display_order: form.display_order,
    };
    const { error } = form.id ? await supabase.from("products").update(row).eq("id", form.id) : await supabase.from("products").insert(row);
    if (error) return toast.error("Erro ao salvar.");
    toast.success("Produto salvo");
    setForm(null);
    refresh();
  }

  async function del(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir.");
    refresh();
  }

  async function toggle(id: string, available: boolean) {
    await supabase.from("products").update({ available }).eq("id", id);
    refresh();
  }

  const catName = (id: string | null) => data?.categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl">Produtos</h1>
        <Button onClick={() => setForm({ ...empty, display_order: (data?.products.length ?? 0) + 1 })}>Novo produto</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data?.products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col">
              <p className="font-bold">{p.name}</p>
              <p className="text-xs text-muted-foreground">{catName(p.category_id)} · {brl(p.price)}</p>
              <div className="mt-auto flex items-center gap-2">
                <Switch checked={p.available} onCheckedChange={(v) => toggle(p.id, v)} aria-label="Disponível" />
                <span className="text-xs">{p.available ? "Disponível" : "Indisponível"}</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => setForm({ id: p.id, name: p.name, description: p.description ?? "", price: String(p.price), category_id: p.category_id ?? "", image_url: p.image_url ?? "", available: p.available, display_order: p.display_order })}>Editar</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(p.id)}>Excluir</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          {form && (
            <form onSubmit={save} className="space-y-3">
              <div><Label htmlFor="pn">Nome</Label><Input id="pn" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label htmlFor="pd">Descrição</Label><Textarea id="pd" maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="pp">Preço (R$)</Label><Input id="pp" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div>
                  <Label htmlFor="pc">Categoria</Label>
                  <select id="pc" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Sem categoria</option>
                    {data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div><Label htmlFor="pu">URL da imagem</Label><Input id="pu" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div>
                <Label htmlFor="pf">Ou envie um arquivo</Label>
                <Input id="pf" type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
              </div>
              {form.image_url && <img src={form.image_url} alt="" className="h-32 w-32 rounded-lg object-cover" />}
              <label className="flex items-center gap-2"><Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} /> Disponível</label>
              <Button type="submit" className="w-full" disabled={uploading}>Salvar</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
