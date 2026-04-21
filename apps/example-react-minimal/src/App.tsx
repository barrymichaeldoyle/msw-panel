import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { apiBaseUrl } from "./mocks/handlers";
import "./styles.css";

type Async<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

function useFetch<T>(url: string): Async<T> {
  const [state, setState] = useState<Async<T>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((data) => {
        if (active) setState({ status: "success", data });
      })
      .catch((err) => {
        if (active)
          setState({ status: "error", message: err instanceof Error ? err.message : "Failed" });
      });
    return () => {
      active = false;
    };
  }, [url]);

  return state;
}

type User = {
  avatar: string;
  email: string;
  joinedAt: string;
  location: string;
  name: string;
  role: string;
};

type Project = {
  description: string;
  id: string;
  name: string;
  status: string;
  updatedAt: string;
};

export function App() {
  const user = useFetch<User>(`${apiBaseUrl}/api/user`);
  const projects = useFetch<{ projects: Project[] }>(`${apiBaseUrl}/api/projects`);

  return (
    <main className="app-shell">
      <nav className="cta-strip">
        <a
          className="cta-link"
          href="https://github.com/barrymichaeldoyle/msw-panel"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        <span className="cta-divider" />
        <a
          className="cta-link"
          href="https://www.npmjs.com/package/msw-panel"
          rel="noreferrer"
          target="_blank"
        >
          npm
        </a>
        <span className="cta-divider" />
        <a
          className="cta-link"
          href="https://barrymichaeldoyle.github.io/msw-panel"
          rel="noreferrer"
          target="_blank"
        >
          Docs
        </a>
      </nav>

      <header className="page-header">
        <p className="eyebrow">MSW Panel · Minimal</p>
        <h1>Mock. Toggle. Refresh.</h1>
        <p className="lede">
          Disable a handler in the panel, refresh the page, and watch that section break.
          <br />
          Re-enable it to bring it back.
        </p>
      </header>

      <div className="dashboard">
        <section className="card">
          <h2 className="card-title">Profile</h2>
          <DataSection state={user} hint="GET /api/user">
            {(data) => (
              <div className="profile">
                <div className="avatar">{data.avatar}</div>
                <div className="profile-body">
                  <div className="profile-top">
                    <strong className="profile-name">{data.name}</strong>
                    <span className="role-badge">{data.role}</span>
                  </div>
                  <dl className="profile-meta">
                    <div>
                      <dt>Location</dt>
                      <dd>{data.location}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{data.email}</dd>
                    </div>
                    <div>
                      <dt>Joined</dt>
                      <dd>{fmtDate(data.joinedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </DataSection>
        </section>

        <section className="card">
          <h2 className="card-title">Projects</h2>
          <DataSection state={projects} hint="GET /api/projects">
            {({ projects: list }) => (
              <ul className="project-list">
                {list.map((p) => (
                  <li key={p.id} className="project-row">
                    <div className="project-info">
                      <span className="project-name">{p.name}</span>
                      <span className="project-desc">{p.description}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </DataSection>
        </section>
      </div>
    </main>
  );
}

function DataSection<T>({
  children,
  hint,
  state,
}: {
  children: (data: T) => ReactNode;
  hint: string;
  state: Async<T>;
}) {
  if (state.status === "loading") return <Skeleton />;
  if (state.status === "error") return <ErrorBlock hint={hint} message={state.message} />;
  return <>{children(state.data)}</>;
}

function Skeleton() {
  return (
    <div className="skeleton">
      {[72, 48, 84, 56].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function ErrorBlock({ hint, message }: { hint: string; message: string }) {
  return (
    <div className="error-block">
      <p className="error-title">Request failed · {message}</p>
      <p className="error-hint">
        Toggle <code>{hint}</code> in the panel and refresh to restore this section.
      </p>
    </div>
  );
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  active: { background: "rgba(22, 163, 74, 0.18)", color: "#4ade80" },
  planned: { background: "rgba(100, 116, 139, 0.18)", color: "#94a3b8" },
  ready: { background: "rgba(59, 130, 246, 0.18)", color: "#60a5fa" },
  review: { background: "rgba(251, 146, 60, 0.18)", color: "#fb923c" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { background: "#f1f5f9", color: "#475569" };
  return (
    <span className="status-badge" style={style}>
      {status}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}
