import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { MswPanelStorage } from "msw-panel";

const exampleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storageFile = path.join(exampleRoot, ".msw-panel-state.json");

export function createFileStorage(): MswPanelStorage {
  return {
    getItem(key) {
      const state = readState();

      return state[key] ?? null;
    },
    setItem(key, value) {
      const state = readState();

      state[key] = value;
      writeFileSync(storageFile, JSON.stringify(state, null, 2), "utf8");
    },
  };
}

function readState(): Record<string, string> {
  if (!existsSync(storageFile)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(storageFile, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}
