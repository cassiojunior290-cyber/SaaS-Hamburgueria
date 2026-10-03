import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrderCard } from "@/components/OrderCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nextStatus, STATUS_FLOW, STATUS_LABEL } from "@/lib/format";


export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminPage });

function AdminPage() {
  const [activeTab, setActiveTab] = useState("pedidos");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos">
          <AdminOrders />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("ativos");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  async function advance(id: string, status: string) {
    const n = nextStatus(status);
    if (!n) return;
    const { error } = await supabase.from("orders").update({ status: n }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status."); return; }
    toast.success(`Status: ${STATUS_LABEL[n]}`);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  const list = data?.filter((o) => (filter === "ativos" ? o.status !== "entregue" : filter === "todos" ? true : o.status === filter));

  return (
    <div>
      <h1 className="mb-4 text-3xl">Pedidos</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {[["ativos", "Em andamento"], ...STATUS_FLOW.map((s) => [s, STATUS_LABEL[s]]), ["todos", "Todos"]].map(([v, l]) => (
          <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v!)}>{l}</Button>
        ))}
      </div>
      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {list?.length === 0 && <p className="text-muted-foreground">Nenhum pedido.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {list?.map((o) => {
          const n = nextStatus(o.status);
          return (
            <OrderCard
              key={o.id}
              order={o}
              showCustomer
              actions={n && <Button variant="secondary" className="w-full" onClick={() => advance(o.id, o.status)}>Avançar para: {STATUS_LABEL[n]}</Button>}
            />
          );
        })}
      </div>
    </div>
  );
}