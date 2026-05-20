/**
 * Dev-only request tracing for the GraphQL → BFF → PS path.
 * Enable: default ON when NODE_ENV !== "production". Force off: DEV_TRACE=0. Force on: DEV_TRACE=1.
 * Course: CODE_PATH_GRAPHQL_TO_PS.md (follow logs while running npm run dev / dev:mock-ps)
 */

export function isDevTraceEnabled(): boolean {
  if (process.env.DEV_TRACE === "0") return false;
  if (process.env.DEV_TRACE === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** Structured log: [trace] layer · event — detail */
export function devTrace(
  layer: string,
  event: string,
  detail?: Record<string, unknown>,
): void {
  if (!isDevTraceEnabled()) return;
  const suffix =
    detail && Object.keys(detail).length > 0
      ? ` — ${JSON.stringify(detail)}`
      : "";
  console.log(`[trace] ${layer} · ${event}${suffix}`);
}

/** Function entry — use at the top of each traced function to show the call path. */
export function traceFn(
  layer: string,
  functionName: string,
  detail?: Record<string, unknown>,
): void {
  devTrace(layer, `${functionName}()`, detail);
}

/** Function return — optional; use before return with result hints. */
export function traceFnReturn(
  layer: string,
  functionName: string,
  detail?: Record<string, unknown>,
): void {
  devTrace(layer, `${functionName} ←`, detail);
}

/** Log async work with duration on success or failure. */
export async function devTraceAsync<T>(
  layer: string,
  event: string,
  detail: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isDevTraceEnabled()) return fn();
  const start = Date.now();
  devTrace(layer, `${event} →`, detail);
  try {
    const result = await fn();
    devTrace(layer, `${event} ←`, { ...detail, ms: Date.now() - start });
    return result;
  } catch (err) {
    devTrace(layer, `${event} ✗`, {
      ...detail,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
