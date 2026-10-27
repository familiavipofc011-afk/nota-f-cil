ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'supermercado';

COMMENT ON COLUMN public.compras.categoria IS 'Categoria do gasto: supermercado, feira, farmacia, gas, luz, agua, aluguel, transporte, outros';