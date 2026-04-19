import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";

import type {
  MswPanelController,
  MswPanelHandlerSnapshot,
  MswPanelSnapshot,
} from "./index.js";

export type PanelPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type PanelTheme = "dark" | "light";

export interface MswPanelProps {
  controller: MswPanelController;
  defaultOpen?: boolean;
  position?: PanelPosition;
  showCount?: boolean;
  theme?: PanelTheme;
  title?: string;
}

interface PanelThemeStyles {
  actionButton: CSSProperties;
  emptyBody: CSSProperties;
  emptyIcon: CSSProperties;
  emptyTitle: CSSProperties;
  frame: CSSProperties;
  ghostButton: CSSProperties;
  inlineCode: CSSProperties;
  kindBadge: CSSProperties;
  methodBadge: CSSProperties;
  noResults: CSSProperties;
  rowBorder: CSSProperties;
  pathUsed: CSSProperties;
  pathUnused: CSSProperties;
  rowUnused: CSSProperties;
  usageMeta: CSSProperties;
  searchClear: CSSProperties;
  searchInput: CSSProperties;
  summary: CSSProperties;
  title: CSSProperties;
  toggleDisabled: CSSProperties;
  toggleEnabled: CSSProperties;
  triggerBadge: CSSProperties;
  triggerButton: CSSProperties;
}

