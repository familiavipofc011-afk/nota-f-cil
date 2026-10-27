import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Plus, ChartColumn, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIAS_GASTO, categoriaInfo } from "@/lib/categorias";

export const Route = createFileRoute("/app/gastos")({ component: Gastos });

function Gastos() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<string>("todas");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState("supermercado");
  const [casaId, setCasaId] = useState("");

  const { data: compras } = useQuery({
    queryKey: ["compras"],
    queryFn: async () => (await supabase.from("compras").select("*, casas(nome)").order("data_compra", { ascending: false }).limit(200)).data ?? [],
  });
  const { data: casas } = useQuery({
    queryKey: ["casas"],
    queryFn: async () => (await supabase.from("casas").select("*").order("nome")).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("compras").insert({
        user_id: u.user!.id,
        estabelecimento: nome,
        total: Number(valor.replace(",", ".")),
        data_compra: data,
        categoria,
        casa_id: casaId || null,
        origem: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gasto registrado!");
      setOpen(false);
      setNome(""); setValor("");
      qc.invalidateQueries({ queryKey: ["compras"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Gasto removido"); qc.invalidateQueries({ queryKey: ["compras"] }); },
  });

  const agora = new Date();
  const filtradas = (compras ?? []).filter((c: any) => filtro === "todas" || c.categoria === filtro);
  const totalMes = filtradas.filter((c: any) => {
    const d = new Date(c.data_compra + "T00:00:00");
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
  }).reduce((s: number, c: any) => s + Number(c.total), 0);
  const totalGeral = filtradas.reduce((s: number, c: any) => s + Number(c.total), 0);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Gastos</h1>
          <p className="text-muted-foreground text-sm mt-1">Mercado, gás, luz, água e tudo mais.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/relatorios">
            <Button variant="outline"><ChartColumn className="w-4 h-4 mr-2" />Relatórios</Button>
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Adicionar gasto</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo gasto</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-4">
                <div>
                  <Label>O que foi? (ex: Conta de luz, Botijão de gás)</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" required inputMode="decimal" />
                  </div>
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_GASTO.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Casa (opcional)</Label>
                  <Select value={casaId} onValueChange={setCasaId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sem casa específica" /></SelectTrigger>
                    <SelectContent>{casas?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={add.isPending}>Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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

      <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltro("todas")}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${filtro === "todas" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
        >
          Todas
        </button>
        {CATEGORIAS_GASTO.map((c) => (
          <button
            key={c.value}
            onClick={() => setFiltro(c.value)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${filtro === c.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mt-6 mb-3">Histórico</h2>
      {filtradas.length === 0 && (
        <div className="bg-gradient-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhum gasto registrado ainda.</p>
        </div>
      )}
      <div className="space-y-2">
        {filtradas.map((c: any) => {
          const cat = categoriaInfo(c.categoria);
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">{cat.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.estabelecimento || "Gasto"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(c.data_compra + "T00:00:00").toLocaleDateString("pt-BR")} · {cat.label} · {c.casas?.nome ?? "Sem casa"}
                </div>
              </div>
              <div className="font-display font-bold">R$ {Number(c.total).toFixed(2)}</div>
              <button onClick={() => { if (confirm("Remover este gasto?")) remove.mutate(c.id); }} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
