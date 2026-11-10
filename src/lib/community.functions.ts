import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supportSchema, messageSchema } from "./community.schemas";
import { z } from "zod";

export const createSupport = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => supportSchema.parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from("support_requests").insert({ ...data, user_id: context.userId }).select("id").single();
  if (result.error) throw new Error("Não foi possível enviar sua pergunta.");
  return result.data;
});

export const sendSupportMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => messageSchema.parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from("support_messages").insert({ ...data, sender_id: context.userId });
  if (result.error) throw new Error("Não foi possível enviar a mensagem.");
  return { ok: true };
});

export const exportSheet = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ scope: z.enum(["personal", "community"]) }).parse(input)).handler(async ({ data, context }) => {
  // Personal household records never become readable by admins or other users.
  const rows: (string | number | boolean | null)[][] = [];
  const timestamp = new Date().toISOString();
  if (data.scope === "personal") {
    const results = await Promise.all([
      context.supabase.from("casas").select("*").eq("user_id", context.userId),
      context.supabase.from("itens").select("*").eq("user_id", context.userId),
      context.supabase.from("compras").select("*").eq("user_id", context.userId),
      context.supabase.from("lembretes").select("*").eq("user_id", context.userId),
    ]);
    if (results.some((r: { error: unknown }) => r.error)) throw new Error("Não foi possível ler seus registros.");
    const [houses, items, purchases, reminders] = results;
    for (const r of houses.data ?? []) rows.push(["Casa", r.id, context.userId, r.nome, "", "", "", "", "", "", timestamp, JSON.stringify(r)]);
    for (const r of items.data ?? []) rows.push(["Estoque", r.id, context.userId, r.nome, r.casa_id, r.quantidade, r.unidade, r.preco_ultimo, r.categoria, Number(r.quantidade) <= Number(r.quantidade_minima ?? 1) ? "Acabando" : "Disponível", timestamp, JSON.stringify(r)]);
    for (const r of purchases.data ?? []) rows.push(["Gasto", r.id, context.userId, r.estabelecimento, r.casa_id, "", "", r.total, r.categoria, r.data_compra, timestamp, JSON.stringify(r)]);
    for (const r of reminders.data ?? []) rows.push(["Lembrete", r.id, context.userId, r.titulo, "", "", "", "", "", r.concluido ? "Concluído" : r.data_lembrete, timestamp, JSON.stringify(r)]);
  } else {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || !role.data) throw new Error("Acesso restrito ao responsável.");
    const [requests, messages, subscribers, notices] = await Promise.all([
      context.supabase.from("support_requests").select("*").order("created_at"),
      context.supabase.from("support_messages").select("*").order("created_at"),
      context.supabase.from("newsletter_subscribers").select("*").order("created_at"),
      context.supabase.from("community_notices").select("*").order("created_at"),
    ]);
    if ([requests, messages, subscribers, notices].some(r => r.error)) throw new Error("Não foi possível ler os contatos.");
    for (const r of requests.data ?? []) rows.push(["Atendimento", r.id, r.user_id, r.name, r.email, r.household_size, r.phone, r.monthly_spend, r.spending_topic, r.status, timestamp, JSON.stringify(r)]);
    for (const r of messages.data ?? []) rows.push(["Mensagem", r.id, r.sender_id, r.body, r.request_id, "", "", "", "", r.created_at, timestamp, JSON.stringify(r)]);
    for (const r of subscribers.data ?? []) rows.push(["Newsletter", r.id, "", r.email, "", "", "", "", "", "Consentimento mensal", timestamp, JSON.stringify(r)]);
    for (const r of notices.data ?? []) rows.push(["Aviso", r.id, r.recipient_id, r.title, r.body, "", "", "", "", r.read_at ? "Lido" : "Não lido", timestamp, JSON.stringify(r)]);
  }
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  const gatewayKey = process.env.LOVABLE_API_KEY;
  if (!key || !gatewayKey) throw new Error("A conexão com a planilha não está disponível.");
  const response = await fetch("https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/1z1wJjitqFP5inxH39FqFMFK-0AQqDgC8-YbKMUDtWCU/values/'Casa da Mãe · Central'!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS", {
    method: "POST", headers: { Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows.length ? rows : [["Resumo", "", context.userId, "Sem registros nesta exportação", "", "", "", "", "", "", timestamp, ""]] }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Sheets export failed [${response.status}]: ${detail}`);
    throw new Error(`A planilha não recebeu os dados (${response.status}).`);
  }
  return { count: rows.length, timestamp };
});