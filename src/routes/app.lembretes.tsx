import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Bell, Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/lembretes")({ component: Lembretes });

function Lembretes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");

  const { data: lembretes } = useQuery({
    queryKey: ["lembretes"],
    queryFn: async () => (await supabase.from("lembretes").select("*").order("data_lembrete")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("lembretes").insert({ user_id: u.user!.id, titulo, data_lembrete: new Date(data).toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lembrete criado!"); setOpen(false); setTitulo(""); setData(""); qc.invalidateQueries({ queryKey: ["lembretes"] }); },
  });

  const toggle = useMutation({
    mutationFn: async (l: any) => { await supabase.from("lembretes").update({ concluido: !l.concluido }).eq("id", l.id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lembretes"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("lembretes").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lembretes"] }),
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Lembretes</h1>
          <p className="text-muted-foreground text-sm mt-1">Para não esquecer nada.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lembrete</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
              <div><Label>O que lembrar?</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus /></div>
              <div><Label>Quando</Label><Input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lembretes?.length === 0 && (
        <div className="bg-gradient-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Sem lembretes ainda.</p>
        </div>
      )}

      <div className="space-y-2">
        {lembretes?.map((l: any) => (
          <div key={l.id} className={cn("bg-card border rounded-xl p-4 flex items-center gap-3", l.concluido ? "border-border opacity-60" : "border-border")}>
            <button onClick={() => toggle.mutate(l)} className={cn("w-10 h-10 rounded-lg flex items-center justify-center", l.concluido ? "bg-success/15 text-success" : "bg-primary/10 text-primary")}>
              {l.concluido ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={cn("font-semibold", l.concluido && "line-through")}>{l.titulo}</div>
              <div className="text-xs text-muted-foreground">{new Date(l.data_lembrete).toLocaleString("pt-BR")}</div>
            </div>
            <button onClick={() => remove.mutate(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
