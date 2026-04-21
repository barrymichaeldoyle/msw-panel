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
  members: number;
  name: string;
  status: string;
  updatedAt: string;
};

type Notification = {
  body: string;
  createdAt: string;
  id: string;
  read: boolean;
  title: string;
};

type Subscription = {
  mrr: number;
  plan: string;
  renewsAt: string;
  seats: number;
  status: string;
  usedSeats: number;
};

export function App() {
  const user = useFetch<User>(`${apiBaseUrl}/api/users/1`);
  const projects = useFetch<{ projects: Project[] }>(`${apiBaseUrl}/api/projects`);
  const notifications = useFetch<{ items: Notification[] }>(`${apiBaseUrl}/api/notifications`);
  const billing = useFetch<Subscription>(`${apiBaseUrl}/api/billing/subscription`);

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
        <p className="eyebrow">MSW Panel · Full example</p>
        <h1>
          Every request.
          <br />
          Under your control.
        </h1>
        <p className="lede">
          Disable any handler in the panel, refresh, and watch that section of the page react.
          <br />
          Re-enable it to restore the data.
        </p>
      </header>

      <div className="dashboard">
        <section className="card area-profile">
          <h2 className="card-title">Profile</h2>
          <DataSection state={user} hint="GET /api/users/:id">
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

        <section className="card area-projects">
          <h2 className="card-title">Projects</h2>
          <DataSection state={projects} hint="GET /api/projects">
            {({ projects: list }) => (
              <div className="projects-grid">
                {list.map((p) => (
                  <article key={p.id} className="project-card">
                    <div className="project-card-top">
                      <span className="project-name">{p.name}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="project-desc">{p.description}</p>
                    <div className="project-footer">
                      <span>
                        {p.members} member{p.members !== 1 ? "s" : ""}
                      </span>
                      <span>Updated {fmtDate(p.updatedAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </DataSection>
        </section>

        <section className="card area-notifications">
          <h2 className="card-title">Notifications</h2>
          <DataSection state={notifications} hint="GET /api/notifications">
            {({ items }) =>
              items.length === 0 ? (
                <p className="empty-state">All caught up.</p>
              ) : (
                <ul className="notification-list">
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={`notification-item${n.read ? "" : " notification-unread"}`}
                    >
                      {!n.read && <span className="unread-dot" aria-hidden="true" />}
                      <div className="notification-body">
                        <span className="notification-title">{n.title}</span>
                        <span className="notification-text">{n.body}</span>
                      </div>
                      <span className="notification-time">{relativeTime(n.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )
            }
          </DataSection>
        </section>

        <section className="card area-billing">
          <h2 className="card-title">Subscription</h2>
          <DataSection state={billing} hint="GET /api/billing/subscription">
            {(data) => (
              <div className="billing">
                <div className="billing-plan">
                  <span className="plan-name">{data.plan}</span>
                  <span className={`plan-status plan-status-${data.status}`}>{data.status}</span>
                </div>
                <dl className="billing-meta">
                  <div>
                    <dt>Seats</dt>
                    <dd>
                      {data.usedSeats} / {data.seats} used
                    </dd>
                  </div>
                  <div>
                    <dt>Renews</dt>
                    <dd>{fmtDate(data.renewsAt)}</dd>
                  </div>
                  <div>
                    <dt>MRR</dt>
                    <dd>${data.mrr} / mo</dd>
                  </div>
                </dl>
              </div>
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
  const style = STATUS_STYLES[status] ?? { background: "rgba(100,116,139,0.12)", color: "#475569" };
  return (
    <span className="status-badge" style={style}>
      {status}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
