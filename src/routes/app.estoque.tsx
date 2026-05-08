import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Minus, Trash2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/estoque")({ component: Estoque });

function Estoque() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [casaFilter, setCasaFilter] = useState<string>("todas");
  const [showLow, setShowLow] = useState(false);
  const [form, setForm] = useState({ nome: "", quantidade: "1", unidade: "un", quantidade_minima: "1", casa_id: "" });

  const { data: casas } = useQuery({
    queryKey: ["casas"],
    queryFn: async () => (await supabase.from("casas").select("*").order("nome")).data ?? [],
  });

  const { data: itens } = useQuery({
    queryKey: ["itens"],
    queryFn: async () => (await supabase.from("itens").select("*, casas(nome)").order("nome")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("itens").insert({
        user_id: u.user!.id,
        nome: form.nome,
        quantidade: Number(form.quantidade),
        unidade: form.unidade,
        quantidade_minima: Number(form.quantidade_minima),
        casa_id: form.casa_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Item adicionado!"); setOpen(false); setForm({ nome: "", quantidade: "1", unidade: "un", quantidade_minima: "1", casa_id: "" }); qc.invalidateQueries({ queryKey: ["itens"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { error } = await supabase.from("itens").update({ quantidade: Math.max(0, qty), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itens"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("itens").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itens"] }),
  });

  const filtered = (itens ?? []).filter((i: any) => {
    if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (casaFilter !== "todas" && i.casa_id !== casaFilter) return false;
    if (showLow && Number(i.quantidade) > Number(i.quantidade_minima ?? 0)) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground text-sm mt-1">Tudo que tem em casa.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Adicionar item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo item</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required autoFocus /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quantidade</Label><Input type="number" step="0.01" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></div>
                <div><Label>Unidade</Label><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></div>
                <div><Label>Mínimo</Label><Input type="number" step="0.01" value={form.quantidade_minima} onChange={(e) => setForm({ ...form, quantidade_minima: e.target.value })} /></div>
              </div>
              <div>
                <Label>Casa</Label>
                <Select value={form.casa_id} onValueChange={(v) => setForm({ ...form, casa_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sem casa" /></SelectTrigger>
                  <SelectContent>{casas?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={casaFilter} onValueChange={setCasaFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as casas</SelectItem>
            {casas?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={showLow ? "default" : "outline"} onClick={() => setShowLow(!showLow)}>
          <AlertTriangle className="w-4 h-4 mr-2" />Acabando
        </Button>
      </div>

      {filtered.length === 0 && (
        <div className="bg-gradient-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhum item ainda.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((i: any) => {
          const baixo = Number(i.quantidade) <= Number(i.quantidade_minima ?? 0);
          return (
            <div key={i.id} className={cn("bg-card border rounded-xl p-4 flex items-center gap-3 shadow-soft", baixo ? "border-warning" : "border-border")}>
              <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center", baixo ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary")}>
                {baixo ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{i.nome}</div>
                <div className="text-xs text-muted-foreground">{i.casas?.nome ?? "Sem casa"} · mín. {i.quantidade_minima} {i.unidade}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => updateQty.mutate({ id: i.id, qty: Number(i.quantidade) - 1 })}><Minus className="w-4 h-4" /></Button>
                <span className="font-bold tabular-nums w-10 text-center">{Number(i.quantidade)}</span>
                <Button size="icon" variant="ghost" onClick={() => updateQty.mutate({ id: i.id, qty: Number(i.quantidade) + 1 })}><Plus className="w-4 h-4" /></Button>
                <span className="text-xs text-muted-foreground w-8">{i.unidade}</span>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${i.nome}?`)) remove.mutate(i.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
