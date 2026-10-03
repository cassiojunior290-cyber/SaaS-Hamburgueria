import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — CARTOON BURGUER" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Pedidos" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/categorias", label: "Categorias" },
  { to: "/admin/loja", label: "Loja" },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const isAdmin = useIsAdmin(user);
  const pathname = useLocation({ select: (l) => l.pathname });
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {isAdmin === null ? (
        <p className="p-8 text-muted-foreground">Verificando acesso...</p>
      ) : !isAdmin ? (
        <p className="p-8">Acesso restrito a administradores.</p>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-6">
          <nav className="mb-6 flex snap-x gap-2 overflow-x-auto scroll-smooth pb-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={(e) => e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })}
                activeOptions={{ exact: true }}
                className="snap-start whitespace-nowrap rounded-full border border-border px-4 py-1.5 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary"
                activeProps={{ className: "-translate-y-0.5 bg-primary text-primary-foreground border-primary shadow-md" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}
