import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { MswPanelController, MswPanelSnapshot } from "./index.js";
import { HandlerRow, ToggleSwitch } from "./panel-handlers.js";
import { GearIcon, SlidersIcon } from "./panel-icons.js";
import { useAutoRefresh, useGrouped, usePanelOpen } from "./panel-settings.js";
import { panelThemes, type PanelTheme, type PanelThemeStyles } from "./panel-theme.js";
import { HandlerTreeView } from "./panel-tree.js";
import {
  actionButtonStyle,
  contentAreaStyle,
  emptyBodyStyle,
  emptyIconStyle,
  emptyStateStyle,
  emptyTitleStyle,
  eyebrowStyle,
  ghostButtonStyle,
  headerActionsStyle,
  headerLeftStyle,
  inlineCodeStyle,
  listStyle,
  logoMarkStyle,
  noResultsStyle,
  panelFrameStyle,
  panelHeaderStyle,
  refreshBannerStyle,
  refreshButtonStyle,
  searchClearStyle,
  searchInputStyle,
  searchWrapStyle,
  settingDescStyle,
  settingRowStyle,
  settingsBodyStyle,
  settingTextStyle,
  settingTitleStyle,
  summaryStyle,
  titleStyle,
  toolbarStyle,
  triggerBadgeStyle,
  triggerButtonStyle,
} from "./panel-styles.js";

/** Viewport corner where the floating trigger button is anchored. */
export type PanelPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
/** Direction the panel expands relative to the trigger button. */
export type PanelSide = "top" | "bottom";

export type { PanelTheme };

/**
 * Props for the floating `<MswPanel>` component.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/reference/react/
 */
