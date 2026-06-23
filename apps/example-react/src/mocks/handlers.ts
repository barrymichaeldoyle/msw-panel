import { delay, graphql, http, HttpResponse } from "msw";
import { defineScenarios, definePreset, tagged, withScenarios } from "msw-panel";

export const apiBaseUrl = "https://msw-panel.test";

const ok = (body: Record<string, unknown> | unknown[]) => HttpResponse.json(body);
const d = () => delay(200);

// Endpoints the dashboard actually renders are declared as scenario groups, so the panel can
// switch each one between a populated "Default" response, an "Empty" state, and a 500 "Error".

const user = defineScenarios({
  method: "get",
  path: `${apiBaseUrl}/api/users/:id`,
  name: "GET /api/users/:id",
  tags: ["users", "profile"],
  default: "Default",
  scenarios: {
    Default: async () => {
      await d();
      return ok({
        avatar: "BD",
        email: "barry@example.dev",
        id: "1",
        joinedAt: "2022-03-14",
        location: "Cape Town, ZA",
        name: "Barry Michael Doyle",
        role: "Maintainer",
      });
    },
    "New user": async () => {
      await d();
      return ok({
        avatar: "NU",
        email: "new@example.dev",
        id: "1",
        joinedAt: new Date().toISOString(),
        location: "—",
        name: "New User",
        role: "Member",
      });
    },
    "Not found": async () => {
      await d();
      return new HttpResponse(null, { status: 404 });
    },
    Error: async () => {
      await d();
      return new HttpResponse(null, { status: 500 });
    },
  },
});

const projects = defineScenarios({
  method: "get",
  path: `${apiBaseUrl}/api/projects`,
  name: "GET /api/projects",
  tags: ["projects"],
  default: "Default",
  scenarios: {
    Default: async () => {
      await d();
      return ok({
        projects: [
          {
            description: "Migrate the docs site to Astro, improve API reference coverage.",
            id: "p1",
            members: 2,
            name: "Docs refresh",
            status: "active",
            updatedAt: "2025-04-18",
          },
          {
            description: "End-to-end tests for the WebSocket relay transport.",
            id: "p2",
            members: 1,
            name: "Bridge QA",
            status: "planned",
            updatedAt: "2025-04-12",
          },
          {
            description: "Official React hook adapter: useController, useSyncHandlers.",
            id: "p3",
            members: 3,
            name: "React adapter",
            status: "active",
            updatedAt: "2025-04-20",
          },
          {
            description: "Community-requested Vue 3 composables for the controller.",
            id: "p4",
            members: 2,
            name: "Vue adapter",
            status: "review",
            updatedAt: "2025-04-15",
          },
        ],
      });
    },
    Empty: async () => {
      await d();
      return ok({ projects: [] });
    },
    Error: async () => {
      await d();
      return new HttpResponse(null, { status: 500 });
    },
  },
});

const notifications = defineScenarios({
  method: "get",
  path: `${apiBaseUrl}/api/notifications`,
  name: "GET /api/notifications",
  tags: ["notifications"],
  default: "Default",
  scenarios: {
    Default: async () => {
      await d();
      return ok({
        items: [
          {
            body: "msw-panel@0.1.5 · all checks green",
            createdAt: "2025-04-21T08:12:00Z",
            id: "n1",
            read: false,
            title: "CI passed",
          },
          {
            body: "Review bridge transport refactor before Friday",
            createdAt: "2025-04-20T16:45:00Z",
            id: "n2",
            read: false,
            title: "PR review requested",
          },
          {
            body: "msw-panel@0.1.4 published to npm registry",
            createdAt: "2025-04-19T11:30:00Z",
            id: "n3",
            read: true,
            title: "Package published",
          },
          {
            body: "#42 Embedded panel overflow on narrow viewports",
            createdAt: "2025-04-18T09:00:00Z",
            id: "n4",
            read: true,
            title: "Issue closed",
          },
        ],
      });
    },
    Empty: async () => {
      await d();
      return ok({ items: [] });
    },
    Error: async () => {
      await d();
      return new HttpResponse(null, { status: 500 });
    },
  },
});

const billing = defineScenarios({
  method: "get",
  path: `${apiBaseUrl}/api/billing/subscription`,
  name: "GET /api/billing/subscription",
  tags: ["billing"],
  default: "Active",
  scenarios: {
    Active: async () => {
      await d();
      return ok({
        mrr: 49,
        plan: "Pro",
        renewsAt: "2025-05-21",
        seats: 5,
        status: "active",
        usedSeats: 3,
      });
    },
    "Past due": async () => {
      await d();
      return ok({
        mrr: 49,
        plan: "Pro",
        renewsAt: "2025-05-21",
        seats: 5,
        status: "past_due",
        usedSeats: 3,
      });
    },
    Error: async () => {
      await d();
      return new HttpResponse(null, { status: 500 });
    },
  },
});

// A second `billing`-tagged scenario group. Because it shares its scenario keys with `billing`,
// the panel's billing group header offers a "Set all to →" control that switches both at once.
const billingInvoices = defineScenarios({
  method: "get",
  path: `${apiBaseUrl}/api/billing/invoices`,
  name: "GET /api/billing/invoices",
  tags: ["billing"],
  default: "Active",
  scenarios: {
    Active: async () => {
      await d();
      return ok({ invoices: [{ amount: 49, id: "in_1", status: "paid" }] });
    },
    "Past due": async () => {
      await d();
      return ok({ invoices: [{ amount: 49, id: "in_1", status: "overdue" }] });
    },
    Error: async () => {
      await d();
      return new HttpResponse(null, { status: 500 });
    },
  },
});

