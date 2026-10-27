import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartColumn, Lightbulb, TrendingDown, PiggyBank, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CATEGORIAS_GASTO, categoriaInfo } from "@/lib/categorias";

export const Route = createFileRoute("/app/relatorios")({ component: Relatorios });

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--accent)", "var(--warning)", "var(--success)", "var(--muted-foreground)"];

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const DICAS = [
  {
    titulo: "🧀 Frios por quilo, não por bandeja",
    texto: "Peça mussarela e presunto em peça ou fatiado na hora, por quilo. Sai bem mais barato que as bandejas embaladas e dura o mês se guardar bem fechado na geladeira.",
  },
  {
    titulo: "🛒 Pergunte se o supermercado entrega",
    texto: "Ligue ou passe no mercado do bairro e pergunte se fazem entrega. Muitos entregam de graça a partir de um valor — economiza transporte, tempo e evita compras por impulso no corredor.",
  },
  {
    titulo: "📅 Compre o básico do mês de uma vez",
    texto: "Arroz, feijão, óleo, café e produtos de limpeza: compre no atacarejo uma vez por mês. O preço por quilo cai muito e você só repõe o que acabar.",
  },
  {
    titulo: "🔥 Gás: compare antes de pedir",
    texto: "O preço do botijão varia bastante entre revendas. Ligue para 2 ou 3 e pergunte o valor e a taxa de entrega. Panela tampada e fogo baixo também fazem o gás durar mais.",
  },
  {
    titulo: "💡 Luz: apague o que não usa",
    texto: "Troque lâmpadas por LED, desligue a TV e carregadores da tomada quando ninguém usa e evite o horário de ponta (18h às 21h) para máquina de lavar e ferro.",
  },
  {
    titulo: "💧 Água: reaproveite",
    texto: "A água da máquina de lavar serve para lavar o quintal e o banheiro. Conserte vazamentos rápido — uma torneira pingando desperdiça dezenas de litros por dia.",
  },
  {
    titulo: "🥬 Feira no final vale ouro",
    texto: "No fim da feira os vendedores baixam o preço para não levar mercadoria de volta. Frutas e verduras da estação são sempre mais baratas e mais gostosas.",
  },
  {
    titulo: "💊 Farmácia: peça genéricos",
    texto: "Genéricos têm o mesmo efeito e custam bem menos. Compare preços entre farmácias — apps e programas de fidelidade dão descontos de verdade.",
  },
  {
    titulo: "🧾 Anote tudo (ou fale com o app!)",
    texto: "Quem anota gasta menos. Use a aba Escanear para fotografar a notinha ou fale o que comprou — assim você vê para onde o dinheiro está indo e onde dá para cortar.",
  },
  {
    titulo: "📦 Estoque: use o que tem antes de comprar",
    texto: "Antes de ir ao mercado, olhe o estoque no app. Evita comprar o que já tem e desperdiçar o que está perto de acabar.",
  },
];

function Relatorios() {
  const { data: compras } = useQuery({
    queryKey: ["compras"],
    queryFn: async () => (await supabase.from("compras").select("*").order("data_compra", { ascending: false })).data ?? [],
  });

  const lista = compras ?? [];
  const agora = new Date();

  // Últimos 6 meses
  const porMes = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
    const total = lista
      .filter((c: any) => {
        const cd = new Date(c.data_compra + "T00:00:00");
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      })
      .reduce((s: number, c: any) => s + Number(c.total), 0);
    return { mes: MESES[d.getMonth()], total: Number(total.toFixed(2)) };
  });

  const porCategoria = CATEGORIAS_GASTO.map((cat) => ({
    name: `${cat.emoji} ${cat.label}`,
    value: Number(lista.filter((c: any) => c.categoria === cat.value).reduce((s: number, c: any) => s + Number(c.total), 0).toFixed(2)),
  })).filter((c) => c.value > 0);

  const totalGeral = lista.reduce((s: number, c: any) => s + Number(c.total), 0);
  const totalMes = porMes[5].total;
  const mesesComGasto = porMes.filter((m) => m.total > 0).length;
  const mediaMensal = mesesComGasto > 0 ? porMes.reduce((s, m) => s + m.total, 0) / mesesComGasto : 0;
  const maiorCategoria = porCategoria.length > 0 ? [...porCategoria].sort((a, b) => b.value - a.value)[0] : null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Relatórios & economia</h1>
      <p className="text-muted-foreground text-sm mt-1">Veja para onde vai o dinheiro e como gastar menos.</p>

      <Tabs defaultValue="graficos" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="graficos"><ChartColumn className="w-4 h-4 mr-2" />Gráficos gerais</TabsTrigger>
          <TabsTrigger value="dicas"><Lightbulb className="w-4 h-4 mr-2" />Dicas de economia</TabsTrigger>
        </TabsList>

        <TabsContent value="graficos" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><PiggyBank className="w-4 h-4" />Total geral</div>
              <div className="font-display text-2xl font-bold mt-1">R$ {totalGeral.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarDays className="w-4 h-4" />Este mês</div>
              <div className="font-display text-2xl font-bold mt-1">R$ {totalMes.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><TrendingDown className="w-4 h-4" />Média mensal</div>
              <div className="font-display text-2xl font-bold mt-1">R$ {mediaMensal.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Onde mais gasta</div>
              <div className="font-display text-lg font-bold mt-1 truncate">{maiorCategoria?.name ?? "—"}</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold mb-4">Gastos por mês</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes}>
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={70} />
                  <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Gasto"]} />
                  <Bar dataKey="total" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold mb-4">Gastos por categoria</h2>
            {porCategoria.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Registre gastos para ver o gráfico.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porCategoria} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {porCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dicas" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {DICAS.map((d) => (
              <div key={d.titulo} className="bg-gradient-card border border-border rounded-2xl p-5 shadow-soft">
                <h3 className="font-display font-semibold">{d.titulo}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d.texto}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
