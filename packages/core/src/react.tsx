import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { MswPanelController, MswPanelHandlerSnapshot, MswPanelSnapshot } from "./index.js";

/** Viewport corner where the floating trigger button is anchored. */
export type PanelPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
/** Direction the panel expands relative to the trigger button. */
export type PanelSide = "top" | "bottom";
/** Built-in visual theme for the panel. */
export type PanelTheme = "dark" | "light";

/**
 * Props for the floating `<MswPanel>` component.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/reference/react/
 */
export interface MswPanelProps {
  /** Controller from `createMswPanelController` or a bridge client. Pass `null` or `undefined` to render nothing. */
  controller: MswPanelController | null | undefined;
  /** Open the panel on first render. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Direction the panel expands from the trigger button. Defaults to the natural direction for the chosen corner. */
  panelSide?: PanelSide;
  /** Viewport corner to anchor the trigger button. Defaults to `"bottom-right"`. */
  position?: PanelPosition;
  /** Render inside a Shadow DOM root to isolate from external CSS resets. */
  shadow?: boolean;
  /** Show the enabled-handler count badge on the collapsed trigger button. Defaults to `true`. */
  showCount?: boolean;
  /** Show the Sync button in the toolbar. Defaults to `false`. */
  showSync?: boolean;
  /** Visual theme. Defaults to `"dark"`. */
  theme?: PanelTheme;
  /** Heading shown inside the open panel. Defaults to `"MSW Panel"`. */
  title?: string;
}

/**
 * Props for the inline `<MswPanelEmbedded>` component.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/reference/react/
 */
export interface MswPanelEmbeddedProps {
  /** Controller from `createMswPanelController` or a bridge client. Pass `null` or `undefined` to render nothing. */
  controller: MswPanelController | null | undefined;
  /** Render inside a Shadow DOM root to isolate from external CSS resets. */
  shadow?: boolean;
  /** Inline styles applied to the panel frame. Use to set `height`, `width`, `overflow`, etc. */
  style?: CSSProperties;
  /** Visual theme. Defaults to `"dark"`. */
  theme?: PanelTheme;
  /** Show the Sync button in the toolbar. Defaults to `false`. */
  showSync?: boolean;
  /** Heading shown at the top of the panel. Defaults to `"MSW Panel"`. */
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

/**
 * Floating devtools panel for Mock Service Worker. Renders a fixed trigger button in a
 * viewport corner; clicking it toggles the panel open or closed.
 *
 * Renders nothing in production or when `controller` is `null` or `undefined`.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/reference/react/
 */
export function MswPanel({ controller, shadow, ...props }: MswPanelProps) {
  if (process.env.NODE_ENV === "production" || !controller) {
    return null;
  }
  const inner = <MswPanelInner controller={controller} {...props} />;
  return shadow ? <ShadowHost>{inner}</ShadowHost> : inner;
}

/**
 * Inline devtools panel for Mock Service Worker. Always expanded — no floating trigger button.
 * Useful for Storybook addons, custom dev dashboards, or any layout where you control placement.
 *
 * Renders nothing in production or when `controller` is `null` or `undefined`.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/reference/react/
 */
export function MswPanelEmbedded({ controller, shadow, style, ...props }: MswPanelEmbeddedProps) {
  if (process.env.NODE_ENV === "production" || !controller) {
    return null;
  }
  if (shadow) {
    return (
      <ShadowHost style={style}>
        <MswPanelEmbeddedInner controller={controller} {...props} />
      </ShadowHost>
    );
  }
  return <MswPanelEmbeddedInner controller={controller} style={style} {...props} />;
}

function MswPanelInner({
  controller,
  defaultOpen = false,
  panelSide,
  position = "bottom-right",
  showCount = true,
  showSync = false,
  theme = "dark",
  title = "MSW Panel",
}: Omit<MswPanelProps, "controller" | "shadow"> & { controller: MswPanelController }) {
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
  const effectivePanelSide = panelSide ?? (isTop ? "bottom" : "top");

  const rootStyle: CSSProperties = {
    alignItems: isLeft ? "flex-start" : "flex-end",
    bottom: isTop ? undefined : "1.5rem",
    display: "flex",
    flexDirection: effectivePanelSide === "top" ? "column-reverse" : "column",
    gap: "0.5rem",
    left: isLeft ? "1.5rem" : undefined,
    position: "fixed",
    right: isLeft ? undefined : "1.5rem",
    top: isTop ? "1.5rem" : undefined,
    width: "min(28rem, calc(100vw - 2rem))",
    zIndex: 9999,
  };

  return (
    <aside style={rootStyle}>
      {isOpen && (
        <PanelContent
          controller={controller}
          filter={filter}
          onClose={() => setIsOpen(false)}
          onFilterChange={setFilter}
          showSync={showSync}
          snapshot={snapshot}
          theme={panelTheme}
          title={title}
        />
      )}
      <button
        aria-label={isOpen ? "Hide MSW Panel" : "Open MSW Panel"}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ ...triggerButtonStyle, ...panelTheme.triggerButton }}
        type="button"
      >
        <SlidersIcon size={24} />
        {showCount && snapshot.activeHandlers > 0 && !isOpen ? (
          <span
            data-msw-panel-count="trigger-badge"
            style={{ ...triggerBadgeStyle, ...panelTheme.triggerBadge }}
          >
            {snapshot.activeHandlers}
          </span>
        ) : null}
      </button>
    </aside>
  );
}

