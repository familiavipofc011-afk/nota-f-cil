import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/app")({ component: AppRoute });

function AppRoute() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav({ to: "/login" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) nav({ to: "/login" });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  return <AppLayout />;
}
