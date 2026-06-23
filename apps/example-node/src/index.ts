import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createMswPanelController } from "msw-panel";

import { apiBaseUrl, presets } from "./mocks/handlers";
import { handlers, server } from "./mocks/server";
import { createFileStorage } from "./storage";

const controller = createMswPanelController({
  handlers,
  presets,
  runtime: server,
  storage: createFileStorage(),
  storageKey: "msw-panel:example-node",
});

server.listen({
  onUnhandledRequest: "bypass",
});

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

void main();

async function main(): Promise<void> {
  try {
    await runCli();
  } catch (error) {
    if (error instanceof Error && error.message === "readline was closed") {
      await shutdown();
      return;
    }

    console.error(`Fatal error: ${getErrorMessage(error)}`);
    process.exitCode = 1;
    await shutdown();
  }
}

async function runCli(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  printWelcome();
  printSnapshot();

  while (true) {
    const line = (await rl.question("\nmsw-panel-node> ")).trim();

    if (!line) {
      continue;
    }

    const shouldExit = await handleCommand(line);

    if (shouldExit) {
      rl.close();
      await shutdown();
      return;
    }
  }
}

async function handleCommand(line: string): Promise<boolean> {
  const [command, ...rest] = line.split(/\s+/);
  const args = rest.join(" ");

  switch (command) {
    case "help":
      printHelp();
      return false;
    case "list":
      printSnapshot();
      return false;
    case "user":
      await fetchUser();
      return false;
    case "projects":
      await fetchProjects();
      return false;
    case "toggle":
      updateHandler(args, "toggle");
      return false;
    case "on":
      updateHandler(args, "on");
      return false;
    case "off":
      updateHandler(args, "off");
      return false;
    case "all":
      if (args === "on") {
        controller.setAllEnabled(true);
        printSnapshot();
        return false;
      }

      if (args === "off") {
        controller.setAllEnabled(false);
        printSnapshot();
        return false;
      }

      console.log('Use "all on" or "all off".');
      return false;
    case "scenario": {
      const [target, ...scenarioParts] = rest;
      setScenario(target ?? "", scenarioParts.join(" "));
      return false;
    }
    case "preset":
      applyPreset(args);
      return false;
    case "sync":
      controller.sync();
      printSnapshot();
      return false;
    case "quit":
    case "exit":
      return true;
    default:
      console.log(`Unknown command: ${command}`);
      printHelp();
      return false;
  }
}

function updateHandler(rawTarget: string, mode: "toggle" | "on" | "off"): void {
  const snapshot = controller.getSnapshot();
  const handler = resolveHandler(snapshot.handlers, rawTarget);

  if (!handler) {
    console.log(`Unknown handler target: ${rawTarget || "(empty)"}`);
    printSnapshot();
    return;
  }

  if (mode === "toggle") {
    controller.toggle(handler.id);
  } else {
    controller.setEnabled(handler.id, mode === "on");
  }

  printSnapshot();
}

function setScenario(rawTarget: string, scenarioId: string): void {
  const snapshot = controller.getSnapshot();
  const handler = resolveHandler(snapshot.handlers, rawTarget);

  if (!handler) {
    console.log(`Unknown handler target: ${rawTarget || "(empty)"}`);
    printSnapshot();
    return;
  }

  const scenarios = handler.scenarios ?? [];
  if (scenarios.length === 0) {
    console.log(`Handler "${handler.label}" has no scenarios.`);
    return;
  }

  if (!scenarioId || !scenarios.some((scenario) => scenario.id === scenarioId)) {
    console.log(
      `Pick a scenario for "${handler.label}": ${scenarios.map((scenario) => scenario.id).join(", ")}`,
    );
    return;
  }

  controller.setScenario(handler.id, scenarioId);
  printSnapshot();
}

function applyPreset(label: string): void {
  const available = controller.getSnapshot().presets ?? [];

  if (!label || !available.some((preset) => preset.id === label)) {
    console.log(
      `Available presets: ${available.map((preset) => preset.label).join(", ") || "none"}`,
    );
    return;
  }

  controller.applyPreset(label);
  printSnapshot();
}

function resolveHandler(
  handlersSnapshot: ReturnType<typeof controller.getSnapshot>["handlers"],
  rawTarget: string,
) {
  const normalizedTarget = rawTarget.trim();

  if (!normalizedTarget) {
    return null;
  }

  const byIndex = Number(normalizedTarget);

  if (Number.isInteger(byIndex) && byIndex >= 1) {
    return handlersSnapshot[byIndex - 1] ?? null;
  }

  return (
    handlersSnapshot.find((handler) => handler.id === normalizedTarget) ??
    handlersSnapshot.find((handler) => handler.path === normalizedTarget) ??
    null
  );
}

async function fetchUser(): Promise<void> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/user`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      location: string;
      name: string;
      role: string;
    };

    console.log(`user -> ${payload.name} · ${payload.role} · ${payload.location}`);
  } catch (error) {
    console.log(`user -> request escaped MSW: ${getErrorMessage(error)}`);
  }
}

async function fetchProjects(): Promise<void> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      projects: Array<{ id: string; name: string; status: string }>;
    };

    console.log(
      `projects -> ${payload.projects
        .map((project) => `${project.name} (${project.status})`)
        .join(", ")}`,
    );
  } catch (error) {
    console.log(`projects -> request escaped MSW: ${getErrorMessage(error)}`);
  }
}

function printWelcome(): void {
  console.log("Node example for msw-panel");
  console.log("This runs MSW with setupServer and controls handlers via @msw-panel/core.");
  printHelp();
}

function printHelp(): void {
  console.log("\nCommands:");
  console.log("  list           Show handlers");
  console.log("  user           Fetch the mocked user endpoint");
  console.log("  projects       Fetch the mocked projects endpoint");
  console.log("  toggle <id|n>  Toggle a handler by id or 1-based index");
  console.log("  on <id|n>      Enable a handler");
  console.log("  off <id|n>     Disable a handler");
  console.log("  all on         Enable all handlers");
  console.log("  all off        Disable all handlers");
  console.log("  scenario <id|n> <name>  Switch a handler's active scenario");
  console.log("  preset <name>  Apply a global scenario preset");
  console.log("  sync           Re-read handlers from setupServer");
  console.log("  exit           Quit");
}

function printSnapshot(): void {
  const snapshot = controller.getSnapshot();

  console.log(
    `\nHandlers: ${snapshot.activeHandlers} enabled, ${snapshot.disabledHandlers} disabled`,
  );
  if (snapshot.activePreset) {
    console.log(`Active preset: ${snapshot.activePreset}`);
  }

  snapshot.handlers.forEach((handler, index) => {
    const state = handler.enabled ? "on " : "off";
    const target = handler.path ?? handler.label;

    console.log(`${index + 1}. [${state}] ${handler.label} -> ${target}`);
    console.log(`   id: ${handler.id}`);
    if (handler.tags && handler.tags.length > 0) {
      console.log(`   tags: ${handler.tags.join(", ")}`);
    }
    if (handler.scenarios && handler.scenarios.length > 0) {
      console.log(
        `   scenario: ${handler.activeScenario} (of ${handler.scenarios
          .map((scenario) => scenario.id)
          .join(", ")})`,
      );
    }
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown failure";
}

async function shutdown(): Promise<void> {
  server.close();
}
