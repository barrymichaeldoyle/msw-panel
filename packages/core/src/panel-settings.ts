import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** localStorage key holding the developer's per-browser panel UI preferences. */
const SETTINGS_STORAGE_KEY = "msw-panel:settings";

/**
 * sessionStorage key holding the handler list's last scroll offset. Scroll position is transient and
 * tab-scoped — it should survive a reload (including the auto-refresh reload) but not linger across a
 * fresh session — so it lives in sessionStorage, separate from the persisted UI preferences above.
 */
const SCROLL_STORAGE_KEY = "msw-panel:scroll";

/**
 * Applies persisted state *before* the browser paints, so the panel doesn't visibly flash its
 * codebase default (closed, ungrouped, all collapsed) for a frame after a reload before snapping to
 * the developer's saved state. The first render still uses the default — matching server output —
 * so there's no hydration mismatch; we just catch up synchronously before paint instead of after.
 * Layout effects don't run during SSR, so fall back to a passive effect when there is no DOM.
 */
const useRestoreEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** How the handler list is organized. */
export type GroupByMode = "none" | "path" | "tag";

/** Per-browser panel state and preferences persisted across reloads. */
interface PanelSettings {
  /** Reload the page whenever a handler is enabled or disabled. */
  autoRefresh?: boolean;
  /** Stable keys of the handler groups the developer has expanded. */
  expandedGroups?: string[];
  /** Current text in the handler filter box. */
  filter?: string;
  /** How handlers are grouped: flat list, by path, or by tag. */
  groupBy?: GroupByMode;
  /** Last open/closed state of the floating panel (only persisted when `persistOpen` is set). */
  open?: boolean;
  /** Whether the list is narrowed to handlers that have served a request. */
  onlyUsed?: boolean;
}

function readStoredSettings(): PanelSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PanelSettings) : {};
  } catch {
    return {};
  }
}

function writeStoredSettings(next: PanelSettings): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota/security errors — the preference just won't persist.
  }
}

/**
 * Resolves a boolean panel setting. Starts from the codebase default, then applies the developer's
 * saved per-browser choice (if any) via {@link useRestoreEffect} so a stored value wins before paint
 * without risking a hydration mismatch. The returned setter persists the developer's choice.
 */
function useBooleanSetting(
  key: keyof PanelSettings,
  defaultValue: boolean,
): readonly [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(defaultValue);

  useRestoreEffect(() => {
    const stored = readStoredSettings()[key];
    if (typeof stored === "boolean") {
      setValue(stored);
    }
  }, [key]);

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      writeStoredSettings({ ...readStoredSettings(), [key]: next });
    },
    [key],
  );

  return [value, update];
}

/** Resolves the "Auto-refresh on change" setting (codebase default, overridden by stored choice). */
export function useAutoRefresh(
  defaultAutoRefresh: boolean,
): readonly [boolean, (value: boolean) => void] {
  return useBooleanSetting("autoRefresh", defaultAutoRefresh);
}

/** Resolves the "Only used" filter toggle, restored from the developer's stored choice after a reload. */
export function useOnlyUsed(): readonly [boolean, (value: boolean) => void] {
  return useBooleanSetting("onlyUsed", false);
}

/**
 * Resolves the handler filter text. Starts empty, then applies the developer's stored value before
 * paint so an active filter survives a reload — including the auto-refresh reload — without flashing
 * the full list first. The returned setter persists each keystroke.
 */
export function useFilter(): readonly [string, (value: string) => void] {
  const [value, setValue] = useState("");

  useRestoreEffect(() => {
    const stored = readStoredSettings().filter;
    if (typeof stored === "string") {
      setValue(stored);
    }
  }, []);

  const update = useCallback((next: string) => {
    setValue(next);
    writeStoredSettings({ ...readStoredSettings(), filter: next });
  }, []);

  return [value, update];
}

/**
 * Resolves the "Group by" setting. Starts from the codebase default, then applies the developer's
 * stored per-browser choice before paint so a saved value wins without a hydration mismatch.
 */
