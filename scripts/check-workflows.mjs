import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Guards against CI tooling drifting from the repo's source of truth.
//
// The pnpm version is owned by the `packageManager` field in package.json.
// When `pnpm/action-setup` ALSO pins a `version:`, the action fails with
// ERR_PNPM_BAD_PM_VERSION ("Multiple versions of pnpm specified"). That only
// surfaces on GitHub, never in a local `pnpm run ci:check`, so we assert it here.

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const workflowsDir = path.join(repoRoot, ".github", "workflows");

const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageManager = pkg.packageManager;

const errors = [];

if (!packageManager) {
  errors.push(
    'package.json is missing a "packageManager" field; it is the single source of truth for the pnpm version.',
  );
}

let workflowFiles = [];
try {
  workflowFiles = readdirSync(workflowsDir).filter((file) => /\.ya?ml$/.test(file));
} catch {
  // No workflows directory — nothing to validate.
}

for (const file of workflowFiles) {
  const filePath = path.join(workflowsDir, file);
  const lines = readFileSync(filePath, "utf8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (!/uses:\s*pnpm\/action-setup(@|\s|$)/.test(lines[i])) {
      continue;
    }

    // Scan the rest of this step (until the next list item at the same or
    // shallower indentation) for a pinned `version:` input.
    const stepIndent = lines[i].search(/\S/);
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      const indent = line.search(/\S/);
      const isNewListItem = /^\s*-\s/.test(line);
      if (indent !== -1 && indent <= stepIndent && isNewListItem) {
        break; // start of the next step
      }

      const match = line.match(/^\s*version:\s*(.+?)\s*$/);
      if (match) {
        errors.push(
          `${path.relative(repoRoot, filePath)}: pnpm/action-setup pins version "${match[1]}" ` +
            `while package.json packageManager is "${packageManager}". ` +
            `Remove the version input so packageManager is the only source of truth.`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Workflow validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Workflows OK: pnpm version is governed solely by packageManager (${packageManager}).`);
