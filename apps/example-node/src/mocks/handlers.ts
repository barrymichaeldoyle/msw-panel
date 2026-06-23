import { delay, http, HttpResponse } from "msw";
import { defineScenarios, definePreset, withTags } from "msw-panel";

export const apiBaseUrl = "https://msw-panel.test";

// The user endpoint is a scenario group: the panel (or the `scenario` CLI command) can switch
// it between a populated response, a logged-out 401, and a 500 error.
const user = defineScenarios({
  method: "get",
  path: `${apiBaseUrl}/api/user`,
  name: "GET /api/user",
  tags: ["auth", "profile"],
  default: "Signed in",
  scenarios: {
    "Signed in": async () => {
      await delay(120);
      return HttpResponse.json({
        id: "user-1",
        location: "Johannesburg",
        name: "Barry",
        role: "Maintainer",
      });
    },
    "Signed out": async () => {
      await delay(120);
      return new HttpResponse(null, { status: 401 });
    },
    Error: async () => {
      await delay(120);
      return new HttpResponse(null, { status: 500 });
    },
  },
});

const projects = withTags(
  http.get(`${apiBaseUrl}/api/projects`, async () => {
    await delay(180);
    return HttpResponse.json({
      projects: [
        { id: "project-1", name: "msw-panel", status: "Prototype" },
        { id: "project-2", name: "adapter-react", status: "Validated" },
      ],
    });
  }),
  ["projects"],
);

export const handlers = [user, projects];

export const presets = [
  definePreset("Signed in", [user.use("Signed in")]),
  definePreset("Signed out", [user.use("Signed out")]),
];
