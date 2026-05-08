
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Casas (houses)
CREATE TABLE public.casas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#2d8a9e',
  icone TEXT DEFAULT 'home',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.casas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "casas owner all" ON public.casas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Itens (estoque)
CREATE TABLE public.itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  casa_id UUID REFERENCES public.casas ON DELETE SET NULL,
  nome TEXT NOT NULL,
  categoria TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  unidade TEXT DEFAULT 'un',
  quantidade_minima NUMERIC DEFAULT 1,
  preco_ultimo NUMERIC,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens owner all" ON public.itens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_itens_user ON public.itens(user_id);
CREATE INDEX idx_itens_casa ON public.itens(casa_id);

-- Compras (purchases / gastos)
CREATE TABLE public.compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  casa_id UUID REFERENCES public.casas ON DELETE SET NULL,
  estabelecimento TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  origem TEXT DEFAULT 'manual',
  nota_url TEXT,
  itens_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compras owner all" ON public.compras FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_compras_user_data ON public.compras(user_id, data_compra DESC);

-- Lembretes
CREATE TABLE public.lembretes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data_lembrete TIMESTAMPTZ NOT NULL,
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lembretes owner all" ON public.lembretes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket for notas fiscais
INSERT INTO storage.buckets (id, name, public) VALUES ('notas', 'notas', false);
CREATE POLICY "notas owner select" ON storage.objects FOR SELECT USING (bucket_id = 'notas' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "notas owner insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'notas' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "notas owner delete" ON storage.objects FOR DELETE USING (bucket_id = 'notas' AND auth.uid()::text = (storage.foldername(name))[1]);
