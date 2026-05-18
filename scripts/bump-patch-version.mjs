#!/usr/bin/env node
/**
 * Bump patch version (x.y.Z) in root, backend, and frontend package.json.
 * Keeps all three in sync.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packagePaths = [
  "package.json",
  "backend/package.json",
  "frontend/package.json",
];

function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid semver (expected x.y.z): ${version}`);
  }
  const patch = Number(match[3]) + 1;
  return `${match[1]}.${match[2]}.${patch}`;
}

const rootPkgPath = join(root, "package.json");
const current = JSON.parse(readFileSync(rootPkgPath, "utf8")).version;
const next = bumpPatch(current);

for (const rel of packagePaths) {
  const path = join(root, rel);
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = next;
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log(`Version: ${current} → ${next}`);
