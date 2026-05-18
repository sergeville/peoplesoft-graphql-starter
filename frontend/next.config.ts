import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/api/graphql",
        destination:
          process.env.GRAPHQL_INTERNAL_URL ?? "http://localhost:4000/",
      },
    ];
  },
};

export default nextConfig;
