import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { MswPanelController, MswPanelSnapshot } from "./index.js";
import { HandlerRow, ToggleSwitch } from "./panel-handlers.js";
import { GearIcon, MswLogo, SlidersIcon } from "./panel-icons.js";
import {
  type GroupByMode,
  useAutoRefresh,
  useFilter,
  useGroupBy,
  useOnlyUsed,
  usePanelOpen,
  usePersistentScroll,
} from "./panel-settings.js";
import { panelThemes, type PanelTheme, type PanelThemeStyles } from "./panel-theme.js";
import { HandlerTreeControls, HandlerTreeList, useHandlerTree } from "./panel-tree.js";
import {
  compactButtonStyle,
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
  onlyUsedCheckboxStyle,
  onlyUsedCountStyle,
  onlyUsedLabelStyle,
  onlyUsedTextStyle,
  onlyUsedToggleStyle,
  panelChromeFillStyle,
  panelChromeStyle,
  panelFrameStyle,
  panelHeaderStyle,
  presetSelectStyle,
  refreshBannerStyle,
  refreshButtonStyle,
  searchClearStyle,
  searchInputStyle,
  searchRowStyle,
  searchWrapStyle,
  settingDescStyle,
  settingControlStyle,
  settingRowStyle,
  settingSelectStyle,
  settingsBodyStyle,
  settingTextStyle,
  settingTitleStyle,
  summaryActionsStyle,
  summaryRowStyle,
  summaryStyle,
  titleStyle,
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
   * Codebase default for the "Group by" setting: present handlers as a flat list (`"none"`), a
   * collapsible tree grouped by shared path segments (`"path"`), or grouped by tag
   * (`"tag"`). Developers can override this per-browser from the panel's Settings view; their
   * saved choice takes precedence. Defaults to `"tag"` when any handler has tags, otherwise `"path"`.
   */
  defaultGroupBy?: GroupByMode;
  /** Open the panel on first render. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Direction the panel expands from the trigger button. Defaults to the natural direction for the chosen corner. */
  panelSide?: PanelSide;
  /**
   * Remember the panel's open/closed state across page reloads (saved per-browser to
   * `localStorage`). Restores the last state on load, overriding `defaultOpen`, so the panel does
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
   * Codebase default for the "Group by" setting: present handlers as a flat list (`"none"`), a
   * collapsible tree grouped by shared path segments (`"path"`), or grouped by tag
   * (`"tag"`). Developers can override this per-browser from the panel's Settings view; their
   * saved choice takes precedence. Defaults to `"tag"` when any handler has tags, otherwise `"path"`.
   */
  defaultGroupBy?: GroupByMode;
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
 * Inline devtools panel for Mock Service Worker. Always expanded, with no floating trigger button.
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
  defaultGroupBy,
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
  const [filter, setFilter] = useFilter();
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useAutoRefresh(defaultAutoRefresh);
  const [groupBy, setGroupBy] = useGroupBy(defaultGroupBy ?? resolveDefaultGroupBy(snapshot));
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
          groupBy={groupBy}
          onAutoRefreshChange={setAutoRefresh}
          onClose={() => {
            setShowSettings(false);
            setIsOpen(false);
          }}
          onCloseSettings={() => setShowSettings(false)}
          onFilterChange={setFilter}
          onGroupByChange={setGroupBy}
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
          <MswLogo size={52} />
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
  defaultGroupBy,
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
  const [filter, setFilter] = useFilter();
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useAutoRefresh(defaultAutoRefresh);
  const [groupBy, setGroupBy] = useGroupBy(defaultGroupBy ?? resolveDefaultGroupBy(snapshot));
  const panelTheme = panelThemes[theme];

  return (
    <PanelContent
      autoRefresh={autoRefresh}
      controller={controller}
      filter={filter}
      groupBy={groupBy}
      onAutoRefreshChange={setAutoRefresh}
      onCloseSettings={() => setShowSettings(false)}
      onFilterChange={setFilter}
      onGroupByChange={setGroupBy}
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

/** Picks the codebase-default grouping: feature when any handler is tagged, otherwise path. */
function resolveDefaultGroupBy(snapshot: MswPanelSnapshot): GroupByMode {
  return snapshot.handlers.some((handler) => (handler.tags?.length ?? 0) > 0) ? "tag" : "path";
}

/**
 * How long the auto-refresh reload waits after the last change before firing. Debouncing batches a
 * burst of toggles into one reload, gives an async (bridge-backed) controller time to apply and
 * persist the change first, and lets the timer reset while the developer keeps interacting.
 */
const RELOAD_DEBOUNCE_MS = 600;

interface PanelContentProps {
  autoRefresh: boolean;
  controller: MswPanelController;
  filter: string;
  groupBy: GroupByMode;
  onAutoRefreshChange: (value: boolean) => void;
  onClose?: () => void;
  onCloseSettings: () => void;
  onFilterChange: (value: string) => void;
  onGroupByChange: (value: GroupByMode) => void;
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
  groupBy,
  onAutoRefreshChange,
  onClose,
  onCloseSettings,
  onFilterChange,
  onGroupByChange,
  onOpenSettings,
  showSettings,
  showSync,
  snapshot,
  style,
  theme,
  title,
}: PanelContentProps) {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  // Narrows the list to handlers that have actually served a request (persisted across reloads).
  const [onlyUsed, setOnlyUsed] = useOnlyUsed();
  // Pending debounced auto-refresh reload; null when none is scheduled.
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keeps the handler list scrolled where the developer left it across the auto-refresh reload.
  const listScroll = usePersistentScroll();

  const clearReloadTimer = () => {
    if (reloadTimerRef.current !== null) {
      clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = null;
    }
  };
  // Cancel any pending reload when the panel unmounts.
  useEffect(() => clearReloadTimer, []);

  // (Re)schedule the debounced reload. Each call pushes the reload out by RELOAD_DEBOUNCE_MS, so a
  // flurry of changes — or continued interaction — collapses into a single, well-timed reload rather
  // than reloading on every change and cutting the developer off mid-action.
  const scheduleReload = () => {
    clearReloadTimer();
    reloadTimerRef.current = setTimeout(() => {
      reloadTimerRef.current = null;
      window.location.reload();
    }, RELOAD_DEBOUNCE_MS);
  };

  // After a handler change, schedule the debounced reload (auto-refresh on) or surface the banner.
  const onHandlerChange = () => {
    if (autoRefresh) {
      scheduleReload();
    } else {
      setNeedsRefresh(true);
    }
  };

  // While a reload is pending, typing in the filter pushes it back so the reload never fires mid-edit
  // and clears what's being typed.
  const onFilterInput = (value: string) => {
    onFilterChange(value);
    if (reloadTimerRef.current !== null) {
      scheduleReload();
    }
  };

  const onSetScenario = (id: string, scenarioId: string) => {
    controller.setScenario(id, scenarioId);
    onHandlerChange();
  };

  const onApplyPreset = (presetId: string) => {
    controller.applyPreset(presetId);
    onHandlerChange();
  };

  // Global presets sit in the top selector; feature-scoped ones (with a `tag`) surface in their
  // feature's group header instead.
  const globalPresets = (snapshot.presets ?? []).filter((preset) => !preset.tag);
  const activeGlobalPreset = globalPresets.find((preset) => preset.active)?.id ?? "";

  // applyPreset reaches the controller asynchronously (e.g. across the bridge), so the snapshot lags
  // the click. Hold the picked preset until the live snapshot catches up, so the selector doesn't
  // flash back to "Custom…" (its stale value) before settling on the chosen preset.
  const [optimisticPreset, setOptimisticPreset] = useState<string | null>(null);
  useEffect(() => {
    if (optimisticPreset !== null && activeGlobalPreset === optimisticPreset) {
      setOptimisticPreset(null);
    }
  }, [activeGlobalPreset, optimisticPreset]);
  const presetValue = optimisticPreset ?? activeGlobalPreset;
  const onSelectPreset = (presetId: string) => {
    setOptimisticPreset(presetId);
    onApplyPreset(presetId);
  };

  // The global preset selector lives inline with the Enable/Disable actions (rendered in both the
  // empty and populated layouts), so it's defined once here. Its option label carries the meaning,
  // so no separate "Scenario preset" caption is needed; `aria-label` keeps it accessible.
  const presetSelect =
    globalPresets.length > 0 ? (
      <select
        aria-label="Apply scenario preset"
        data-msw-panel-preset-select
        onChange={(event) => {
          if (event.target.value) {
            onSelectPreset(event.target.value);
          }
        }}
        style={{ ...presetSelectStyle, ...theme.presetSelect }}
        value={presetValue}
      >
        {/* "Custom…" only describes the current (non-preset) state — you can't switch *to* it — so
            offer it as the selected label but drop it once a preset is active. */}
        {presetValue === "" && <option value="">Custom…</option>}
        {globalPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
    ) : null;

  // Enabled count as a fraction of the total, kept compact (no separate disabled/used tokens) so the
  // whole control row — counts, preset selector, and Enable/Disable actions — fits on a single line.
  const totalHandlers = snapshot.activeHandlers + snapshot.disabledHandlers;
  const summaryCounts = (
    <div data-msw-panel-count-group="summary" style={{ ...summaryStyle, ...theme.summary }}>
      <span data-msw-panel-count="enabled">
        {snapshot.activeHandlers}/{totalHandlers} enabled
      </span>
    </div>
  );

  // Reflect what the filter actually matches so the placeholder guides the developer.
  const hasTags = snapshot.handlers.some((handler) => (handler.tags?.length ?? 0) > 0);
  const filterPlaceholder = hasTags
    ? "Filter by path, method, or tag…"
    : "Filter by path or method…";

  // Surfaced under the "Only used" toggle so the used count stays visible without its own row.
  const usedCount = snapshot.handlers.filter((handler) => handler.used).length;

  const normalizedFilter = filter.toLowerCase();
  const filteredHandlers = snapshot.handlers.filter((handler) => {
    if (onlyUsed && !handler.used) {
      return false;
    }
    if (!filter) {
      return true;
    }
    return (
      handler.label.toLowerCase().includes(normalizedFilter) ||
      handler.path?.toLowerCase().includes(normalizedFilter) ||
      handler.method?.toLowerCase().includes(normalizedFilter) ||
      (handler.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedFilter))
    );
  });

  const treeGroupBy = groupBy === "tag" ? "tags" : "path";
  const handlerTree = useHandlerTree(filteredHandlers, treeGroupBy);

  if (showSettings) {
    return (
      <div style={{ ...panelFrameStyle, ...theme.frame, ...style }}>
        <div style={panelChromeFillStyle}>
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
            <div style={headerActionsStyle}>
              <span aria-hidden="true" style={{ ...ghostButtonStyle, visibility: "hidden" }} />
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
              <div style={settingControlStyle}>
                <ToggleSwitch
                  enabled={autoRefresh}
                  label="auto-refresh on change"
                  onToggle={() => onAutoRefreshChange(!autoRefresh)}
                  theme={theme}
                />
              </div>
            </div>
            <div style={settingRowStyle}>
              <div style={settingTextStyle}>
                <strong style={{ ...settingTitleStyle, ...theme.title }}>Group by</strong>
                <span style={{ ...settingDescStyle, ...theme.summary }}>
                  Organize the list as a flat list, a tree by shared path, or by tag.
                </span>
              </div>
              <div style={settingControlStyle}>
                <select
                  aria-label="Group handlers by"
                  data-msw-panel-groupby-select
                  onChange={(event) => onGroupByChange(event.target.value as GroupByMode)}
                  style={{ ...settingSelectStyle, ...theme.scenarioSelect }}
                  value={groupBy}
                >
                  <option value="none">None</option>
                  <option value="path">Path</option>
                  <option value="tag">Tag</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...panelFrameStyle, ...theme.frame, ...style }}>
      {snapshot.handlers.length === 0 ? (
        <div style={panelChromeFillStyle}>
          <div style={panelHeaderStyle}>
            <div style={headerLeftStyle}>
              <div style={logoMarkStyle}>
                <MswLogo size={36} />
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

          <div style={summaryRowStyle}>
            {summaryCounts}
            <div style={summaryActionsStyle}>
              {presetSelect}
              <button
                onClick={() => {
                  controller.setAllEnabled(true);
                  onHandlerChange();
                }}
                style={{ ...compactButtonStyle, ...theme.ghostButton }}
                type="button"
              >
                Enable all
              </button>
              <button
                onClick={() => {
                  controller.setAllEnabled(false);
                  onHandlerChange();
                }}
                style={{ ...compactButtonStyle, ...theme.ghostButton }}
                type="button"
              >
                Disable all
              </button>
              {showSync && (
                <button
                  onClick={() => controller.sync()}
                  style={{ ...compactButtonStyle, ...theme.ghostButton }}
                  type="button"
                >
                  Sync
                </button>
              )}
            </div>
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
        </div>
      ) : (
        <>
          <div style={panelChromeStyle}>
            <div style={panelHeaderStyle}>
              <div style={headerLeftStyle}>
                <div style={logoMarkStyle}>
                  <MswLogo size={36} />
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

            <div style={summaryRowStyle}>
              {summaryCounts}
              <div style={summaryActionsStyle}>
                {presetSelect}
                <button
                  onClick={() => {
                    controller.setAllEnabled(true);
                    onHandlerChange();
                  }}
                  style={{ ...compactButtonStyle, ...theme.ghostButton }}
                  type="button"
                >
                  Enable all
                </button>
                <button
                  onClick={() => {
                    controller.setAllEnabled(false);
                    onHandlerChange();
                  }}
                  style={{ ...compactButtonStyle, ...theme.ghostButton }}
                  type="button"
                >
                  Disable all
                </button>
                {showSync && (
                  <button
                    onClick={() => controller.sync()}
                    style={{ ...compactButtonStyle, ...theme.ghostButton }}
                    type="button"
                  >
                    Sync
                  </button>
                )}
              </div>
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

            <div style={searchRowStyle}>
              <div style={searchWrapStyle}>
                <input
                  aria-label="Filter handlers"
                  onChange={(e) => onFilterInput(e.target.value)}
                  placeholder={filterPlaceholder}
                  role="searchbox"
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
              <label style={{ ...onlyUsedToggleStyle, ...theme.summary }}>
                <input
                  checked={onlyUsed}
                  data-msw-panel-only-used
                  onChange={(event) => setOnlyUsed(event.target.checked)}
                  style={onlyUsedCheckboxStyle}
                  type="checkbox"
                />
                <span style={onlyUsedTextStyle}>
                  <span style={onlyUsedLabelStyle}>Only used</span>
                  <span data-msw-panel-count="used" style={onlyUsedCountStyle}>
                    {usedCount} used
                  </span>
                </span>
              </label>
              {filteredHandlers.length > 0 && groupBy !== "none" ? (
                <HandlerTreeControls theme={theme} tree={handlerTree} />
              ) : null}
            </div>

            {filteredHandlers.length === 0 ? (
              <p style={{ ...noResultsStyle, ...theme.noResults }}>
                {filter
                  ? `No handlers match “${filter}”`
                  : "No handlers have served a request yet."}
              </p>
            ) : null}
          </div>

          {filteredHandlers.length > 0 &&
            (groupBy !== "none" ? (
              <HandlerTreeList
                groupBy={treeGroupBy}
                handlers={filteredHandlers}
                listRef={listScroll.ref}
                onApplyPreset={onApplyPreset}
                onListScroll={listScroll.onScroll}
                onSetScenario={onSetScenario}
                onToggleHandler={(id) => {
                  controller.toggle(id);
                  onHandlerChange();
                }}
                presets={snapshot.presets ?? []}
                theme={theme}
                tree={handlerTree}
              />
            ) : (
              <ul
                onScroll={listScroll.onScroll}
                ref={listScroll.ref}
                style={{ ...listStyle, ...theme.list }}
              >
                {filteredHandlers.map((handler, index) => (
                  <HandlerRow
                    handler={handler}
                    isLast={index === filteredHandlers.length - 1}
                    key={handler.id}
                    onSetScenario={(scenarioId) => onSetScenario(handler.id, scenarioId)}
                    onToggle={() => {
                      controller.toggle(handler.id);
                      onHandlerChange();
                    }}
                    theme={theme}
                  />
                ))}
              </ul>
            ))}
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