export function useGroupBy(
  defaultMode: GroupByMode,
): readonly [GroupByMode, (value: GroupByMode) => void] {
  const [value, setValue] = useState(defaultMode);

  useRestoreEffect(() => {
    const stored = readStoredSettings().groupBy;
    if (stored === "none" || stored === "path" || stored === "tag") {
      setValue(stored);
    }
  }, []);

  const update = useCallback((next: GroupByMode) => {
    setValue(next);
    writeStoredSettings({ ...readStoredSettings(), groupBy: next });
  }, []);

  return [value, update];
}

/**
 * Resolves the set of expanded handler-group keys. Starts empty (every group collapsed), then
 * applies the developer's stored per-browser choice before paint so the tree reopens to where it was
 * left after a reload — including the auto-refresh reload. The returned setter persists each change.
 */
export function useExpandedGroups(): readonly [Set<string>, (next: Set<string>) => void] {
  const [keys, setKeys] = useState<Set<string>>(() => new Set());

  useRestoreEffect(() => {
    const stored = readStoredSettings().expandedGroups;
    if (Array.isArray(stored)) {
      setKeys(new Set(stored));
    }
  }, []);

  const update = useCallback((next: Set<string>) => {
    setKeys(next);
    writeStoredSettings({ ...readStoredSettings(), expandedGroups: [...next] });
  }, []);

  return [keys, update];
}

/**
 * Tracks the floating panel's open/closed state. When `persistOpen` is set, the last state is
 * restored from storage before paint (overriding `defaultOpen`) and saved on every change, so a
 * page refresh — including the auto-refresh reload — keeps the panel where the developer left it
 * without flashing closed first. When `persistOpen` is false this is plain in-memory state seeded
 * from `defaultOpen`.
 */
export function usePanelOpen(
  defaultOpen: boolean,
  persistOpen: boolean,
): readonly [boolean, (value: boolean) => void] {
  const [open, setOpen] = useState(defaultOpen);

  useRestoreEffect(() => {
    if (!persistOpen) {
      return;
    }
    const stored = readStoredSettings().open;
    if (typeof stored === "boolean") {
      setOpen(stored);
    }
  }, [persistOpen]);

  const update = useCallback(
    (value: boolean) => {
      setOpen(value);
      if (persistOpen) {
        writeStoredSettings({ ...readStoredSettings(), open: value });
      }
    },
    [persistOpen],
  );

  return [open, update];
}

function readStoredScroll(): number {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return 0;
  }
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeStoredScroll(top: number): void {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }
  try {
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, String(Math.max(0, Math.round(top))));
  } catch {
    // Ignore quota/security errors — the scroll position just won't be restored.
  }
}

/**
 * Remembers the handler list's scroll offset across reloads, so toggling a value far down the list
 * doesn't bounce you back to the top after the auto-refresh reload. Returns a `ref` for the scroll
 * container and an `onScroll` handler that records new positions.
 *
 * Restore re-applies the saved offset on every commit until the first paint. That matters because the
 * persisted expanded groups are themselves restored before paint (growing the list over an extra
 * render), so re-applying each commit lands the scroll at the right place once the list reaches its
 * final height — all before anything is shown, so there's no visible jump.
 */
export function usePersistentScroll(): {
  ref: RefObject<HTMLUListElement | null>;
  onScroll: () => void;
} {
  const ref = useRef<HTMLUListElement | null>(null);
  const target = useRef(readStoredScroll());
  // True until the first paint: while restoring we drive scrollTop and ignore scroll events (setting
  // scrollTop emits them); afterwards the developer is in control and we record where they land.
  const restoring = useRef(true);
  const saveQueued = useRef(false);

  useRestoreEffect(() => {
    if (!restoring.current) {
      return;
    }
    if (ref.current) {
      ref.current.scrollTop = target.current;
    }
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      restoring.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const onScroll = useCallback(() => {
    if (restoring.current || saveQueued.current || !ref.current) {
      return;
    }
    const element = ref.current;
    saveQueued.current = true;
    // Coalesce the rapid scroll stream into at most one write per frame.
    requestAnimationFrame(() => {
      saveQueued.current = false;
      writeStoredScroll(element.scrollTop);
    });
  }, []);

  return { ref, onScroll };
}
