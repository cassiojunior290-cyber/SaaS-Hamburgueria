import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function SiteHeader({ storeName = "CARTOON BURGUER" }: { storeName?: string | undefined }) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user);
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-lg tracking-tight text-secondary sm:text-xl">
          {storeName}
        </Link>
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
