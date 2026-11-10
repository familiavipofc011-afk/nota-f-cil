import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, ArrowRight } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  return <section className="bg-secondary border-t border-border px-6 py-14">
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
      <div><Mail className="text-accent mb-4" /><p className="text-sm font-semibold text-accent">FAMÍLIA 1M</p><h2 className="text-3xl font-bold mt-2">Receba notícias mensalmente</h2><p className="text-muted-foreground mt-3">Ideias, projetos, negócios e família. Um novo olhar para viver melhor.</p><Button asChild variant="link" className="px-0 mt-3"><Link to="/app/ajuda">Acompanhe nós também <ArrowRight /></Link></Button></div>
      <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (!consent) return; const parsed = z.string().trim().email().max(255).safeParse(email); if (!parsed.success) return toast.error("Confira seu e-mail."); setBusy(true); const { error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data.toLowerCase(), consent: true }); setBusy(false); if (error) return toast.error(error.code === "23505" ? "Este e-mail já está inscrito." : "Não foi possível cadastrar."); toast.success("Inscrição registrada!"); setEmail(""); setConsent(false); }}>
        <Label htmlFor="newsletter-email">Seu e-mail</Label><Input id="newsletter-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={255} placeholder="voce@exemplo.com" />
        <Label className="flex items-start gap-3 leading-relaxed"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required className="mt-1" />Quero receber a newsletter mensal e autorizo o uso do meu e-mail para isso.</Label>
        <Button disabled={busy || !consent} type="submit"><Mail />Quero acompanhar</Button><p className="text-xs text-muted-foreground">Sem cobrança. <Link to="/privacidade" className="underline">Privacidade e cancelamento</Link></p>
      </form>
    </div>
  </section>;
}