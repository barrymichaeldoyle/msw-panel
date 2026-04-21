import { delay, graphql, http, HttpResponse } from "msw";

export const apiBaseUrl = "https://msw-panel.test";

const ok = (body: Record<string, unknown> | unknown[]) => HttpResponse.json(body);
const d = () => delay(200);

export const handlers = [
  // Auth
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

  // Users
  http.get(`${apiBaseUrl}/api/users`, async () => {
    await d();
    return ok({ users: [] });
  }),
  http.get(`${apiBaseUrl}/api/users/:id`, async () => {
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

  // Projects
  http.get(`${apiBaseUrl}/api/projects`, async () => {
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
          description: "Official React hook adapter — useController, useSyncHandlers.",
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
  }),
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

  // Teams
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

  // Billing
  http.get(`${apiBaseUrl}/api/billing/subscription`, async () => {
    await d();
    return ok({
      mrr: 49,
      plan: "Pro",
      renewsAt: "2025-05-21",
      seats: 5,
      status: "active",
      usedSeats: 3,
    });
  }),
  http.post(`${apiBaseUrl}/api/billing/subscribe`, async () => {
    await d();
    return ok({ ok: true });
  }),
  http.post(`${apiBaseUrl}/api/billing/cancel`, async () => {
    await d();
    return ok({ cancelled: true });
  }),
  http.get(`${apiBaseUrl}/api/billing/invoices`, async () => {
    await d();
    return ok({ invoices: [] });
  }),

  // Notifications
  http.get(`${apiBaseUrl}/api/notifications`, async () => {
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
  }),
  http.post(`${apiBaseUrl}/api/notifications/read-all`, async () => {
    await d();
    return ok({ ok: true });
  }),
  http.delete(`${apiBaseUrl}/api/notifications/:id`, async () => {
    await d();
    return ok({ deleted: true });
  }),

  // GraphQL
  graphql.query("GetUser", async () => {
    await d();
    return HttpResponse.json({ data: { user: null } });
  }),
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
];
