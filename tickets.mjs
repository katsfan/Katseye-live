import { getStore } from "@netlify/blobs";

const MAX = 25;
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export default async (req) => {
  const store = getStore("katseye-live-tickets");
  let state = await store.get("state", { type: "json" }) || { count: 0, tickets: [] };

  if (req.method === "GET") {
    return new Response(JSON.stringify({ count: state.count, soldOut: state.count >= MAX }), { headers });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), { status: 405, headers });
  }

  let ticket;
  try { ticket = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers });
  }
  const required = ["roblox", "show", "ticket", "sector"];
  if (required.some(k => !String(ticket[k] || "").trim())) {
    return new Response(JSON.stringify({ error: "Preencha os campos obrigatórios." }), { status: 400, headers });
  }
  if (state.count >= MAX) {
    return new Response(JSON.stringify({ error: "Ingressos esgotados.", soldOut: true }), { status: 409, headers });
  }

  state.tickets.push({
    roblox: String(ticket.roblox).slice(0,30),
    tiktok: String(ticket.tiktok || "").slice(0,40),
    contact: String(ticket.contact || "").slice(0,100),
    show: String(ticket.show).slice(0,80),
    ticket: String(ticket.ticket).slice(0,60),
    sector: String(ticket.sector).slice(0,30),
    notes: String(ticket.notes || "").slice(0,300),
    createdAt: new Date().toISOString()
  });
  state.count += 1;
  await store.setJSON("state", state);
  return new Response(JSON.stringify({ ok: true, count: state.count, soldOut: state.count >= MAX }), { status: 201, headers });
};
