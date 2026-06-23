import {
  http,
  type HttpHandler,
  type HttpResponseResolver,
  type RequestHandler,
  type WebSocketHandler,
} from "msw";

type MswAnyHandler = RequestHandler | WebSocketHandler;

/** HTTP methods accepted by `defineScenarios`. Mirrors MSW's `http` request methods. */
export type ScenarioHttpMethod =
  | "all"
  | "delete"
  | "get"
  | "head"
  | "options"
  | "patch"
  | "post"
  | "put";

/** A single named scenario as surfaced to the panel UI. */
export interface ScenarioDescriptor {
  /** Stable scenario key (the key used in the `scenarios` map). */
  id: string;
  /** Human-readable label shown in the scenario selector. Defaults to `id`. */
  label: string;
}

/**
 * Internal scenario-group state shared between the registered MSW handler (whose
 * resolver dispatches to the active scenario) and the panel controller (which reads
 * the list and flips the active scenario).
 */
export interface ScenarioGroupMeta {
  /** Display label override for the handler row. */
  name?: string;
  /** Ordered scenarios for the selector. */
  scenarios: ScenarioDescriptor[];
  /** Currently active scenario id. */
  getActive(): string;
  /** Switch the active scenario. Ignored if `id` is unknown. */
  setActive(id: string): void;
}

/** msw-panel metadata attached to an MSW handler via a non-enumerable symbol. */
export interface MswPanelHandlerMeta {
  /** Feature tags for searching, filtering, and grouping. */
  tags?: string[];
  /** Present when the handler is a scenario group created by `defineScenarios`. */
  scenario?: ScenarioGroupMeta;
}

// Symbol() (not Symbol.for) so the metadata key is private to this module and cannot
// collide with MSW internals or be serialized by accident.
const MSW_PANEL_META = Symbol("msw-panel:meta");

type WithMeta = { [MSW_PANEL_META]?: MswPanelHandlerMeta };

function attachMeta(handler: MswAnyHandler, patch: MswPanelHandlerMeta): void {
  // Check for an OWN metadata property — never an inherited one. A `withScenarios` proxy is
  // created with `Object.create(variant)`, so reading through the prototype could otherwise
  // merge into (and mutate) the underlying variant's metadata.
  const existing = Object.prototype.hasOwnProperty.call(handler, MSW_PANEL_META)
    ? (handler as WithMeta)[MSW_PANEL_META]
    : undefined;
  if (existing) {
    if (patch.tags) {
      existing.tags = mergeTags(existing.tags, patch.tags);
    }
    if (patch.scenario) {
      existing.scenario = patch.scenario;
    }
    return;
  }

  Object.defineProperty(handler, MSW_PANEL_META, {
    configurable: true,
    enumerable: false,
    value: { ...patch },
    writable: true,
  });
}

function mergeTags(current: string[] | undefined, next: string[]): string[] {
  const merged = [...(current ?? [])];
  for (const tag of next) {
    if (!merged.includes(tag)) {
      merged.push(tag);
    }
  }
  return merged;
}

/**
 * Reads msw-panel metadata (tags, scenario group) from an MSW handler.
 * Returns `undefined` when the handler carries no metadata. Works through the
 * panel's disabled-handler wrapper because the wrapper inherits via the prototype chain.
 */
export function readMswPanelMeta(handler: unknown): MswPanelHandlerMeta | undefined {
  if (!handler || typeof handler !== "object") {
    return undefined;
  }
  return (handler as WithMeta)[MSW_PANEL_META];
}

/**
 * Tags a single MSW handler with one or more feature tags. Returns the same handler so
 * it can be used inline. Tags are searchable, filterable, and groupable in the panel.
 *
 * @example
 * withTags(http.get("/api/user", resolver), ["auth", "profile"])
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/feature-tags/
 */
export function withTags<H extends MswAnyHandler>(handler: H, tags: string[]): H {
  attachMeta(handler, { tags });
  return handler;
}

/**
 * Tags every handler in a list with the same feature tags. Returns the same array so it
 * can be spread into your handler list.
 *
 * @example
 * tagged(["billing"], [http.get("/api/invoices", a), http.post("/api/pay", b)])
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/feature-tags/
 */
export function tagged<H extends MswAnyHandler>(tags: string[], handlers: H[]): H[] {
  for (const handler of handlers) {
    attachMeta(handler, { tags });
  }
  return handlers;
}

/** A type-safe reference to one scenario of a group, produced by `group.use(...)`. */
export interface ScenarioSelection {
  /** The scenario group's registered handler (matched by identity in the controller). */
  handler: MswAnyHandler;
  /** The chosen scenario id. */
  scenarioId: string;
}

