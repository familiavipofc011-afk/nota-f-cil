import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScanLine, Mic, Bell, Receipt, Package, House } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/app" });
    });
  }, [nav]);

  const features = [
    { icon: ScanLine, title: "Escaneie a nota", desc: "Tire foto da notinha e os itens entram automaticamente no estoque." },
    { icon: Mic, title: "Fale com o app", desc: "Diga o que comprou ou o que já tem em casa — ele organiza pra você." },
    { icon: House, title: "Várias casas", desc: "Casa 1, casa de aluguel, casa da avó. Tudo separado e organizado." },
    { icon: Package, title: "Estoque inteligente", desc: "Quantidade mínima, alertas quando algo está acabando." },
    { icon: Bell, title: "Lembretes", desc: "Nunca mais esqueça de comprar aquilo que está no fim." },
    { icon: Receipt, title: "Controle de gastos", desc: "Veja quanto você gastou, por casa, por mês, por categoria." },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-block bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Para quem cuida de tudo
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mt-6 leading-[1.05]">
              Sua casa <span className="text-accent">organizada</span> com inteligência.
            </h1>
            <p className="text-lg md:text-xl mt-6 text-primary-foreground/85 max-w-2xl">
              Escaneie notas fiscais, fale com o app, e tenha estoque, gastos e lembretes
              de todas as suas casas sempre atualizados — sem complicação.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-glow text-base">
                  Começar agora
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold text-base">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">Tudo num lugar só</h2>
        <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
          Pensado pra ser fácil de usar — para você, para sua mãe, para todo mundo.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {features.map((f) => (
            <div key={f.title} className="bg-gradient-card border border-border rounded-2xl p-6 shadow-soft hover:shadow-glow transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Pronto para começar?</h2>
          <p className="text-muted-foreground mt-3">Crie sua conta grátis em segundos.</p>
          <Link to="/login" className="inline-block mt-6">
            <Button size="lg" className="font-semibold">Criar conta grátis</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
