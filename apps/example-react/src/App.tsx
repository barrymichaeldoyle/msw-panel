import { useState } from "react";

import { apiBaseUrl } from "./mocks/handlers";
import "./styles.css";

export function App() {
  const [userState, setUserState] = useState("Press fetch to load the mocked profile.");
  const [projectsState, setProjectsState] = useState(
    "Press fetch to load the mocked project list.",
  );

  const fetchUser = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/users/1`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        location: string;
        name: string;
        role: string;
      };

      setUserState(`${payload.name} · ${payload.role} · ${payload.location}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown failure";
      setUserState(`Request escaped MSW: ${message}`);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        projects: Array<{ id: string; name: string; status: string }>;
      };

      setProjectsState(
        payload.projects.map((project) => `${project.name} (${project.status})`).join(", "),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown failure";
      setProjectsState(`Request escaped MSW: ${message}`);
    }
  };

  return (
    <>
      <main className="app-shell">
        <section className="hero">
          <p className="eyebrow">Framework-agnostic MSW controls</p>
          <h1>Start with a runtime controller, not a framework lock-in.</h1>
          <p className="lede">
            This example mounts a React adapter on top of a framework-agnostic controller. Disable a
            handler in the panel and the next request falls through to the network.
          </p>
        </section>

        <section className="grid">
          <article className="card">
            <h2>Profile request</h2>
            <p>{userState}</p>
            <button onClick={fetchUser} type="button">
              Fetch mocked user
            </button>
          </article>

          <article className="card">
            <h2>Projects request</h2>
            <p>{projectsState}</p>
            <button onClick={fetchProjects} type="button">
              Fetch mocked projects
            </button>
          </article>
        </section>
      </main>
    </>
  );
}
