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
    return ok({ id: "1", location: "Cape Town", name: "Barry", role: "Maintainer" });
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
        { id: "p1", name: "Docs refresh", status: "active" },
        { id: "p2", name: "Bridge QA", status: "planned" },
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
    return ok({ plan: "pro" });
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
    return ok({ items: [] });
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
