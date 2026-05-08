import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { imageBase64, casa_id } = await req.json();

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você extrai informações de notas fiscais brasileiras a partir de fotos. Retorne JSON via tool call. Quantidades e preços em números. Unidades comuns: un, kg, g, l, ml, pct.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia o estabelecimento, total e itens dessa nota fiscal." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extrair_nota",
            description: "Extrai dados da nota fiscal",
            parameters: {
              type: "object",
              properties: {
                estabelecimento: { type: "string" },
                total: { type: "number" },
                data: { type: "string", description: "Data no formato YYYY-MM-DD" },
                itens: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nome: { type: "string" },
                      quantidade: { type: "number" },
                      unidade: { type: "string" },
                      preco: { type: "number" },
                    },
                    required: ["nome", "quantidade"],
                  },
                },
              },
              required: ["itens"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extrair_nota" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Limite atingido, tente em alguns minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const txt = await aiRes.text();
      throw new Error(`AI gateway: ${aiRes.status} ${txt}`);
    }

    const ai = await aiRes.json();
    const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("IA não retornou itens");
    const parsed = JSON.parse(args);

    // Insert compra
    const { data: compra } = await supabase.from("compras").insert({
      user_id: userData.user.id,
      casa_id: casa_id || null,
      estabelecimento: parsed.estabelecimento ?? null,
      total: parsed.total ?? 0,
      data_compra: parsed.data ?? new Date().toISOString().slice(0, 10),
      origem: "nota_fiscal",
      itens_json: parsed.itens,
    }).select().single();

    // Upsert items into estoque
    let criados = 0;
    for (const it of parsed.itens ?? []) {
      const { data: existing } = await supabase
        .from("itens").select("*").eq("user_id", userData.user.id).ilike("nome", it.nome).maybeSingle();
      if (existing) {
        await supabase.from("itens").update({
          quantidade: Number(existing.quantidade) + Number(it.quantidade ?? 1),
          preco_ultimo: it.preco ?? existing.preco_ultimo,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("itens").insert({
          user_id: userData.user.id,
          casa_id: casa_id || null,
          nome: it.nome,
          quantidade: it.quantidade ?? 1,
          unidade: it.unidade ?? "un",
          preco_ultimo: it.preco ?? null,
        });
        criados++;
      }
    }

    return new Response(JSON.stringify({
      compra_id: compra?.id,
      estabelecimento: parsed.estabelecimento,
      total: parsed.total,
      itens: parsed.itens,
      itens_criados: parsed.itens?.length ?? 0,
      novos_itens: criados,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("processar-nota error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