function MswPanelEmbeddedInner({
  controller,
  showSync = false,
  style,
  theme = "dark",
  title = "MSW Panel",
}: Omit<MswPanelEmbeddedProps, "controller" | "shadow"> & { controller: MswPanelController }) {
  const snapshot = useSyncExternalStore<MswPanelSnapshot>(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [filter, setFilter] = useState("");
  const panelTheme = panelThemes[theme];

  return (
    <PanelContent
      controller={controller}
      filter={filter}
      onFilterChange={setFilter}
      showSync={showSync}
      snapshot={snapshot}
      style={style}
      theme={panelTheme}
      title={title}
    />
  );
}

interface PanelContentProps {
  controller: MswPanelController;
  filter: string;
  onClose?: () => void;
  onFilterChange: (value: string) => void;
  showSync: boolean;
  snapshot: MswPanelSnapshot;
  style?: CSSProperties;
  theme: PanelThemeStyles;
  title: string;
}

function PanelContent({
  controller,
  filter,
  onClose,
  onFilterChange,
  showSync,
  snapshot,
  style,
  theme,
  title,
}: PanelContentProps) {
  const usedHandlers = snapshot.handlers.filter((handler) => handler.used).length;

  const filteredHandlers = filter
    ? snapshot.handlers.filter(
        (handler) =>
          handler.label.toLowerCase().includes(filter.toLowerCase()) ||
          handler.path?.toLowerCase().includes(filter.toLowerCase()) ||
          handler.method?.toLowerCase().includes(filter.toLowerCase()),
      )
    : snapshot.handlers;

  return (
    <div style={{ ...panelFrameStyle, ...theme.frame, ...style }}>
      <div style={panelHeaderStyle}>
        <div style={headerLeftStyle}>
          <div style={logoMarkStyle}>
            <SlidersIcon size={20} />
          </div>
          <div>
            <div style={eyebrowStyle}>Mock controls</div>
            <strong style={{ ...titleStyle, ...theme.title }}>{title}</strong>
          </div>
        </div>
        {onClose && (
          <button
            aria-label="Close MSW Panel"
            onClick={onClose}
            style={{ ...ghostButtonStyle, ...theme.ghostButton }}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <div data-msw-panel-count-group="summary" style={{ ...summaryStyle, ...theme.summary }}>
        <span data-msw-panel-count="enabled">{snapshot.activeHandlers} enabled</span>
        <span data-msw-panel-count="disabled">{snapshot.disabledHandlers} disabled</span>
        <span data-msw-panel-count="used">{usedHandlers} used</span>
      </div>

      <div style={toolbarStyle}>
        <button
          onClick={() => controller.setAllEnabled(true)}
          style={{ ...actionButtonStyle, ...theme.actionButton }}
          type="button"
        >
          Enable all
        </button>
        <button
          onClick={() => controller.setAllEnabled(false)}
          style={{ ...actionButtonStyle, ...theme.actionButton }}
          type="button"
        >
          Disable all
        </button>
        {showSync && (
          <button
            onClick={() => controller.sync()}
            style={{ ...actionButtonStyle, ...theme.actionButton }}
            type="button"
          >
            Sync
          </button>
        )}
      </div>

      {snapshot.handlers.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ ...emptyIconStyle, ...theme.emptyIcon }}>
            <SlidersIcon size={32} />
          </div>
          <p style={{ ...emptyTitleStyle, ...theme.emptyTitle }}>No handlers registered</p>
          <p style={{ ...emptyBodyStyle, ...theme.emptyBody }}>
            Pass handlers to{" "}
            <code style={{ ...inlineCodeStyle, ...theme.inlineCode }}>
              createMswPanelController
            </code>{" "}
            to see them here.
          </p>
        </div>
      ) : (
        <>
          <div style={searchWrapStyle}>
            <input
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Filter handlers…"
              style={{ ...searchInputStyle, ...theme.searchInput }}
              type="text"
              value={filter}
            />
            {filter ? (
              <button
                aria-label="Clear filter"
                onClick={() => onFilterChange("")}
                style={{ ...searchClearStyle, ...theme.searchClear }}
                type="button"
              >
                ✕
              </button>
            ) : null}
          </div>

          {filteredHandlers.length === 0 ? (
            <p style={{ ...noResultsStyle, ...theme.noResults }}>
              No handlers match &ldquo;{filter}&rdquo;
            </p>
          ) : (
            <ul style={listStyle}>
              {filteredHandlers.map((handler) => (
                <HandlerRow
                  handler={handler}
                  key={handler.id}
                  onToggle={() => controller.toggle(handler.id)}
                  theme={theme}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ShadowHost({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (ref.current) {
      setShadowRoot(ref.current.attachShadow({ mode: "open" }));
    }
  }, []);

  return (
    <div ref={ref} style={style}>
      {shadowRoot ? createPortal(children, shadowRoot) : null}
    </div>
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
    <li
      data-handler-id={handler.id}
      data-handler-method={handler.method ?? undefined}
      data-handler-path={handler.path ?? undefined}
      style={{ ...rowStyle, ...theme.rowBorder, ...(handler.used ? null : theme.rowUnused) }}
    >
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
  fontVariantNumeric: "tabular-nums",
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
  fontVariantNumeric: "tabular-nums",
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
