export const CATEGORIAS_GASTO = [
  { value: "supermercado", label: "Supermercado", emoji: "🛒" },
  { value: "feira", label: "Feira & Hortifruti", emoji: "🥬" },
  { value: "farmacia", label: "Farmácia", emoji: "💊" },
  { value: "gas", label: "Gás", emoji: "🔥" },
  { value: "luz", label: "Luz", emoji: "💡" },
  { value: "agua", label: "Água", emoji: "💧" },
  { value: "aluguel", label: "Aluguel", emoji: "🏠" },
  { value: "transporte", label: "Transporte", emoji: "🚌" },
  { value: "outros", label: "Outros", emoji: "📦" },
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]["value"];

export function categoriaInfo(value: string | null | undefined) {
  return CATEGORIAS_GASTO.find((c) => c.value === value) ?? CATEGORIAS_GASTO[CATEGORIAS_GASTO.length - 1];
}
