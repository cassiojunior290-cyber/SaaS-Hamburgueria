import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
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
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {isAdmin === null ? (
        <p className="p-8 text-muted-foreground">Verificando acesso...</p>
      ) : !isAdmin ? (
        <p className="p-8">Acesso restrito a administradores.</p>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-6">
          <nav className="mb-6 flex gap-2 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: true }}
                className="whitespace-nowrap rounded-full border border-border px-4 py-1.5 text-sm font-semibold"
                activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Outlet />
        </div>
      )}
    </div>
  );
}
