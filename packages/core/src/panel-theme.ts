import type { CSSProperties } from "react";

/** Built-in visual theme for the panel. */
export type PanelTheme = "dark" | "light";

export interface PanelThemeStyles {
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
  refreshBanner: CSSProperties;
  refreshButton: CSSProperties;
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

export const panelThemes: Record<PanelTheme, PanelThemeStyles> = {
  dark: {
    actionButton: {
      background: "#ff6a33",
      border: "1px solid #ff6a33",
      color: "#ffffff",
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
    refreshBanner: {
      background: "#1e1505",
      border: "1px solid #7a5200",
      color: "#f5c842",
    },
    refreshButton: {
      background: "#f5c842",
      color: "#1a1000",
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
    refreshBanner: {
      background: "#fffbeb",
      border: "1px solid #fcd34d",
      color: "#92400e",
    },
    refreshButton: {
      background: "#92400e",
      color: "#fffbeb",
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
