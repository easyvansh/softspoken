import type { SoftSpokenMessage, SoftSpokenMessageType } from "./types";

export const softSpokenMessageTypes = [
  "softspoken.article.load-request",
  "softspoken.article.load-success",
  "softspoken.article.load-failure",
  "softspoken.playback.command",
  "softspoken.playback.state-request",
  "softspoken.playback.state-changed",
  "softspoken.settings.update",
  "softspoken.settings.request",
  "softspoken.settings.changed",
] as const satisfies readonly SoftSpokenMessageType[];

const messageTypeSet = new Set<string>(softSpokenMessageTypes);

export function isSoftSpokenMessage(
  value: unknown,
): value is SoftSpokenMessage {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.type === "string" && messageTypeSet.has(value.type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
