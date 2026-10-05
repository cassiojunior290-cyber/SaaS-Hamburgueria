import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BannerLogoManager } from "@/components/BannerLogoManager";
import { Skeleton } from "@/components/ui/skeleton";


export const Route = createFileRoute("/_authenticated/admin/loja")({ component: AdminStore });

function AdminStore() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });
  const [f, setF] = useState({
    store_name: "",
    delivery_fee: "0",
    is_open: true,
    address: "",
    bio: "",
    delivery_time: "",
    pickup_time: "",
    minimum_order: "0",
    address_url: "",
  });
  useEffect(() => {
    if (data) setF({
      store_name: data.store_name,
      delivery_fee: String(data.delivery_fee),
      is_open: data.is_open,
      address: data.address || "",
      bio: data.bio || "",
      delivery_time: data.delivery_time || "",
      pickup_time: data.pickup_time || "",
      minimum_order: String(data.minimum_order || "0"),
      address_url: data.address_url || "",
    });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fee = Number(f.delivery_fee.replace(",", "."));
    const minOrder = Number(f.minimum_order.replace(",", "."));
    if (!f.store_name.trim() || isNaN(fee) || fee < 0 || isNaN(minOrder) || minOrder < 0) {
      toast.error("Verifique os campos.");
      return;
    }
    const { error } = await supabase.from("store_settings").update({
      store_name: f.store_name.trim(),
      delivery_fee: fee,
      is_open: f.is_open,
      address: f.address.trim(),
      bio: f.bio.trim(),
      delivery_time: f.delivery_time.trim(),
      pickup_time: f.pickup_time.trim(),
      minimum_order: minOrder,
      address_url: f.address_url.trim(),
    }).eq("id", 1);
    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
    qc.invalidateQueries({ queryKey: ["menu"] });
  }

  if (isLoading) {
    return (
      <div className="max-w-md space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
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
        <div><Label htmlFor="address">Endereço</Label><Input id="address" value={f.address} maxLength={200} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div><Label htmlFor="address_url">URL do endereço</Label><Input id="address_url" type="url" value={f.address_url} onChange={(e) => setF({ ...f, address_url: e.target.value })} /></div>
        <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" rows={3} value={f.bio} maxLength={500} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
        <div><Label htmlFor="delivery_time">Tempo médio de entrega</Label><Input id="delivery_time" value={f.delivery_time} maxLength={50} onChange={(e) => setF({ ...f, delivery_time: e.target.value })} /></div>
        <div><Label htmlFor="pickup_time">Tempo médio de retirada</Label><Input id="pickup_time" value={f.pickup_time} maxLength={50} onChange={(e) => setF({ ...f, pickup_time: e.target.value })} /></div>
        <div><Label htmlFor="minimum_order">Pedido mínimo (R$)</Label><Input id="minimum_order" inputMode="decimal" value={f.minimum_order} onChange={(e) => setF({ ...f, minimum_order: e.target.value })} /></div>
        <Button type="submit" size="lg">Salvar</Button>
      </form>
    </div>
  );
}