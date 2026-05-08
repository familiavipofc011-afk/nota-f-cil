import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { House, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/casas")({ component: Casas });

function Casas() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");

  const { data: casas } = useQuery({
    queryKey: ["casas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("casas").select("*, itens(count), compras(count)").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("casas").insert({ nome, user_id: u.user!.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Casa criada!"); setOpen(false); setNome(""); qc.invalidateQueries({ queryKey: ["casas"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("casas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Casa removida"); qc.invalidateQueries({ queryKey: ["casas"] }); },
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Minhas casas</h1>
          <p className="text-muted-foreground text-sm mt-1">Adicione todas que precisar gerenciar.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova casa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova casa</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <div>
                <Label>Nome (ex: Casa 1, Casa da avó)</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {casas?.length === 0 && (
        <div className="bg-gradient-card border border-dashed border-border rounded-2xl p-10 text-center">
          <House className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhuma casa ainda. Comece adicionando uma!</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {casas?.map((c: any) => (
          <div key={c.id} className="bg-gradient-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <House className="w-6 h-6" />
              </div>
              <button onClick={() => { if (confirm(`Remover ${c.nome}?`)) remove.mutate(c.id); }} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-display font-semibold text-lg mt-3">{c.nome}</h3>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>{c.itens?.[0]?.count ?? 0} itens</span>
              <span>{c.compras?.[0]?.count ?? 0} compras</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
