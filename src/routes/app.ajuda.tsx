import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createSupport, sendSupportMessage } from "@/lib/community.functions";
import { supportSchema } from "@/lib/community.schemas";
import { pageHead } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ajuda")({ head:()=>pageHead("Ajuda para economizar", "Converse com o responsável e encontre oportunidades de economia para sua família."), component: Help });
function Help() {
  const qc=useQueryClient(); const create=useServerFn(createSupport); const send=useServerFn(sendSupportMessage);
  const [active,setActive]=useState(""); const [body,setBody]=useState(""); const [busy,setBusy]=useState(false);
  const {data:requests=[]}=useQuery({queryKey:["my-support"],queryFn:async()=>{ const u=await supabase.auth.getUser(); if(!u.data.user) throw new Error("Entre na sua conta."); const r=await supabase.from("support_requests").select("*").eq("user_id",u.data.user.id).order("created_at",{ascending:false}); if(r.error)throw r.error;return r.data; }});
  const {data:messages=[]}=useQuery({queryKey:["support-messages",active],enabled:!!active,queryFn:async()=>{const r=await supabase.from("support_messages").select("*").eq("request_id",active).order("created_at");if(r.error)throw r.error;return r.data;}});
  return <div className="max-w-4xl mx-auto p-6 md:p-10"><MessageCircle className="text-accent mb-3"/><h1 className="text-3xl font-bold">Posso te ajudar a economizar com algo?</h1><p className="text-muted-foreground mt-2">Me diga algumas informações básicas. Responderei em instantes, assim que estiver disponível.</p>
    <form className="mt-8 grid sm:grid-cols-2 gap-4" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const parsed=supportSchema.safeParse({...Object.fromEntries(f),consent:f.get("consent")==="on"});if(!parsed.success)return toast.error("Confira os campos e autorize o atendimento.");setBusy(true);try{const r=await create({data:parsed.data});setActive(r.id);await qc.invalidateQueries({queryKey:["my-support"]});toast.success("Pergunta recebida. Sua resposta ficará aqui.");}catch{toast.error("Não foi possível enviar.");}finally{setBusy(false);}}}>
    {[["name","Nome","text"],["phone","Telefone","tel"],["email","E-mail","email"],["household_size","Quantas pessoas moram com você?","number"],["spending_topic","Em que você quer economizar?","text"],["monthly_spend","Quanto gasta por mês nisso? (R$)","number"]].map(([name,label,type])=><div key={name}><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required min={name==="household_size"?1:0} step={name==="monthly_spend"?"0.01":undefined} maxLength={255}/></div>)}
    <div className="sm:col-span-2"><Label htmlFor="question">Sua pergunta</Label><Textarea id="question" name="question" required maxLength={2000}/></div><Label className="sm:col-span-2 flex gap-2 items-start"><input type="checkbox" name="consent" required/>Autorizo compartilhar estas informações com o responsável pelo atendimento e sua planilha. <Link to="/privacidade" className="underline">Privacidade</Link></Label><Button type="submit" disabled={busy}><Send/>Enviar pergunta</Button></form>
    <div className="border-t border-border mt-10 pt-6"><div className="flex justify-between"><h2 className="text-xl font-bold">Minhas conversas</h2><Button variant="ghost" size="icon" aria-label="Atualizar conversas" onClick={()=>{qc.invalidateQueries({queryKey:["my-support"]});qc.invalidateQueries({queryKey:["support-messages"]});}}><RefreshCw/></Button></div><div className="flex flex-wrap gap-2 mt-4">{requests.map(r=><Button key={r.id} variant={active===r.id?"default":"outline"} onClick={()=>setActive(r.id)} className="max-w-full whitespace-normal h-auto">{r.spending_topic} · {r.status}</Button>)}</div>
    {active&&<div className="mt-5 space-y-4"><p className="font-medium">{requests.find(r=>r.id===active)?.question}</p>{messages.map(m=><div key={m.id} className="border-l-2 border-accent pl-4"><p className="text-xs text-muted-foreground">{m.sender_id===requests.find(r=>r.id===active)?.user_id?"Você":"Atendimento"}</p><p className="whitespace-pre-wrap break-words">{m.body}</p></div>)}<form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await send({data:{request_id:active,body}});setBody("");await qc.invalidateQueries({queryKey:["support-messages",active]});}catch{toast.error("Mensagem não enviada.");}finally{setBusy(false);}}} className="flex gap-2"><Textarea aria-label="Sua mensagem" value={body} onChange={e=>setBody(e.target.value)} required maxLength={2000}/><Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={busy}><Send/></Button></form></div>}
    </div></div>;
}