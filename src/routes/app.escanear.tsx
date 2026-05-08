import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScanLine, Mic, Camera, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/app/escanear")({ component: Escanear });

function Escanear() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [casaId, setCasaId] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: casas } = useQuery({
    queryKey: ["casas"],
    queryFn: async () => (await supabase.from("casas").select("*").order("nome")).data ?? [],
  });

  const handleFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("processar-nota", {
        body: { imageBase64: dataUrl, casa_id: casaId || null },
      });
      if (error) throw error;
      setResult(data);
      toast.success(`${data.itens_criados ?? 0} itens adicionados ao estoque!`);
      qc.invalidateQueries({ queryKey: ["itens"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar nota");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const processAudio = async (blob: Blob) => {
    setLoading(true);
    setResult(null);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke("processar-voz", {
        body: { audioBase64: dataUrl, casa_id: casaId || null },
      });
      if (error) throw error;
      setResult(data);
      toast.success(`${data.itens_processados ?? 0} itens registrados!`);
      qc.invalidateQueries({ queryKey: ["itens"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar áudio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Escanear & falar</h1>
      <p className="text-muted-foreground text-sm mt-1">Tire foto da nota ou fale o que tem.</p>

      <div className="mt-6">
        <label className="text-sm font-medium">Casa de destino (opcional)</label>
        <Select value={casaId} onValueChange={setCasaId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Sem casa específica" /></SelectTrigger>
          <SelectContent>{casas?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <button
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          className="bg-gradient-hero text-primary-foreground rounded-2xl p-8 shadow-glow hover:scale-[1.01] transition disabled:opacity-60 text-left"
        >
          <ScanLine className="w-12 h-12 mb-3" />
          <h2 className="font-display text-2xl font-bold">Escanear nota fiscal</h2>
          <p className="text-sm mt-1 text-primary-foreground/85">Foto da notinha ou QR code</p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </button>

        <button
          disabled={loading}
          onClick={recording ? stopRecording : startRecording}
          className="bg-gradient-ocean text-primary-foreground rounded-2xl p-8 shadow-glow hover:scale-[1.01] transition disabled:opacity-60 text-left"
        >
          <Mic className={`w-12 h-12 mb-3 ${recording ? "animate-pulse text-warning" : ""}`} />
          <h2 className="font-display text-2xl font-bold">{recording ? "Gravando…" : "Falar com o app"}</h2>
          <p className="text-sm mt-1 text-primary-foreground/85">{recording ? "Toque para parar" : "Diga o que comprou ou tem"}</p>
        </button>
      </div>

      {loading && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Processando com IA…</span>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gradient-card border border-success/40 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-success font-semibold">
            <Check className="w-5 h-5" /> Pronto!
          </div>
          {result.estabelecimento && <p className="text-sm mt-2"><strong>Estabelecimento:</strong> {result.estabelecimento}</p>}
          {result.total != null && <p className="text-sm"><strong>Total:</strong> R$ {Number(result.total).toFixed(2)}</p>}
          {result.transcricao && <p className="text-sm mt-2 italic text-muted-foreground">"{result.transcricao}"</p>}
          {result.itens && result.itens.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {result.itens.map((it: any, i: number) => (
                <li key={i} className="flex justify-between"><span>{it.nome}</span><span className="text-muted-foreground">{it.quantidade} {it.unidade}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8 bg-secondary rounded-2xl p-5 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">💡 Como falar</h3>
        <ul className="space-y-1">
          <li>• "Comprei 2 quilos de arroz e 3 sabões"</li>
          <li>• "Tenho 5 latas de leite condensado"</li>
          <li>• "Acabou o detergente"</li>
        </ul>
      </div>

      <div className="mt-8">
        <Button variant="outline" className="w-full" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e: any) => e.target.files?.[0] && handleFile(e.target.files[0]); input.click(); }}>
          <Camera className="w-4 h-4 mr-2" />Selecionar foto da galeria
        </Button>
      </div>
    </div>
  );
}
