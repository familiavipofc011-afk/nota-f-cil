import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/gastos")({ component: Gastos });

function Gastos() {
  const { data: compras } = useQuery({
    queryKey: ["compras"],
    queryFn: async () => (await supabase.from("compras").select("*, casas(nome)").order("data_compra", { ascending: false }).limit(100)).data ?? [],
  });

  const totalMes = (compras ?? []).filter((c: any) => new Date(c.data_compra).getMonth() === new Date().getMonth() && new Date(c.data_compra).getFullYear() === new Date().getFullYear()).reduce((s: number, c: any) => s + Number(c.total), 0);
  const totalGeral = (compras ?? []).reduce((s: number, c: any) => s + Number(c.total), 0);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Gastos</h1>
      <p className="text-muted-foreground text-sm mt-1">Tudo que você comprou.</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Este mês</div>
          <div className="font-display text-3xl font-bold mt-1">R$ {totalMes.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="font-display text-3xl font-bold mt-1">R$ {totalGeral.toFixed(2)}</div>
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">Histórico</h2>
      {compras?.length === 0 && (
        <div className="bg-gradient-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhuma compra registrada ainda.</p>
        </div>
      )}
      <div className="space-y-2">
        {compras?.map((c: any) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{c.estabelecimento || "Compra"}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.data_compra).toLocaleDateString("pt-BR")} · {c.casas?.nome ?? "Sem casa"} · {c.origem}</div>
            </div>
            <div className="font-display font-bold">R$ {Number(c.total).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
