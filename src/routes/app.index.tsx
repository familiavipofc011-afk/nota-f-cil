import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { House, Package, AlertTriangle, Receipt, ScanLine, Mic } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [casas, itens, baixos, gastoMes] = await Promise.all([
        supabase.from("casas").select("id", { count: "exact", head: true }),
        supabase.from("itens").select("id", { count: "exact", head: true }),
        supabase.from("itens").select("id, quantidade, quantidade_minima"),
        supabase.from("compras").select("total").gte("data_compra", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      ]);
      const baixoCount = (baixos.data ?? []).filter((i: any) => Number(i.quantidade) <= Number(i.quantidade_minima ?? 0)).length;
      const total = (gastoMes.data ?? []).reduce((s: number, c: any) => s + Number(c.total ?? 0), 0);
      return { casas: casas.count ?? 0, itens: itens.count ?? 0, baixos: baixoCount, total };
    },
  });

  const cards = [
    { label: "Casas", value: stats?.casas ?? 0, icon: House, to: "/app/casas", color: "bg-primary/10 text-primary" },
    { label: "Itens", value: stats?.itens ?? 0, icon: Package, to: "/app/estoque", color: "bg-accent/15 text-accent" },
    { label: "Acabando", value: stats?.baixos ?? 0, icon: AlertTriangle, to: "/app/estoque", color: "bg-warning/20 text-warning-foreground" },
    { label: "Gasto do mês", value: `R$ ${(stats?.total ?? 0).toFixed(2)}`, icon: Receipt, to: "/app/gastos", color: "bg-success/15 text-success" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Olá! 👋</h1>
      <p className="text-muted-foreground mt-1">Tudo que precisa, num só lugar.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-gradient-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-glow transition">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="font-display text-2xl md:text-3xl font-bold mt-3">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Link to="/app/escanear" className="bg-gradient-hero text-primary-foreground rounded-2xl p-8 shadow-glow hover:scale-[1.01] transition-transform">
          <ScanLine className="w-10 h-10 mb-3" />
          <h2 className="font-display text-2xl font-bold">Escanear nota</h2>
          <p className="text-primary-foreground/85 text-sm mt-1">Foto da notinha → estoque atualizado.</p>
        </Link>
        <Link to="/app/escanear" className="bg-gradient-ocean text-primary-foreground rounded-2xl p-8 shadow-glow hover:scale-[1.01] transition-transform">
          <Mic className="w-10 h-10 mb-3" />
          <h2 className="font-display text-2xl font-bold">Falar com o app</h2>
          <p className="text-primary-foreground/85 text-sm mt-1">"Comprei 2 kg de arroz e 1 sabão"</p>
        </Link>
      </div>
    </div>
  );
}
