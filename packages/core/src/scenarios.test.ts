import { graphql, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import {
  defineScenarios,
  definePreset,
  readMswPanelMeta,
  tagged,
  withScenarios,
  withTags,
} from "./scenarios.js";

describe("withTags", () => {
  it("attaches tags to a handler and returns the same handler", () => {
    const handler = http.get("/api/user", () => HttpResponse.json({}));
    const result = withTags(handler, ["auth", "profile"]);

    expect(result).toBe(handler);
    expect(readMswPanelMeta(handler)?.tags).toEqual(["auth", "profile"]);
  });

  it("merges and de-duplicates tags across calls", () => {
    const handler = http.get("/api/user", () => HttpResponse.json({}));
    withTags(handler, ["auth"]);
    withTags(handler, ["auth", "profile"]);

    expect(readMswPanelMeta(handler)?.tags).toEqual(["auth", "profile"]);
  });
});

describe("tagged", () => {
  it("tags every handler in the list", () => {
    const handlers = [
      http.get("/api/invoices", () => HttpResponse.json({})),
      http.post("/api/pay", () => HttpResponse.json({})),
    ];
    const result = tagged(["billing"], handlers);

    expect(result).toBe(handlers);
    for (const handler of handlers) {
      expect(readMswPanelMeta(handler)?.tags).toEqual(["billing"]);
    }
  });
});

describe("defineScenarios", () => {
  function makeGroup() {
    return defineScenarios({
      method: "get",
      path: "/api/user",
      tags: ["auth"],
      default: "success",
      scenarios: {
        success: () => HttpResponse.json({ name: "Barry" }),
        empty: () => new HttpResponse(null, { status: 404 }),
        error: () => HttpResponse.error(),
      },
    });
  }

  it("exposes the scenario list, default active scenario, and tags via metadata", () => {
    const group = makeGroup();
    const meta = readMswPanelMeta(group);

    expect(meta?.tags).toEqual(["auth"]);
    expect(meta?.scenario?.getActive()).toBe("success");
    expect(meta?.scenario?.scenarios.map((scenario) => scenario.id)).toEqual([
      "success",
      "empty",
      "error",
    ]);
  });

  it("switches the active scenario via setActive and ignores unknown ids", () => {
    const group = makeGroup();
    const scenario = readMswPanelMeta(group)?.scenario;

    scenario?.setActive("error");
    expect(scenario?.getActive()).toBe("error");

    scenario?.setActive("nope");
    expect(scenario?.getActive()).toBe("error");
  });

  it("produces a type-safe selection via use()", () => {
    const group = makeGroup();
    const selection = group.use("empty");

    expect(selection.handler).toBe(group);
    expect(selection.scenarioId).toBe("empty");
  });

  it("throws when default is not a declared scenario", () => {
    expect(() =>
      defineScenarios({
        method: "get",
        path: "/x",
        // @ts-expect-error default must be a declared scenario key
        default: "missing",
        scenarios: { only: () => HttpResponse.json({}) },
      }),
    ).toThrow(/default/);
  });
});

describe("withScenarios", () => {
  it("exposes scenarios, tags, default active, and a type-safe use()", () => {
    const group = withScenarios({
      name: "User query",
      tags: ["auth"],
      default: "Signed in",
      scenarios: {
        "Signed in": graphql.query("Me", () => HttpResponse.json({ data: { me: { id: 1 } } })),
        "Signed out": graphql.query("Me", () => HttpResponse.json({ data: { me: null } })),
      },
    });
    const meta = readMswPanelMeta(group);

    expect(meta?.tags).toEqual(["auth"]);
    expect(meta?.scenario?.name).toBe("User query");
    expect(meta?.scenario?.getActive()).toBe("Signed in");
    expect(meta?.scenario?.scenarios.map((scenario) => scenario.id)).toEqual([
      "Signed in",
      "Signed out",
    ]);
    expect(group.use("Signed out")).toEqual({ handler: group, scenarioId: "Signed out" });
  });

  it("does not mutate a variant's own metadata when building the proxy", () => {
    const tagged = withTags(
      http.get("/api/user", () => HttpResponse.json({})),
      ["original"],
    );
    const group = withScenarios({
      tags: ["wrapper"],
      default: "a",
      scenarios: { a: tagged, b: http.get("/api/user", () => HttpResponse.json({})) },
    });

    expect(readMswPanelMeta(group)?.tags).toEqual(["wrapper"]);
    // The wrapped variant keeps its own metadata untouched.
    expect(readMswPanelMeta(tagged)?.tags).toEqual(["original"]);
    expect(readMswPanelMeta(tagged)?.scenario).toBeUndefined();
  });

  it("throws when default is not a declared scenario", () => {
    expect(() =>
      withScenarios({
        // @ts-expect-error default must be a declared scenario key
        default: "missing",
        scenarios: { only: http.get("/x", () => HttpResponse.json({})) },
      }),
    ).toThrow(/default/);
  });
});

describe("definePreset", () => {
  it("bundles selections under a label", () => {
    const user = defineScenarios({
      method: "get",
      path: "/api/user",
      default: "ok",
      scenarios: { ok: () => HttpResponse.json({}), bad: () => HttpResponse.error() },
    });
    const preset = definePreset("Logged out", [user.use("bad")]);

    expect(preset.id).toBe("Logged out");
    expect(preset.label).toBe("Logged out");
    expect(preset.selections).toEqual([{ handler: user, scenarioId: "bad" }]);
    expect(preset.tag).toBeUndefined();
  });

  it("scopes a preset to a feature tag", () => {
    const invoices = defineScenarios({
      method: "get",
      path: "/api/invoices",
      tags: ["billing"],
      default: "paid",
      scenarios: { paid: () => HttpResponse.json([]), overdue: () => HttpResponse.json([]) },
    });
    const preset = definePreset("Past due", [invoices.use("overdue")], { tag: "billing" });

    expect(preset.tag).toBe("billing");
  });
});
