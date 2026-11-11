// Click payloads are deliberately allowlisted and contain no visitor identifiers.
export const PANEL_ENDPOINT = "https://pixel-perfect-screen-replica-02.lovable.app/api/public/notificacao";
export function notifyPanelClick(evento: "Abrir app" | "Abrir economia" | "Abrir planilha", origem: string) {
  if (typeof window === "undefined") return;
  void fetch(PANEL_ENDPOINT, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evento, loja: "Casa da Mãe", origem, data_hora: new Date().toISOString() }) }).catch(() => {});
}