/** A type-safe `use(...)` for composing presets, added to a scenario group's handler. */
export interface ScenarioGroupApi<S extends string = string> {
  /** Returns a `ScenarioSelection` for `definePreset`. `scenarioId` is type-checked. */
  use(scenarioId: S): ScenarioSelection;
}

/**
 * The value returned by `defineScenarios`: a regular MSW `HttpHandler` (register it like
 * any other handler) augmented with a type-safe `use(...)` for building presets.
 */
export type ScenarioGroup<S extends string = string> = HttpHandler & ScenarioGroupApi<S>;

/**
 * The value returned by `withScenarios`: the same kind of MSW handler you passed in
 * (HTTP or GraphQL) augmented with a type-safe `use(...)` for building presets.
 */
export type WrappedScenarioGroup<S extends string = string> = (RequestHandler | WebSocketHandler) &
  ScenarioGroupApi<S>;

/** Configuration for `defineScenarios`. */
export interface DefineScenariosConfig<S extends string> {
  /** HTTP method, e.g. `"get"`. */
  method: ScenarioHttpMethod;
  /** URL path or pattern, e.g. `"/api/user"`. */
  path: string;
  /** Display label for the handler row. Defaults to `"METHOD path"`. */
  name?: string;
  /** Feature tags applied to this handler. */
  tags?: string[];
  /** The scenario active by default. Type-checked against the `scenarios` keys. */
  default: NoInfer<S>;
  /** Named response resolvers, one per scenario. Exactly one is active at a time. */
  scenarios: Record<S, HttpResponseResolver>;
}

/**
 * Defines an endpoint with multiple named response scenarios (e.g. `success`, `empty`,
 * `error`). The panel renders a selector on this handler's row; exactly one scenario is
 * active at a time and switching it changes the live response with no page reload required.
 *
 * Returns a normal MSW `HttpHandler` (register it in your handler list) with an added
 * `use(scenarioId)` method for composing presets via `definePreset`.
 *
 * @example
 * const user = defineScenarios({
 *   method: "get",
 *   path: "/api/user",
 *   tags: ["auth"],
 *   default: "success",
 *   scenarios: {
 *     success: () => HttpResponse.json({ name: "Barry" }),
 *     empty: () => new HttpResponse(null, { status: 404 }),
 *     error: () => HttpResponse.error(),
 *   },
 * });
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/scenarios/
 */
export function defineScenarios<S extends string>(
  config: DefineScenariosConfig<S>,
): ScenarioGroup<S> {
  const ids = validateScenarioKeys("defineScenarios", config.scenarios, config.default);

  const state = createScenarioState(config.default, (id) =>
    Object.prototype.hasOwnProperty.call(config.scenarios, id),
  );

  const dispatch: HttpResponseResolver = (info) => config.scenarios[state.getActive() as S](info);
  const handler = http[config.method](config.path, dispatch);

  return finalizeScenarioGroup(handler, ids, state, config.name, config.tags) as ScenarioGroup<S>;
}

/** Configuration for `withScenarios`. */
export interface WithScenariosConfig<S extends string> {
  /** Display label for the handler row. Defaults to the default variant's derived label. */
  name?: string;
  /** Feature tags applied to this handler. */
  tags?: string[];
  /** The scenario active by default. Type-checked against the `scenarios` keys. */
  default: NoInfer<S>;
  /**
   * Named MSW handlers, one per scenario. Every variant must target the same endpoint
   * (same route, or same GraphQL operation). Exactly one is active at a time.
   */
  scenarios: Record<S, RequestHandler | WebSocketHandler>;
}

/**
 * Wraps MSW handlers you already have as named scenario variants, without restructuring
 * them into a config. Unlike `defineScenarios`, this works with **any** handler kind,
 * including GraphQL, because each scenario is a fully-formed handler.
 *
 * Returns a single handler (register it in your handler list) whose matching and response
 * delegate to the active variant. The panel renders a scenario selector on its row.
 *
 * Every variant must target the same endpoint; the row's label and grouping come from the
 * default variant.
 *
 * @example
 * const user = withScenarios({
 *   default: "Signed in",
 *   scenarios: {
 *     "Signed in": graphql.query("Me", () => HttpResponse.json({ data: { me: { name: "Barry" } } })),
 *     "Signed out": graphql.query("Me", () => HttpResponse.json({ data: { me: null } })),
 *   },
 * });
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/scenarios/
 */
