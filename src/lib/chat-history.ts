export const CHAT_HISTORY_MS = 7 * 24 * 60 * 60 * 1000;

export function chatHistory(closedAt: Date | string | null | undefined, now = Date.now()) {
  const timestamp = closedAt ? new Date(closedAt).getTime() : NaN;
  const readOnlyAt = Number.isFinite(timestamp) ? new Date(timestamp + CHAT_HISTORY_MS) : null;
  return { readOnlyAt, isHistory: !!readOnlyAt && now >= readOnlyAt.getTime() };
}