export interface MswPanelProps {
  /** Controller from `createMswPanelController` or a bridge client. Pass `null` or `undefined` to render nothing. */
  controller: MswPanelController | null | undefined;
  /**
   * Codebase default for the "Auto-refresh on change" setting: reload the page whenever a handler
   * is enabled or disabled. Developers can override this per-browser from the panel's Settings view;
   * their saved choice takes precedence over this default. Defaults to `false`.
   */
  defaultAutoRefresh?: boolean;
  /**
   * Codebase default for the "Group handlers by path" setting: present handlers as a collapsible
   * tree grouped by shared path segments instead of a flat list. Developers can override this
   * per-browser from the panel's Settings view; their saved choice takes precedence. Defaults to `false`.
   */
  defaultGrouped?: boolean;
  /** Open the panel on first render. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Direction the panel expands from the trigger button. Defaults to the natural direction for the chosen corner. */
  panelSide?: PanelSide;
  /**
   * Remember the panel's open/closed state across page reloads (saved per-browser to
   * `localStorage`). Restores the last state on load, overriding `defaultOpen` — so the panel does
   * not vanish when a handler toggle reloads the page (e.g. with `defaultAutoRefresh`). Defaults to
   * `true`; set `false` to always start from `defaultOpen` and never persist.
   */
  persistOpen?: boolean;
  /** Viewport corner to anchor the trigger button. Defaults to `"bottom-right"`. */
  position?: PanelPosition;
  /** Render inside a Shadow DOM root to isolate from external CSS resets. */
  shadow?: boolean;
  /** Render even when `process.env.NODE_ENV === "production"`. Intended for hosted demos and docs. */
  showInProduction?: boolean;
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
  /**
   * Codebase default for the "Auto-refresh on change" setting: reload the page whenever a handler
   * is enabled or disabled. Developers can override this per-browser from the panel's Settings view;
   * their saved choice takes precedence over this default. Defaults to `false`.
   */
  defaultAutoRefresh?: boolean;
  /**
   * Codebase default for the "Group handlers by path" setting: present handlers as a collapsible
   * tree grouped by shared path segments instead of a flat list. Developers can override this
   * per-browser from the panel's Settings view; their saved choice takes precedence. Defaults to `false`.
   */
  defaultGrouped?: boolean;
  /** Render inside a Shadow DOM root to isolate from external CSS resets. */
  shadow?: boolean;
  /** Render even when `process.env.NODE_ENV === "production"`. Intended for hosted demos and docs. */
  showInProduction?: boolean;
  /** Inline styles applied to the panel frame. Use to set `height`, `width`, `overflow`, etc. */
  style?: CSSProperties;
  /** Visual theme. Defaults to `"dark"`. */
  theme?: PanelTheme;
  /** Show the Sync button in the toolbar. Defaults to `false`. */
  showSync?: boolean;
  /** Heading shown at the top of the panel. Defaults to `"MSW Panel"`. */
  title?: string;
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
  if ((!props.showInProduction && process.env.NODE_ENV === "production") || !controller) {
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
  if ((!props.showInProduction && process.env.NODE_ENV === "production") || !controller) {
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
  defaultAutoRefresh = false,
  defaultGrouped = false,
  defaultOpen = false,
  panelSide,
  persistOpen = true,
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
  const [isOpen, setIsOpen] = usePanelOpen(defaultOpen, persistOpen);
  const [filter, setFilter] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useAutoRefresh(defaultAutoRefresh);
  const [grouped, setGrouped] = useGrouped(defaultGrouped);
  const panelTheme = panelThemes[theme];

  const isTop = position.startsWith("top");
  const isLeft = position.endsWith("left");
  const effectivePanelSide = panelSide ?? (isTop ? "bottom" : "top");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      // Escape backs out of Settings first, then closes the panel.
      setShowSettings((settingsOpen) => {
        if (settingsOpen) {
          return false;
        }
        setIsOpen(false);
        return false;
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const rootStyle: CSSProperties = {
    alignItems: isLeft ? "flex-start" : "flex-end",
    bottom: isTop ? undefined : "1.5rem",
    display: "flex",
    flexDirection: effectivePanelSide === "top" ? "column-reverse" : "column",
    gap: "0.5rem",
    left: isLeft ? "1.5rem" : undefined,
    // The fixed wrapper spans its full width even when collapsed, so let clicks
    // pass through the empty area. Interactive children re-enable pointer events.
    pointerEvents: "none",
    position: "fixed",
    right: isLeft ? undefined : "1.5rem",
    top: isTop ? "1.5rem" : undefined,
    width: "min(28rem, calc(100vw - 2rem))",
    zIndex: 9999,
  };

  return (
    <aside aria-label={title} id="msw-panel" style={rootStyle}>
      {isOpen && (
        <PanelContent
          autoRefresh={autoRefresh}
          controller={controller}
          filter={filter}
          grouped={grouped}
          onAutoRefreshChange={setAutoRefresh}
          onClose={() => {
            setShowSettings(false);
            setIsOpen(false);
          }}
          onCloseSettings={() => setShowSettings(false)}
          onFilterChange={setFilter}
          onGroupedChange={setGrouped}
          onOpenSettings={() => setShowSettings(true)}
          showSettings={showSettings}
          showSync={showSync}
          snapshot={snapshot}
          theme={panelTheme}
          title={title}
        />
      )}
      {!isOpen && (
        <button
          aria-label="Open MSW Panel"
          onClick={() => setIsOpen(true)}
          style={{ ...triggerButtonStyle, ...panelTheme.triggerButton }}
          type="button"
        >
          <SlidersIcon size={24} />
          {showCount && snapshot.activeHandlers > 0 ? (
            <span
              data-msw-panel-count="trigger-badge"
              style={{ ...triggerBadgeStyle, ...panelTheme.triggerBadge }}
            >
              {snapshot.activeHandlers}
            </span>
          ) : null}
        </button>
      )}
    </aside>
  );
}

function MswPanelEmbeddedInner({
  controller,
  defaultAutoRefresh = false,
  defaultGrouped = false,
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
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useAutoRefresh(defaultAutoRefresh);
  const [grouped, setGrouped] = useGrouped(defaultGrouped);
  const panelTheme = panelThemes[theme];

  return (
    <PanelContent
      autoRefresh={autoRefresh}
      controller={controller}
      filter={filter}
      grouped={grouped}
      onAutoRefreshChange={setAutoRefresh}
      onCloseSettings={() => setShowSettings(false)}
      onFilterChange={setFilter}
      onGroupedChange={setGrouped}
      onOpenSettings={() => setShowSettings(true)}
      showSettings={showSettings}
      showSync={showSync}
      snapshot={snapshot}
      style={style}
      theme={panelTheme}
      title={title}
    />
  );
}

interface PanelContentProps {
  autoRefresh: boolean;
  controller: MswPanelController;
  filter: string;
  grouped: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onClose?: () => void;
  onCloseSettings: () => void;
  onFilterChange: (value: string) => void;
  onGroupedChange: (value: boolean) => void;
  onOpenSettings: () => void;
  showSettings: boolean;
  showSync: boolean;
  snapshot: MswPanelSnapshot;
  style?: CSSProperties;
  theme: PanelThemeStyles;
  title: string;
}

function PanelContent({
  autoRefresh,
  controller,
  filter,
  grouped,
  onAutoRefreshChange,
  onClose,
  onCloseSettings,
  onFilterChange,
  onGroupedChange,
  onOpenSettings,
  showSettings,
  showSync,
  snapshot,
  style,
  theme,
  title,
}: PanelContentProps) {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const usedHandlers = snapshot.handlers.filter((handler) => handler.used).length;

  // After a handler change, either reload immediately (auto-refresh on) or surface the manual banner.
  const onHandlerChange = () => {
    if (autoRefresh) {
      window.location.reload();
    } else {
      setNeedsRefresh(true);
    }
  };

  const filteredHandlers = filter
    ? snapshot.handlers.filter(
        (handler) =>
          handler.label.toLowerCase().includes(filter.toLowerCase()) ||
          handler.path?.toLowerCase().includes(filter.toLowerCase()) ||
          handler.method?.toLowerCase().includes(filter.toLowerCase()),
      )
    : snapshot.handlers;

  if (showSettings) {
    return (
      <div style={{ ...panelFrameStyle, ...theme.frame, ...style }}>
        <div style={panelHeaderStyle}>
          <div style={headerLeftStyle}>
            <button
              aria-label="Back to handlers"
              onClick={onCloseSettings}
              style={{ ...ghostButtonStyle, ...theme.ghostButton }}
              type="button"
            >
              ←
            </button>
            <strong style={{ ...titleStyle, ...theme.title }}>Settings</strong>
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

        <div style={settingsBodyStyle}>
          <div style={settingRowStyle}>
            <div style={settingTextStyle}>
              <strong style={{ ...settingTitleStyle, ...theme.title }}>
                Auto-refresh on change
              </strong>
              <span style={{ ...settingDescStyle, ...theme.summary }}>
                Reload the page whenever a handler is enabled or disabled.
              </span>
            </div>
            <ToggleSwitch
              enabled={autoRefresh}
              label="auto-refresh on change"
              onToggle={() => onAutoRefreshChange(!autoRefresh)}
              theme={theme}
            />
          </div>
          <div style={settingRowStyle}>
            <div style={settingTextStyle}>
              <strong style={{ ...settingTitleStyle, ...theme.title }}>
                Group handlers by path
              </strong>
              <span style={{ ...settingDescStyle, ...theme.summary }}>
                Show handlers as a collapsible tree grouped by shared path segments.
              </span>
            </div>
            <ToggleSwitch
              enabled={grouped}
              label="group handlers by path"
              onToggle={() => onGroupedChange(!grouped)}
              theme={theme}
            />
          </div>
        </div>
      </div>
    );
  }

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
        <div style={headerActionsStyle}>
          <button
            aria-label="Open settings"
            onClick={onOpenSettings}
            style={{ ...ghostButtonStyle, ...theme.ghostButton }}
            type="button"
          >
            <GearIcon size={16} />
          </button>
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
      </div>

      <div data-msw-panel-count-group="summary" style={{ ...summaryStyle, ...theme.summary }}>
        <span data-msw-panel-count="enabled">{snapshot.activeHandlers} enabled</span>
        <span data-msw-panel-count="disabled">{snapshot.disabledHandlers} disabled</span>
        <span data-msw-panel-count="used">{usedHandlers} used</span>
      </div>

      <div style={toolbarStyle}>
        <button
          onClick={() => {
            controller.setAllEnabled(true);
            onHandlerChange();
          }}
          style={{ ...actionButtonStyle, ...theme.actionButton }}
          type="button"
        >
          Enable all
        </button>
        <button
          onClick={() => {
            controller.setAllEnabled(false);
            onHandlerChange();
          }}
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

      {needsRefresh && (
        <div style={{ ...refreshBannerStyle, ...theme.refreshBanner }}>
          <span>Refresh the page to apply handler changes.</span>
          <button
            onClick={() => window.location.reload()}
            style={{ ...refreshButtonStyle, ...theme.refreshButton }}
            type="button"
          >
            Refresh
          </button>
        </div>
      )}

      <div style={contentAreaStyle}>
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
                aria-label="Filter handlers"
                onChange={(e) => onFilterChange(e.target.value)}
                placeholder="Filter handlers…"
                style={{ ...searchInputStyle, ...theme.searchInput }}
                type="search"
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
            ) : grouped ? (
              <HandlerTreeView
                filtering={filter.length > 0}
                handlers={filteredHandlers}
                onToggleHandler={(id) => {
                  controller.toggle(id);
                  onHandlerChange();
                }}
                theme={theme}
              />
            ) : (
              <ul style={listStyle}>
                {filteredHandlers.map((handler) => (
                  <HandlerRow
                    handler={handler}
                    key={handler.id}
                    onToggle={() => {
                      controller.toggle(handler.id);
                      onHandlerChange();
                    }}
                    theme={theme}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
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
