export function formatPayoutRequestShortId(requestId?: string | null) {
  const normalized = String(requestId || "").trim();
  if (!normalized) {
    return "—";
  }
  if (normalized.length <= 8) {
    return normalized;
  }
  return `…${normalized.slice(-6)}`;
}

export function formatPayoutRequestLinkLabel(params: {
  providerNetAmount: number;
  currency?: string | null;
  requestedAtLabel: string;
}) {
  const amount = formatPayoutRequestMoney(params.providerNetAmount, params.currency);
  return params.requestedAtLabel ? `${amount} · ${params.requestedAtLabel}` : amount;
}

export function formatPayoutRequestMoney(amount: number, currency?: string | null) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency || "RON",
  }).format(amount);
}
