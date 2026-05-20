import type { ApolloServerPlugin } from "@apollo/server";

import { devTrace, isDevTraceEnabled } from "../devTrace.js";

/**
 * Why: One log line per GraphQL operation ties browser mutations to BFF/PS traces without
 * instrumenting every resolver.
 * Course: Module 4–9 · CODE_PATH (watch [trace] graphql while using the UI)
 */
export function createDevTracePlugin(): ApolloServerPlugin {
  return {
    async requestDidStart(requestContext) {
      if (!isDevTraceEnabled()) return {};

      const op =
        requestContext.request.operationName ??
        inferOperationName(requestContext.request.query);
      const variables = requestContext.request.variables ?? {};
      const started = Date.now();

      devTrace("graphql", "request", {
        operation: op,
        variables: summarizeVariables(variables),
      });

      return {
        async willSendResponse(ctx) {
          const errors = ctx.errors?.map((e) => e.message) ?? [];
          devTrace("graphql", "response", {
            operation: op,
            ms: Date.now() - started,
            ...(errors.length > 0 ? { errors } : {}),
          });
        },
      };
    },
  };
}

function inferOperationName(query?: string): string {
  if (!query) return "anonymous";
  const match = query.match(/(?:query|mutation)\s+(\w+)/i);
  return match?.[1] ?? "anonymous";
}

function summarizeVariables(
  variables: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(variables)) {
    if (key === "input" && value && typeof value === "object") {
      const input = value as Record<string, unknown>;
      out.input = {
        emplid: input.emplid,
        name: input.name,
        effdt: input.effdt,
        hrStatus: input.hrStatus,
      };
      continue;
    }
    out[key] = value;
  }
  return out;
}
