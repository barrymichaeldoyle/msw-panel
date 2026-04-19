import { http, HttpResponse } from "msw";

export const apiBaseUrl = "https://msw-panel.test";

export const handlers = [
  http.get(`${apiBaseUrl}/api/user`, () =>
    HttpResponse.json({
      location: "Cape Town",
      name: "Barry",
      role: "Maintainer",
    }),
  ),
  http.get(`${apiBaseUrl}/api/projects`, () =>
    HttpResponse.json({
      projects: [
        { id: "p1", name: "Minimal example", status: "active" },
        { id: "p2", name: "Smoke coverage", status: "ready" },
      ],
    }),
  ),
];
