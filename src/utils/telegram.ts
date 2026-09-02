import { AndonCall } from "../types";

// =========================================================================
// TELEGRAM NOTIFICATION CONFIGURATION
// =========================================================================
// Read directly and safely from Vite environment variables.
// =========================================================================

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "-";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends a notification through our same-origin backend. Bot credentials are
 * deliberately server-only and are never bundled into browser JavaScript.
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ message }),
    });
    return response.ok;
  } catch (error) {
    console.warn("Telegram notification backend unavailable:", error);
    return false;
  }
}

/**
 * Formats Andon call details into a rich Telegram HTML message template with escaped inputs.
 */
export function formatAndonCallTelegramMessage(
  call: AndonCall, 
  actionType: "OPEN" | "ACK" | "RESOLVE" | "CANCEL"
): string {
  const headerText = {
    OPEN: "<b>ANDON CALL RAISED</b>",
    ACK: "<b>ANDON CALL ACKNOWLEDGED</b>",
    RESOLVE: "<b>ANDON CALL RESOLVED</b>",
    CANCEL: "<b>ANDON CALL CANCELLED</b>"
  }[actionType];

  const timestampStr = new Date(call.timestamp).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta"
  });

  let msg = `-----------------------------------------\n`;
  msg += `${headerText}\n`;
  msg += `-----------------------------------------\n`;
  msg += `<b>No. WO:</b> <code>${escapeHtml(call.ticketNo || call.id)}</code>\n`;
  msg += `<b>Lini:</b> ${escapeHtml(call.lineName)}\n`;
  msg += `<b>Workstation:</b> ${escapeHtml(call.workstation)}\n`;
  msg += `<b>Kategori:</b> ${escapeHtml(call.category.toUpperCase())}\n`;
  msg += `<b>Severity:</b> ${escapeHtml(call.severity.toUpperCase())}\n`;
  msg += `<b>Line Stop:</b> ${call.isLineStopped ? "YA" : "TIDAK"}\n`;
  msg += `<b>Operator:</b> ${escapeHtml(call.operatorName)}\n`;
  msg += `<b>Waktu:</b> ${escapeHtml(timestampStr)}\n`;

  if (actionType === "ACK" && call.acknowledgedBy) {
    msg += `-----------------------------------------\n`;
    msg += `<b>Responder:</b> ${escapeHtml(call.acknowledgedBy)}\n`;
    if (call.acknowledgedAt) {
      const responseTime = Math.round((call.acknowledgedAt - call.timestamp) / 1000);
      msg += `<b>Response Time:</b> ${responseTime} detik\n`;
    }
  }

  if (actionType === "RESOLVE") {
    msg += `-----------------------------------------\n`;
    if (call.resolvedBy) msg += `<b>Diperbaiki Oleh:</b> ${escapeHtml(call.resolvedBy)}\n`;
    if (call.rootCause) msg += `<b>Akar Masalah:</b> ${escapeHtml(call.rootCause)}\n`;
    if (call.resolutionNotes) msg += `<b>Tindakan Korektif:</b> ${escapeHtml(call.resolutionNotes)}\n`;
    if (call.resolvedAt) {
      const totalDowntimeSec = Math.round((call.resolvedAt - call.timestamp) / 1000);
      const m = Math.floor(totalDowntimeSec / 60);
      const s = totalDowntimeSec % 60;
      msg += `<b>Total Downtime:</b> ${m}m ${s}s\n`;
    }
  }
  msg += `-----------------------------------------`;

  return msg;
}