export function withScenarios<S extends string>(
  config: WithScenariosConfig<S>,
): WrappedScenarioGroup<S> {
  const ids = validateScenarioKeys("withScenarios", config.scenarios, config.default);

  const state = createScenarioState(config.default, (id) =>
    Object.prototype.hasOwnProperty.call(config.scenarios, id),
  );
  const activeVariant = () => config.scenarios[state.getActive() as S];

  // A proxy over the default variant: it inherits the variant's matching info (route,
  // operation, kind) for display, but delegates `run()` to whichever variant is active.
  const proxy = Object.create(config.scenarios[config.default]) as MswAnyHandler;
  Object.defineProperty(proxy, "run", {
    configurable: true,
    value: (...args: unknown[]) =>
      (activeVariant() as unknown as { run(...a: unknown[]): unknown }).run(...args),
    writable: true,
  });
  // Usage is tracked on the active variant, not the proxy, so surface it through a getter.
  Object.defineProperty(proxy, "isUsed", {
    configurable: true,
    get: () => (activeVariant() as unknown as { isUsed?: boolean }).isUsed ?? false,
    set: () => {},
  });

  return finalizeScenarioGroup(
    proxy,
    ids,
    state,
    config.name,
    config.tags,
  ) as WrappedScenarioGroup<S>;
}

interface ScenarioState {
  getActive(): string;
  setActive(id: string): void;
}

function createScenarioState(initial: string, isKnown: (id: string) => boolean): ScenarioState {
  let active = initial;
  return {
    getActive: () => active,
    setActive: (id) => {
      if (isKnown(id)) {
        active = id;
      }
    },
  };
}

function validateScenarioKeys<S extends string>(
  fnName: string,
  scenarios: Record<S, unknown>,
  defaultId: S,
): S[] {
  const ids = Object.keys(scenarios) as S[];
  if (ids.length === 0) {
    throw new Error(`${fnName}: \`scenarios\` must declare at least one scenario.`);
  }
  if (!Object.prototype.hasOwnProperty.call(scenarios, defaultId)) {
    throw new Error(
      `${fnName}: \`default\` "${String(defaultId)}" is not one of the declared scenarios.`,
    );
  }
  return ids;
}

function finalizeScenarioGroup<S extends string>(
  handler: MswAnyHandler,
  ids: S[],
  state: ScenarioState,
  name: string | undefined,
  tags: string[] | undefined,
): MswAnyHandler & ScenarioGroupApi<S> {
  const scenarioMeta: ScenarioGroupMeta = {
    name,
    scenarios: ids.map((id) => ({ id, label: id })),
    getActive: state.getActive,
    setActive: state.setActive,
  };

  attachMeta(handler, { scenario: scenarioMeta, tags });

  Object.defineProperty(handler, "use", {
    configurable: true,
    enumerable: false,
    value: (scenarioId: S): ScenarioSelection => ({ handler, scenarioId }),
    writable: true,
  });

  return handler as MswAnyHandler & ScenarioGroupApi<S>;
}

/** A named set of scenario selections (e.g. "Logged out") applied in one click. */
export interface MswPanelPreset {
  /** Stable preset id (defaults to `label`). */
  id: string;
  /** Display label shown in the preset selector. */
  label: string;
  /** Scenario selections this preset applies. */
  selections: ScenarioSelection[];
  /**
   * When set, scopes the preset to a feature tag: the panel shows it in that feature's group
   * header (when grouped by feature) instead of the global preset selector at the top.
   */
  tag?: string;
}

/** Options for `definePreset`. */
export interface DefinePresetOptions {
  /**
   * Scope the preset to a feature tag. The panel renders it in that feature's group header
   * (when grouped by feature) rather than in the top-level global preset selector. Typically
   * the same tag the preset's handlers carry, so it sits next to them.
   */
  tag?: string;
}

/**
 * Bundles scenario selections from one or more groups into a named preset. Pass presets
 * to `createMswPanelController({ presets })`.
 *
 * Without a `tag` the preset is **global** — shown in the selector at the top of the panel.
 * With `{ tag }` it is **feature-scoped** — shown in that feature's group header so you can
 * drive a single feature into a named state independently of the rest of the app.
 *
 * @example
 * // Global preset:
 * const loggedOut = definePreset("Logged out", [user.use("error"), projects.use("empty")]);
 *
 * // Feature-scoped preset (appears in the "billing" group header):
 * const pastDue = definePreset(
 *   "Past due",
 *   [invoices.use("overdue"), subscription.use("past_due")],
 *   { tag: "billing" },
 * );
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/scenarios/
 */
export function definePreset(
  label: string,
  selections: ScenarioSelection[],
  options?: DefinePresetOptions,
): MswPanelPreset {
  return { id: label, label, selections, ...(options?.tag ? { tag: options.tag } : null) };
}
