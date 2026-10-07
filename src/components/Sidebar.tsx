import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogIn, LogOut, Menu, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";


export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const item = "flex items-center gap-3 px-2 py-3 text-base font-medium text-foreground/80 transition-colors hover:text-foreground";

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle className="text-left font-display">Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col divide-y divide-border" onClick={() => setOpen(false)}>
            <Link to="/" className={`${item} font-body`} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-bold" }}>
              <Receipt className="h-5 w-5" /> Cardápio
            </Link>
            {user ? (
              <>
                <Link to="/meus-pedidos" className={`${item} font-body`} activeProps={{ className: "text-foreground font-bold" }}>
                  <Receipt className="h-5 w-5" /> Meus pedidos
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={`${item} font-body`} activeProps={{ className: "text-foreground font-bold" }}>
                    <LayoutDashboard className="h-5 w-5" /> Painel Admin
                  </Link>
                )}
                <button
                  type="button"
                  className={`${item} font-body text-destructive hover:text-destructive`}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="h-5 w-5" /> Sair
                </button>
              </>
            ) : (
              <Link to="/auth" className={`${item} font-body`}>
                <LogIn className="h-5 w-5" /> Entrar
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}