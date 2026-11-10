import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { exportSheet } from "@/lib/community.functions";
import { pageHead } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Sheet } from "lucide-react";
import { toast } from "sonner";
export const Route=createFileRoute("/app/planilha")({head:()=>pageHead("Minha planilha","Exporte suas casas, estoque, gastos e lembretes para a planilha Família 1M."),component:SheetPage});
function SheetPage(){const run=useServerFn(exportSheet);const [busy,setBusy]=useState(false);const [consent,setConsent]=useState(false);return <div className="max-w-3xl mx-auto p-6 md:p-10"><Sheet className="text-accent"/><h1 className="font-bold text-3xl mt-4">Sua casa também na planilha</h1><p className="text-muted-foreground mt-3">Casas, estoque, gastos e lembretes ficam em uma cópia datada na aba Casa da Mãe · Central.</p><label className="flex gap-3 mt-8 items-start"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Autorizo compartilhar meus registros com os responsáveis que têm acesso à planilha Família 1M.</label><Button className="mt-6" disabled={busy||!consent} onClick={async()=>{setBusy(true);try{const r=await run({data:{scope:"personal"}});toast.success(`${r.count} registros enviados à planilha.`);}catch(e){toast.error(e instanceof Error?e.message:"Exportação falhou.");}finally{setBusy(false);}}}><Sheet/>Enviar meus registros</Button><p className="text-sm text-muted-foreground mt-5">A planilha não substitui o app e não atualiza automaticamente. Um novo envio acrescenta uma nova cópia.</p></div>}