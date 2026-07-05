export type AdminRouteErrorDebug = {
  step: string | null;
  message: string;
  code: string | number | null;
  details: string | null;
  name: string | null;
};

export function serializeRouteError(error: unknown, step?: string): AdminRouteErrorDebug {
  const base = error instanceof Error ? error : new Error(String(error));
  const extended = base as Error & { code?: string | number; details?: string };

  return {
    step: step || null,
    message: extended.message || String(error),
    code: extended.code ?? null,
    details: extended.details ?? null,
    name: extended.name || null,
  };
}

export function formatAdminRouteErrorMessage(
  fallback: string,
  debug?: AdminRouteErrorDebug | null,
) {
  if (!debug) {
    return fallback;
  }

  const parts = [
    fallback,
    debug.step ? `[${debug.step}]` : null,
    debug.message || null,
    debug.code !== null && debug.code !== undefined ? `(code: ${debug.code})` : null,
    debug.details || null,
  ].filter(Boolean);

  return parts.join(" ");
}
