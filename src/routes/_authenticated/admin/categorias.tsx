import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/categorias")({ component: AdminCategories });

function AdminCategories() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data ?? [],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["menu"] });
  };

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), display_order: (data?.length ?? 0) + 1 });
    if (error) { toast.error("Erro ao criar."); return; }
    setName("");
    refresh();
  }
  async function save(id: string, patch: { name?: string; display_order?: number }) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Salvo");
    refresh();
  }
  async function del(id: string) {
    if (!confirm("Excluir categoria? Os produtos ficarão sem categoria.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    refresh();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-3xl">Categorias</h1>
      <form onSubmit={create} className="mb-6 flex gap-2">
        <Input placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <Button type="submit">Adicionar</Button>
      </form>
      <ul className="space-y-2">
        {data?.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Input type="number" className="w-20" defaultValue={c.display_order} onBlur={(e) => Number(e.target.value) !== c.display_order && save(c.id, { display_order: Number(e.target.value) })} aria-label="Ordem" />
            <Input defaultValue={c.name} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && save(c.id, { name: e.target.value.trim() })} aria-label="Nome" />
            <Button variant="ghost" onClick={() => del(c.id)} className="text-destructive">Excluir</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
