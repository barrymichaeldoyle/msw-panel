import { delay, http, HttpResponse } from "msw";

export const apiBaseUrl = "https://msw-panel.test";

export const handlers = [
  http.get(`${apiBaseUrl}/api/user`, async () => {
    await delay(350);
    return HttpResponse.json({
      avatar: "BD",
      email: "barry@example.dev",
      joinedAt: "2022-03-14",
      location: "Cape Town, ZA",
      name: "Barry Michael Doyle",
      role: "Maintainer",
    });
  }),
  http.get(`${apiBaseUrl}/api/projects`, async () => {
    await delay(500);
    return HttpResponse.json({
      projects: [
        {
          description: "Devtools panel for Mock Service Worker.",
          id: "p1",
          name: "msw-panel",
          status: "active",
          updatedAt: "2025-04-18",
        },
        {
          description: "Automated smoke test suite across all endpoints.",
          id: "p2",
          name: "smoke-coverage",
          status: "review",
          updatedAt: "2025-04-12",
        },
        {
          description: "Cross-frame MSW bridge for iframe and WebSocket setups.",
          id: "p3",
          name: "bridge-adapter",
          status: "planned",
          updatedAt: "2025-04-05",
        },
      ],
    });
  }),
];