export function MswPanel({
  controller,
  defaultOpen = false,
  position = "bottom-right",
  showCount = true,
  theme = "dark",
  title = "MSW Panel",
}: MswPanelProps) {
  if (process.env.NODE_ENV === "production") return null;

  const snapshot = useSyncExternalStore<MswPanelSnapshot>(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [filter, setFilter] = useState("");
  const panelTheme = panelThemes[theme];

  const isTop = position.startsWith("top");
  const isLeft = position.endsWith("left");
  const usedHandlers = snapshot.handlers.filter((handler) => handler.used).length;

  const rootStyle: CSSProperties = {
    ...panelRootBase,
    bottom: isTop ? undefined : "1.5rem",
    left: isLeft ? "1.5rem" : undefined,
    right: isLeft ? undefined : "1.5rem",
    top: isTop ? "1.5rem" : undefined,
  };

  const filteredHandlers = filter
    ? snapshot.handlers.filter(
        (handler) =>
          handler.label.toLowerCase().includes(filter.toLowerCase()) ||
          handler.path?.toLowerCase().includes(filter.toLowerCase()) ||
          handler.method?.toLowerCase().includes(filter.toLowerCase()),
      )
    : snapshot.handlers;

  return (
    <aside style={rootStyle}>
      {isOpen ? (
        <div style={{ ...panelFrameStyle, ...panelTheme.frame }}>
          <div style={panelHeaderStyle}>
            <div style={headerLeftStyle}>
              <div style={logoMarkStyle}>
                <SlidersIcon size={20} />
              </div>
              <div>
                <div style={eyebrowStyle}>Mock controls</div>
                <strong style={{ ...titleStyle, ...panelTheme.title }}>{title}</strong>
              </div>
            </div>
            <button
              aria-label="Close MSW Panel"
              onClick={() => setIsOpen(false)}
              style={{ ...ghostButtonStyle, ...panelTheme.ghostButton }}
              type="button"
            >
              ✕
            </button>
          </div>

          <div style={{ ...summaryStyle, ...panelTheme.summary }}>
            <span>{snapshot.activeHandlers} enabled</span>
            <span>{snapshot.disabledHandlers} disabled</span>
            <span>{usedHandlers} used</span>
          </div>

          <div style={toolbarStyle}>
            <button
              onClick={() => controller.setAllEnabled(true)}
              style={{ ...actionButtonStyle, ...panelTheme.actionButton }}
              type="button"
            >
              Enable all
            </button>
            <button
              onClick={() => controller.setAllEnabled(false)}
              style={{ ...actionButtonStyle, ...panelTheme.actionButton }}
              type="button"
            >
              Disable all
            </button>
            <button
              onClick={() => controller.sync()}
              style={{ ...actionButtonStyle, ...panelTheme.actionButton }}
              type="button"
            >
              Sync
            </button>
          </div>

          {snapshot.handlers.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ ...emptyIconStyle, ...panelTheme.emptyIcon }}>
                <SlidersIcon size={32} />
              </div>
              <p style={{ ...emptyTitleStyle, ...panelTheme.emptyTitle }}>No handlers registered</p>
              <p style={{ ...emptyBodyStyle, ...panelTheme.emptyBody }}>
                Pass handlers to <code style={{ ...inlineCodeStyle, ...panelTheme.inlineCode }}>createMswPanelController</code> to
                see them here.
              </p>
            </div>
          ) : (
            <>
              <div style={searchWrapStyle}>
                <input
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter handlers…"
                  style={{ ...searchInputStyle, ...panelTheme.searchInput }}
                  type="text"
                  value={filter}
                />
                {filter ? (
                  <button
                    aria-label="Clear filter"
                    onClick={() => setFilter("")}
                    style={{ ...searchClearStyle, ...panelTheme.searchClear }}
                    type="button"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {filteredHandlers.length === 0 ? (
                <p style={{ ...noResultsStyle, ...panelTheme.noResults }}>
                  No handlers match &ldquo;{filter}&rdquo;
                </p>
              ) : (
                <ul style={listStyle}>
                  {filteredHandlers.map((handler) => (
                    <HandlerRow
                      handler={handler}
                      key={handler.id}
                      onToggle={() => controller.toggle(handler.id)}
                      theme={panelTheme}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : (
        <button
          aria-label="Open MSW Panel"
          onClick={() => setIsOpen(true)}
          style={{
            ...triggerButtonStyle,
            ...panelTheme.triggerButton,
            marginLeft: isLeft ? 0 : "auto",
          }}
          type="button"
        >
          <SlidersIcon size={24} />
          {showCount && snapshot.activeHandlers > 0 ? (
            <span style={{ ...triggerBadgeStyle, ...panelTheme.triggerBadge }}>
              {snapshot.activeHandlers}
            </span>
          ) : null}
        </button>
      )}
    </aside>
  );
}

interface HandlerRowProps {
  handler: MswPanelHandlerSnapshot;
  onToggle: () => void;
  theme: PanelThemeStyles;
}

function HandlerRow({ handler, onToggle, theme }: HandlerRowProps) {
  const badge = handler.method ? (
    <span style={{ ...methodBadgeStyle, ...theme.methodBadge }}>
      {handler.method === "*" ? "ANY" : handler.method}
    </span>
  ) : (
    <span style={{ ...kindBadgeStyle, ...theme.kindBadge }}>{handler.kind}</span>
  );
  const label = handler.path ?? handler.label;
  const usageLabel = handler.used ? "used" : "idle";

  return (
    <li style={{ ...rowStyle, ...theme.rowBorder, ...(handler.used ? null : theme.rowUnused) }}>
      <div style={rowMainStyle}>
        <div style={rowMetaStyle}>
          {badge}
          <span style={{ ...usageMetaStyle, ...theme.usageMeta }}>{usageLabel}</span>
        </div>
        <div style={rowContentStyle}>
          <span style={{ ...pathStyle, ...(handler.used ? theme.pathUsed : theme.pathUnused) }}>
            {label}
          </span>
        </div>
      </div>
      <ToggleSwitch enabled={handler.enabled} onToggle={onToggle} theme={theme} />
    </li>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  theme: PanelThemeStyles;
}

function ToggleSwitch({ enabled, onToggle, theme }: ToggleSwitchProps) {
  return (
    <button
      aria-checked={enabled}
      onClick={onToggle}
      role="switch"
      style={{
        ...toggleTrackBase,
        ...(enabled ? theme.toggleEnabled : theme.toggleDisabled),
      }}
      type="button"
    >
      <span
        style={{
          ...toggleThumbStyle,
          left: enabled ? "calc(100% - 1.125rem - 0.1875rem)" : "0.1875rem",
        }}
      />
    </button>
  );
}

function SlidersIcon({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <rect
        fill="currentColor"
        fillOpacity="0.35"
        height="1.8"
        rx="0.9"
        width="15"
        x="0.5"
        y="2.75"
      />
      <circle cx="5" cy="3.65" fill="currentColor" r="3" />
      <rect
        fill="currentColor"
        fillOpacity="0.35"
        height="1.8"
        rx="0.9"
        width="15"
        x="0.5"
        y="7.1"
      />
      <circle cx="11.25" cy="8" fill="currentColor" r="3" />
      <rect
        fill="currentColor"
        fillOpacity="0.35"
        height="1.8"
        rx="0.9"
        width="15"
        x="0.5"
        y="11.45"
      />
      <circle cx="7.2" cy="12.35" fill="currentColor" r="3" />
    </svg>
  );
}

const panelThemes: Record<PanelTheme, PanelThemeStyles> = {
  dark: {
    actionButton: {
      background: "#ff6a33",
      border: "1px solid #ff6a33",
      color: "#111111",
    },
    emptyBody: {
      color: "#8f97ab",
    },
    emptyIcon: {
      color: "#495164",
    },
    emptyTitle: {
      color: "#f4f7fb",
    },
    frame: {
      background: "#10141d",
      border: "1px solid #283042",
      boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
      color: "#f4f7fb",
    },
    ghostButton: {
      background: "#1a2030",
      border: "1px solid #2d374c",
      color: "#d8dfed",
    },
    inlineCode: {
      background: "#191f2c",
      color: "#f4f7fb",
    },
    kindBadge: {
      background: "#1d2433",
      color: "#c7d0e3",
    },
    methodBadge: {
      background: "#1a332b",
      color: "#8ce5be",
    },
    noResults: {
      color: "#8f97ab",
    },
    pathUnused: {
      color: "#7d879d",
    },
    pathUsed: {
      color: "#eef2f8",
    },
    rowUnused: {
      background: "#131927",
    },
    rowBorder: {
      borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
    },
    searchClear: {
      color: "#7d879d",
    },
    searchInput: {
      background: "#131927",
      border: "1px solid #293246",
      color: "#f4f7fb",
    },
    summary: {
      color: "#9aa3b7",
    },
    title: {
      color: "#f8fbff",
    },
    toggleDisabled: {
      background: "#39445a",
    },
    toggleEnabled: {
      background: "#ff6a33",
    },
    triggerBadge: {
      background: "#f04438",
      color: "#fff",
    },
    triggerButton: {
      background: "#ff6a33",
      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
      color: "#ffffff",
    },
    usageMeta: {
      color: "#8f97ab",
    },
  },
  light: {
    actionButton: {
      background: "#111827",
      border: "1px solid #111827",
      color: "#fff",
    },
    emptyBody: {
      color: "#6b7280",
    },
    emptyIcon: {
      color: "#d1d5db",
    },
    emptyTitle: {
      color: "#111827",
    },
    frame: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
      color: "#111827",
    },
    ghostButton: {
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      color: "#374151",
    },
    inlineCode: {
      background: "#f3f4f6",
      color: "#111827",
    },
    kindBadge: {
      background: "#f3f4f6",
      color: "#374151",
    },
    methodBadge: {
      background: "#ecfdf5",
      color: "#065f46",
    },
    noResults: {
      color: "#6b7280",
    },
    pathUnused: {
      color: "#9ca3af",
    },
    pathUsed: {
      color: "#374151",
    },
    rowUnused: {
      background: "#fafafa",
    },
    rowBorder: {
      borderBottom: "1px solid #f3f4f6",
    },
    searchClear: {
      color: "#9ca3af",
    },
    searchInput: {
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      color: "#111827",
    },
    summary: {
      color: "#6b7280",
    },
    title: {
      color: "#111827",
    },
    toggleDisabled: {
      background: "#e5e7eb",
    },
    toggleEnabled: {
      background: "#ff6a33",
    },
    triggerBadge: {
      background: "#dc2626",
      color: "#fff",
    },
    triggerButton: {
      background: "#ff6a33",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      color: "#fff",
    },
    usageMeta: {
      color: "#6b7280",
    },
  },
};

const panelRootBase: CSSProperties = {
  position: "fixed",
  width: "min(28rem, calc(100vw - 2rem))",
  zIndex: 9999,
};

const panelFrameStyle: CSSProperties = {
  borderRadius: "0.75rem",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "0.875rem",
  padding: "1rem",
};

const panelHeaderStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "1rem",
  justifyContent: "space-between",
};

const headerLeftStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "0.5rem",
};

const logoMarkStyle: CSSProperties = {
  alignItems: "center",
  background: "#ff6a33",
  borderRadius: "0.375rem",
  color: "#fff",
  display: "flex",
  flexShrink: 0,
  height: "2.25rem",
  justifyContent: "center",
  width: "2.25rem",
};

const eyebrowStyle: CSSProperties = {
  color: "#8b93a7",
  fontSize: "0.65rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
};

const summaryStyle: CSSProperties = {
  display: "flex",
  fontSize: "0.8rem",
  gap: "0.75rem",
  marginTop: "0.75rem",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  marginTop: "0.75rem",
};

const searchWrapStyle: CSSProperties = {
  display: "flex",
  marginTop: "0.75rem",
  position: "relative",
};

const searchInputStyle: CSSProperties = {
  borderRadius: "0.5rem",
  font: "inherit",
  fontSize: "0.8rem",
  outline: "none",
  padding: "0.45rem 2rem 0.45rem 0.625rem",
  width: "100%",
};

const searchClearStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  bottom: 0,
  cursor: "pointer",
  fontSize: "0.65rem",
  padding: "0 0.5rem",
  position: "absolute",
  right: 0,
  top: 0,
};

const noResultsStyle: CSSProperties = {
  fontSize: "0.8rem",
  margin: "1rem 0 0",
  textAlign: "center",
};

const listStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "0.75rem",
  listStyle: "none",
  margin: "0.75rem 0 0",
  maxHeight: "22rem",
  overflowY: "auto",
  padding: 0,
};

const rowStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  gap: "0.75rem",
  justifyContent: "space-between",
  padding: "0.6rem 0.75rem",
};

const rowMainStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "0.35rem",
  minWidth: 0,
};

const rowMetaStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  minWidth: 0,
};

const rowContentStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minWidth: 0,
};

