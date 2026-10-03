import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BannerLogoManager } from "@/components/BannerLogoManager";


export const Route = createFileRoute("/_authenticated/admin/loja")({ component: AdminStore });

function AdminStore() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });
  const [f, setF] = useState({ store_name: "", delivery_fee: "0", is_open: true });
  useEffect(() => {
    if (data) setF({ store_name: data.store_name, delivery_fee: String(data.delivery_fee), is_open: data.is_open });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fee = Number(f.delivery_fee.replace(",", "."));
    if (!f.store_name.trim() || isNaN(fee) || fee < 0) { toast.error("Verifique os campos."); return; }
    const { error } = await supabase.from("store_settings").update({ store_name: f.store_name.trim(), delivery_fee: fee, is_open: f.is_open }).eq("id", 1);
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
    qc.invalidateQueries({ queryKey: ["menu"] });
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-3xl">Loja</h1>
      <BannerLogoManager type="banner" />
      <BannerLogoManager type="logo" />
      <form onSubmit={save} className="space-y-4">
        <div><Label htmlFor="sn">Nome da loja</Label><Input id="sn" value={f.store_name} maxLength={60} onChange={(e) => setF({ ...f, store_name: e.target.value })} /></div>
        <div><Label htmlFor="df">Taxa de entrega (R$)</Label><Input id="df" inputMode="decimal" value={f.delivery_fee} onChange={(e) => setF({ ...f, delivery_fee: e.target.value })} /></div>
        <label className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <span className="font-semibold">{f.is_open ? "Loja aberta" : "Loja fechada"}</span>
          <Switch checked={f.is_open} onCheckedChange={(v) => setF({ ...f, is_open: v })} />
        </label>
        <Button type="submit" size="lg">Salvar</Button>
      </form>
    </div>
  );
}