import { useEffect, useState } from "react";
import { MapPin, Clock, ShoppingCart, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

interface StoreInfoData {
  banner_url: string | null;
  logo_url: string | null;
  address: string | null;
  bio: string | null;
  delivery_time: string | null;
  pickup_time: string | null;
  minimum_order: number | null;
  address_url: string | null;
}

export function StoreInfo() {
  const [storeInfo, setStoreInfo] = useState<StoreInfoData | null>(null);

  useEffect(() => {
    async function fetchStoreInfo() {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Erro ao buscar informações da loja:", error);
      } else {
        setStoreInfo(data);
      }
    }

    fetchStoreInfo();
  }, []);

  if (!storeInfo) return null;

  return (
    <div className="space-y-4">
      {storeInfo.banner_url && (
        <div className="relative aspect-[4/1] w-full overflow-hidden rounded-lg">
          <img
            src={storeInfo.banner_url}
            alt="Banner da loja"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-4 md:flex-row">
        {storeInfo.logo_url && (
          <div className="h-24 w-24 rounded-full border-4 border-primary">
            <img
              src={storeInfo.logo_url}
              alt="Logo da loja"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 space-y-2">
          {storeInfo.bio && (
            <p className="text-center text-sm text-muted-foreground md:text-left">
              {storeInfo.bio}
            </p>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {storeInfo.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {storeInfo.address_url ? (
                  <a
                    href={storeInfo.address_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    {storeInfo.address}
                  </a>
                ) : (
                  <span className="text-sm">{storeInfo.address}</span>
                )}
              </div>
            )}

            {storeInfo.delivery_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">Entrega: {storeInfo.delivery_time}</span>
              </div>
            )}

            {storeInfo.pickup_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">Retirada: {storeInfo.pickup_time}</span>
              </div>
            )}

            {storeInfo.minimum_order && (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="text-sm">Pedido mínimo: {brl(storeInfo.minimum_order)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}