const usageMetaStyle: CSSProperties = {
  borderRadius: "999px",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.65rem",
  letterSpacing: "0.04em",
  padding: "0.1rem 0.35rem",
  textTransform: "uppercase",
};

const kindBadgeStyle: CSSProperties = {
  borderRadius: "0.28rem",
  flexShrink: 0,
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.6rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  padding: "0.14em 0.42em",
  textTransform: "uppercase",
};

const methodBadgeStyle: CSSProperties = {
  borderRadius: "0.28rem",
  flexShrink: 0,
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.6rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  padding: "0.14em 0.42em",
  textTransform: "uppercase",
};

const pathStyle: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.75rem",
  lineHeight: 1.45,
  minWidth: 0,
  overflowWrap: "anywhere",
  whiteSpace: "normal",
};

const sharedButtonStyle: CSSProperties = {
  borderRadius: "0.5rem",
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.75rem",
};

const ghostButtonStyle: CSSProperties = {
  ...sharedButtonStyle,
  padding: "0.35rem 0.6rem",
};

const actionButtonStyle: CSSProperties = {
  ...sharedButtonStyle,
  padding: "0.35rem 0.6rem",
};

const triggerButtonStyle: CSSProperties = {
  alignItems: "center",
  border: 0,
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  height: "3.25rem",
  justifyContent: "center",
  lineHeight: 0,
  padding: 0,
  position: "relative",
  width: "3.25rem",
};

const triggerBadgeStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: "999px",
  display: "flex",
  fontSize: "0.6rem",
  fontWeight: 700,
  height: "1.1rem",
  justifyContent: "center",
  minWidth: "1.1rem",
  padding: "0 0.2rem",
  position: "absolute",
  right: "-0.1rem",
  top: "-0.1rem",
};

const toggleTrackBase: CSSProperties = {
  border: 0,
  borderRadius: "999px",
  cursor: "pointer",
  display: "block",
  flexShrink: 0,
  height: "1.5rem",
  padding: 0,
  position: "relative",
  transition: "background 180ms ease",
  width: "2.75rem",
};

const toggleThumbStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "50%",
  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
  height: "1.125rem",
  position: "absolute",
  top: "0.1875rem",
  transition: "left 180ms ease",
  width: "1.125rem",
};

const emptyStateStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  padding: "2rem 1rem 1.5rem",
  textAlign: "center",
};

const emptyIconStyle: CSSProperties = {
  marginBottom: "0.25rem",
};

const emptyTitleStyle: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  margin: 0,
};

const emptyBodyStyle: CSSProperties = {
  fontSize: "0.78rem",
  lineHeight: 1.5,
  margin: 0,
};

const inlineCodeStyle: CSSProperties = {
  borderRadius: "0.25rem",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.72rem",
  padding: "0.1em 0.35em",
};
