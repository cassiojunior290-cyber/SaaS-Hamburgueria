import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface StoreSettings {
  logo_url: string;
}

export function SiteHeader({ storeName = "CARTOON BURGUER" }: { storeName?: string | undefined }) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user);
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      const { data, error } = await supabase.from("store_settings").select("logo_url").eq("id", 1).single();

      if (!error && data) {
        setLogoUrl(data.logo_url);
      }
    }

    fetchLogo();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
          ) : (
            <Link to="/" className="font-display text-lg tracking-tight text-secondary sm:text-xl">
              {storeName}
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link to="/meus-pedidos" className="rounded-md px-3 py-1.5 text-background hover:bg-background/10">
                Meus pedidos
              </Link>
              {isAdmin && (
                <Link to="/admin" className="rounded-md px-3 py-1.5 text-background hover:bg-background/10">
                  Admin
                </Link>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}