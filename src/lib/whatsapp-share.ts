/**
 * Partilha formatada de estado de ATM no WhatsApp — KUSANGA KITADI
 * Formata texto amigável e pronto para grupos e conversas privadas em Angola.
 */

export interface ShareableAtm {
  bank: string;
  name: string;
  area: string;
  availability: string;
  updated?: string;
  queueTime?: string;
  notesAvailable?: string;
  lat?: number;
  lng?: number;
}

export function buildWhatsAppShareUrl(atm: ShareableAtm): string {
  const isAvailable = atm.availability === "available";
  const isNoCash = atm.availability === "no-cash" || atm.availability === "empty";
  
  const statusText = isAvailable
    ? "✅ COM DINHEIRO DISPONÍVEL"
    : isNoCash
    ? "❌ SEM DINHEIRO NO MOMENTO"
    : "⚠️ ESTADO INCERTO / A CONFIRMAR";

  const queueMap: Record<string, string> = {
    none: "Sem fila (atendimento direto)",
    short: "Fila rápida (< 5 min)",
    medium: "Fila moderada (5 a 15 min)",
    long: "Fila longa (> 15 min)",
  };

  const queueText = atm.queueTime && queueMap[atm.queueTime]
    ? `\n👥 *Fila no local:* ${queueMap[atm.queueTime]}`
    : "";

  const notesText = atm.notesAvailable
    ? `\n💵 *Notas reportadas:* ${atm.notesAvailable}`
    : "";

  const updatedText = atm.updated
    ? `\n⏱️ *Reporte:* ${atm.updated}`
    : "";

  const mapsText = atm.lat && atm.lng
    ? `\n📍 *Rota:* https://maps.google.com/?q=${atm.lat},${atm.lng}`
    : "";

  const message =
    `🏧 *KUSANGA KITADI* — _Saiba onde levantar!_\n\n` +
    `🏦 *Banco:* ${atm.bank} · ${atm.name}\n` +
    `📌 *Localização:* ${atm.area}\n` +
    `💰 *Disponibilidade:* ${statusText}` +
    `${queueText}` +
    `${notesText}` +
    `${updatedText}` +
    `${mapsText}\n\n` +
    `🇦🇴 _A força está na ligação. Informação comunitária de Luanda._\n` +
    `👉 Consulta outros caixas em: http://localhost:8080`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppShare(atm: ShareableAtm): void {
  const url = buildWhatsAppShareUrl(atm);
  window.open(url, "_blank", "noopener,noreferrer");
}
