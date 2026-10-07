import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

interface StoreInfoData {
  store_name: string | null;
  delivery_fee: number | null;
  is_open: boolean | null;
  logo_url: string | null;
  address: string | null;
  bio: string | null;
  delivery_time: string | null;
  pickup_time: string | null;
  minimum_order: number | null;
  address_url: string | null;
}

export function StoreInfo() {
  const [s, setS] = useState<StoreInfoData | null>(null);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (error) console.error("Erro ao buscar informações da loja:", error);
        else setS(data as unknown as StoreInfoData);
      });
  }, []);

  if (!s) return null;
  const fee = Number(s.delivery_fee ?? 0);
  const dot = <span className="text-muted-foreground/60">•</span>;

  return (
    <div className="relative">
      <div className="relative -mt-10 rounded-t-[32px] bg-card px-5 pb-6 pt-16 text-center [box-shadow:var(--shadow-soft)] sm:rounded-b-3xl">
        <div className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-card bg-card [box-shadow:var(--shadow-lift)]">
          {s.logo_url && <img src={s.logo_url} alt="Logo da loja" className="h-full w-full object-cover" />}
        </div>

        <h1 className="font-body text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {s.store_name ?? "Cartoon Burguer"}
        </h1>

        {s.bio && <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{s.bio}</p>}

        {s.address && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {s.address_url ? (
              <a href={s.address_url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4 hover:text-foreground">
                {s.address}
              </a>
            ) : (
              <span className="underline decoration-dotted underline-offset-4">{s.address}</span>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-foreground">
          <span className={`font-bold ${s.is_open ? "text-success" : "text-destructive"}`}>{s.is_open ? "Aberto agora" : "Fechado"}</span>
          {dot}
          <span>
            Entrega {s.delivery_time && <strong>{s.delivery_time}</strong>}
            <span className={fee === 0 ? "font-bold text-success" : "font-bold"}>· {fee === 0 ? "Grátis" : brl(fee)}</span>
          </span>
          {s.pickup_time && (
            <>
              {dot}
              <span>
                Retirada <strong>{s.pickup_time}</strong>
              </span>
            </>
          )}
          {!!s.minimum_order && (
            <>
              {dot}
              <span>
                Mín. <strong>{brl(s.minimum_order)}</strong>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}