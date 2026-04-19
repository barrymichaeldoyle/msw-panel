import { useState } from "react";

import { apiBaseUrl } from "./mocks/handlers";
import "./styles.css";

export function App() {
  const [userState, setUserState] = useState("Fetch the mocked user.");
  const [projectsState, setProjectsState] = useState("Fetch the mocked projects.");

  const fetchUser = async () => {
    const response = await fetch(`${apiBaseUrl}/api/user`);
    const payload = (await response.json()) as {
      location: string;
      name: string;
      role: string;
    };

    setUserState(`${payload.name} · ${payload.role} · ${payload.location}`);
  };

  const fetchProjects = async () => {
    const response = await fetch(`${apiBaseUrl}/api/projects`);
    const payload = (await response.json()) as {
      projects: Array<{ id: string; name: string; status: string }>;
    };

    setProjectsState(
      payload.projects.map((project) => `${project.name} (${project.status})`).join(", "),
    );
  };

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Minimal React integration</p>
        <h1>Defaults only.</h1>
        <p className="lede">
          This example mounts <code>createMswPanelController</code> with just the MSW runtime and
          renders <code>{`<MswPanel controller={controller} />`}</code>.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>User request</h2>
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
  );
}