// A GraphQL scenario group, authored with `withScenarios` (each variant is a full handler).
const getUser = withScenarios({
  name: "GetUser",
  tags: ["graphql", "auth"],
  default: "Signed in",
  scenarios: {
    "Signed in": graphql.query("GetUser", async () => {
      await d();
      return HttpResponse.json({ data: { user: { name: "Barry" } } });
    }),
    "Signed out": graphql.query("GetUser", async () => {
      await d();
      return HttpResponse.json({ data: { user: null } });
    }),
  },
});

export const handlers = [
  user,
  projects,
  notifications,
  billing,
  billingInvoices,
  getUser,

  // Auth
  ...tagged(
    ["auth"],
    [
      http.post(`${apiBaseUrl}/api/auth/login`, async () => {
        await d();
        return ok({ token: "abc123" });
      }),
      http.post(`${apiBaseUrl}/api/auth/logout`, async () => {
        await d();
        return ok({ ok: true });
      }),
      http.post(`${apiBaseUrl}/api/auth/refresh`, async () => {
        await d();
        return ok({ token: "refreshed" });
      }),
    ],
  ),

  // Users (write endpoints)
  ...tagged(
    ["users"],
    [
      http.get(`${apiBaseUrl}/api/users`, async () => {
        await d();
        return ok({ users: [] });
      }),
      http.post(`${apiBaseUrl}/api/users`, async () => {
        await d();
        return ok({ id: "new" });
      }),
      http.put(`${apiBaseUrl}/api/users/:id`, async () => {
        await d();
        return ok({ updated: true });
      }),
      http.patch(`${apiBaseUrl}/api/users/:id`, async () => {
        await d();
        return ok({ patched: true });
      }),
      http.delete(`${apiBaseUrl}/api/users/:id`, async () => {
        await d();
        return ok({ deleted: true });
      }),
    ],
  ),

  // Projects (write endpoints)
  ...tagged(
    ["projects"],
    [
      http.get(`${apiBaseUrl}/api/projects/:id`, async () => {
        await d();
        return ok({ id: "1" });
      }),
      http.post(`${apiBaseUrl}/api/projects`, async () => {
        await d();
        return ok({ id: "new" });
      }),
      http.put(`${apiBaseUrl}/api/projects/:id`, async () => {
        await d();
        return ok({ updated: true });
      }),
      http.delete(`${apiBaseUrl}/api/projects/:id`, async () => {
        await d();
        return ok({ deleted: true });
      }),
    ],
  ),

  // Teams
  ...tagged(
    ["teams"],
    [
      http.get(`${apiBaseUrl}/api/teams`, async () => {
        await d();
        return ok({ teams: [] });
      }),
      http.get(`${apiBaseUrl}/api/teams/:id`, async () => {
        await d();
        return ok({ id: "1" });
      }),
      http.post(`${apiBaseUrl}/api/teams`, async () => {
        await d();
        return ok({ id: "new" });
      }),
      http.post(`${apiBaseUrl}/api/teams/:id/members`, async () => {
        await d();
        return ok({ added: true });
      }),
      http.delete(`${apiBaseUrl}/api/teams/:id/members/:userId`, async () => {
        await d();
        return ok({ removed: true });
      }),
    ],
  ),

  // Billing (write endpoints)
  ...tagged(
    ["billing"],
    [
      http.post(`${apiBaseUrl}/api/billing/subscribe`, async () => {
        await d();
        return ok({ ok: true });
      }),
      http.post(`${apiBaseUrl}/api/billing/cancel`, async () => {
        await d();
        return ok({ cancelled: true });
      }),
    ],
  ),

  // Notifications (write endpoints)
  ...tagged(
    ["notifications"],
    [
      http.post(`${apiBaseUrl}/api/notifications/read-all`, async () => {
        await d();
        return ok({ ok: true });
      }),
      http.delete(`${apiBaseUrl}/api/notifications/:id`, async () => {
        await d();
        return ok({ deleted: true });
      }),
    ],
  ),

  // GraphQL
  ...tagged(
    ["graphql"],
    [
      graphql.query("ListProjects", async () => {
        await d();
        return HttpResponse.json({ data: { projects: [] } });
      }),
      graphql.mutation("CreateProject", async () => {
        await d();
        return HttpResponse.json({ data: { project: null } });
      }),
      graphql.mutation("DeleteProject", async () => {
        await d();
        return HttpResponse.json({ data: { ok: true } });
      }),
    ],
  ),
];

// Global presets flip several endpoints at once from the panel's top preset selector.
// Feature-scoped presets (with `{ tag }`) instead appear in their feature's group header,
// so you can drive a single feature into a named state without touching the rest of the app.
export const presets = [
  definePreset("Healthy", [
    user.use("Default"),
    projects.use("Default"),
    notifications.use("Default"),
    billing.use("Active"),
    billingInvoices.use("Active"),
  ]),
  definePreset("Empty account", [
    projects.use("Empty"),
    notifications.use("Empty"),
    user.use("New user"),
  ]),
  definePreset("Everything failing", [
    user.use("Error"),
    projects.use("Error"),
    notifications.use("Error"),
    billing.use("Error"),
    billingInvoices.use("Error"),
  ]),

  // Feature-scoped: shown in the "billing" group header.
  definePreset("Past due", [billing.use("Past due"), billingInvoices.use("Past due")], {
    tag: "billing",
  }),
];
