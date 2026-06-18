import { useCallback, useEffect, useState } from "react";

/** localStorage key holding the developer's per-browser panel UI preferences. */
const SETTINGS_STORAGE_KEY = "msw-panel:settings";

/** Per-browser panel preferences a developer can change from the Settings view. */
interface PanelSettings {
  /** Reload the page whenever a handler is enabled or disabled. */
  autoRefresh?: boolean;
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
 * Resolves the auto-refresh setting. Starts from the codebase default, then applies the developer's
 * saved per-browser choice (if any) after mount so a stored value wins without risking a hydration
 * mismatch. The returned setter persists the developer's choice.
 */
export function useAutoRefresh(
  defaultAutoRefresh: boolean,
): readonly [boolean, (value: boolean) => void] {
  const [autoRefresh, setAutoRefresh] = useState(defaultAutoRefresh);

  useEffect(() => {
    const stored = readStoredSettings().autoRefresh;
    if (typeof stored === "boolean") {
      setAutoRefresh(stored);
    }
  }, []);

  const update = useCallback((value: boolean) => {
    setAutoRefresh(value);
    writeStoredSettings({ ...readStoredSettings(), autoRefresh: value });
  }, []);

  return [autoRefresh, update];
}
