import { delay, http, HttpResponse } from "msw";

export const apiBaseUrl = "https://msw-panel.test";

export const handlers = [
  http.get(`${apiBaseUrl}/api/user`, async () => {
    await delay(120);

    return HttpResponse.json({
      id: "user-1",
      location: "Johannesburg",
      name: "Barry",
      role: "Maintainer",
    });
  }),
  http.get(`${apiBaseUrl}/api/projects`, async () => {
    await delay(180);

    return HttpResponse.json({
      projects: [
        {
          id: "project-1",
          name: "msw-panel",
          status: "Prototype",
        },
        {
          id: "project-2",
          name: "adapter-react",
          status: "Validated",
        },
      ],
    });
  }),
];
