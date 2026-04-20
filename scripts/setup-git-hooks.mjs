import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const hooksPath = ".githooks";
const hooksDir = path.join(repoRoot, hooksPath);

if (!existsSync(hooksDir)) {
  process.exit(0);
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure && error.status === 1) {
      return "";
    }

    throw error;
  }
}

try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  process.exit(0);
}

const currentHooksPath = git(["config", "--local", "--get", "core.hooksPath"], {
  allowFailure: true,
});

if (currentHooksPath && currentHooksPath !== hooksPath) {
  console.warn(
    `Skipping git hook setup because core.hooksPath is already set to "${currentHooksPath}".`,
  );
  process.exit(0);
}

git(["config", "--local", "core.hooksPath", hooksPath]);
console.log(`Configured git hooks path: ${hooksPath}`);
