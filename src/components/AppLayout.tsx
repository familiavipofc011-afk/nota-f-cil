import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Package, Receipt, Bell, ScanLine, LogOut, House } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Início", icon: Home },
  { to: "/app/casas", label: "Casas", icon: House },
  { to: "/app/estoque", label: "Estoque", icon: Package },
  { to: "/app/escanear", label: "Escanear", icon: ScanLine },
  { to: "/app/gastos", label: "Gastos", icon: Receipt },
  { to: "/app/lembretes", label: "Lembretes", icon: Bell },
];

export function AppLayout() {
  const loc = useLocation();
  const nav2 = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    nav2({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-64 bg-sidebar text-sidebar-foreground flex-col p-6 gap-2">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-sidebar-primary">Casa da Mãe</h1>
          <p className="text-xs text-sidebar-foreground/70 mt-1">Tudo organizado</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to || (to !== "/app" && loc.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "hover:bg-sidebar-accent"
              )}>
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" onClick={logout} className="text-sidebar-foreground hover:bg-sidebar-accent justify-start">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-sidebar-primary">Casa da Mãe</h1>
        <Button variant="ghost" size="icon" onClick={logout} className="text-sidebar-foreground">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-50 grid grid-cols-6">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to || (to !== "/app" && loc.pathname.startsWith(to));
          return (
            <Link key={to} to={to} className={cn(
              "flex flex-col items-center justify-center py-2 gap-0.5 text-[10px]",
              active ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
