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

    const { audioBase64, casa_id } = await req.json();

    // Step 1: transcribe via Gemini (audio input)
    const transcribeRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcreva exatamente o que foi dito neste áudio em português brasileiro. Retorne apenas o texto transcrito, sem comentários." },
            { type: "input_audio", input_audio: { data: audioBase64.split(",")[1] ?? audioBase64, format: "webm" } },
          ],
        }],
      }),
    });
    if (!transcribeRes.ok) {
      const t = await transcribeRes.text();
      throw new Error(`Transcrição falhou: ${transcribeRes.status} ${t}`);
    }
    const tr = await transcribeRes.json();
    const transcricao = tr.choices?.[0]?.message?.content?.trim() ?? "";

    if (!transcricao) throw new Error("Não consegui entender o áudio");

    // Step 2: extract intents
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você ajuda a organizar o estoque de uma casa. A pessoa fala em português o que comprou ou tem em casa. Extraia os itens com nome (singular), quantidade e unidade. Identifique a ação: 'comprou' (compra nova - some ao estoque), 'tem' (informa estoque atual - define quantidade), 'acabou' (zera quantidade)." },
          { role: "user", content: transcricao },
        ],
        tools: [{
          type: "function",
          function: {
            name: "registrar_itens",
            parameters: {
              type: "object",
              properties: {
                acao: { type: "string", enum: ["comprou", "tem", "acabou"] },
                itens: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nome: { type: "string" },
                      quantidade: { type: "number" },
                      unidade: { type: "string" },
                    },
                    required: ["nome", "quantidade"],
                  },
                },
              },
              required: ["acao", "itens"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "registrar_itens" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Limite atingido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI: ${aiRes.status}`);
    }

    const ai = await aiRes.json();
    const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { acao: "tem", itens: [] };

    let processados = 0;
    for (const it of parsed.itens ?? []) {
      const { data: existing } = await supabase
        .from("itens").select("*").eq("user_id", userData.user.id).ilike("nome", it.nome).maybeSingle();

      if (parsed.acao === "comprou") {
        if (existing) {
          await supabase.from("itens").update({ quantidade: Number(existing.quantidade) + Number(it.quantidade), updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("itens").insert({ user_id: userData.user.id, casa_id: casa_id || null, nome: it.nome, quantidade: it.quantidade, unidade: it.unidade ?? "un" });
        }
      } else if (parsed.acao === "acabou") {
        if (existing) await supabase.from("itens").update({ quantidade: 0, updated_at: new Date().toISOString() }).eq("id", existing.id);
        else await supabase.from("itens").insert({ user_id: userData.user.id, casa_id: casa_id || null, nome: it.nome, quantidade: 0, unidade: it.unidade ?? "un" });
      } else {
        if (existing) {
          await supabase.from("itens").update({ quantidade: it.quantidade, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("itens").insert({ user_id: userData.user.id, casa_id: casa_id || null, nome: it.nome, quantidade: it.quantidade, unidade: it.unidade ?? "un" });
        }
      }
      processados++;
    }

    return new Response(JSON.stringify({
      transcricao,
      acao: parsed.acao,
      itens: parsed.itens,
      itens_processados: processados,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("processar-voz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
