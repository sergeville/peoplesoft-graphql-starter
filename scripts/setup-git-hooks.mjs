#!/usr/bin/env node
/** Point this repo at .githooks/ so pre-commit runs locally after npm install. */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("git rev-parse --git-dir", { cwd: root, stdio: "ignore" });
  execSync("git config core.hooksPath .githooks", { cwd: root });
  console.log("Git hooks: .githooks (patch version bumps on each commit)");
} catch {
  // Not a git checkout or git unavailable — skip silently.
}
