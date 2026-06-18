import { useCallback, useEffect, useState } from "react";

/** localStorage key holding the developer's per-browser panel UI preferences. */
const SETTINGS_STORAGE_KEY = "msw-panel:settings";

/** Per-browser panel state and preferences persisted across reloads. */
interface PanelSettings {
  /** Reload the page whenever a handler is enabled or disabled. */
  autoRefresh?: boolean;
  /** Present handlers as a tree grouped by shared path segments. */
  grouped?: boolean;
  /** Last open/closed state of the floating panel (only persisted when `persistOpen` is set). */
  open?: boolean;
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
 * saved per-browser choice (if any) after mount so a stored value wins without risking a hydration
 * mismatch. The returned setter persists the developer's choice.
 */
function useBooleanSetting(
  key: keyof PanelSettings,
  defaultValue: boolean,
): readonly [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
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

/** Resolves the "Group handlers by path" setting (codebase default, overridden by stored choice). */
export function useGrouped(defaultGrouped: boolean): readonly [boolean, (value: boolean) => void] {
  return useBooleanSetting("grouped", defaultGrouped);
}

/**
 * Tracks the floating panel's open/closed state. When `persistOpen` is set, the last state is
 * restored from storage after mount (overriding `defaultOpen`) and saved on every change, so a
 * page refresh — including the auto-refresh reload — keeps the panel where the developer left it.
 * When `persistOpen` is false this is plain in-memory state seeded from `defaultOpen`.
 */
export function usePanelOpen(
  defaultOpen: boolean,
  persistOpen: boolean,
): readonly [boolean, (value: boolean) => void] {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
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
