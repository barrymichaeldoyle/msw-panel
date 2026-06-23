import type { CSSProperties } from "react";

export const panelFrameStyle: CSSProperties = {
  borderRadius: "0.75rem",
  display: "flex",
  flexDirection: "column",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "0.875rem",
  height: "30rem",
  overflow: "hidden",
  pointerEvents: "auto",
  width: "100%",
};

// Padded chrome for header, controls, and search — the handler list sits outside as a sibling.
export const panelChromeStyle: CSSProperties = {
  flexShrink: 0,
  padding: "0.5rem",
};

// Same padding as panelChromeStyle but grows to fill the frame (empty state, settings).
export const panelChromeFillStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  padding: "0.5rem",
};

export const panelHeaderStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "1rem",
  justifyContent: "space-between",
};

export const headerLeftStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "0.5rem",
};

export const headerActionsStyle: CSSProperties = {
  alignItems: "center",
  alignSelf: "flex-start",
  display: "flex",
  flexShrink: 0,
  gap: "0.5rem",
};

export const settingsBodyStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "0.75rem",
  marginTop: "0.75rem",
  minHeight: 0,
  overflowY: "auto",
};

export const settingRowStyle: CSSProperties = {
  display: "flex",
  gap: "1rem",
};

export const settingTextStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "0.2rem",
  minWidth: 0,
};

export const settingControlStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  justifyContent: "flex-end",
  width: "5rem",
};

export const settingTitleStyle: CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
};

export const settingDescStyle: CSSProperties = {
  fontSize: "0.78rem",
  lineHeight: 1.4,
};

export const logoMarkStyle: CSSProperties = {
  alignItems: "center",
  background: "#000000",
  borderRadius: "0.5rem",
  // The MSW mark keeps its own dark background per their brand guidelines, so on
  // a dark panel it blends in. A faint ring defines the tile against the
  // surrounding chrome on both light and dark themes.
  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.14)",
  display: "flex",
  flexShrink: 0,
  height: "2.25rem",
  justifyContent: "center",
  lineHeight: 0,
  width: "2.25rem",
};

export const eyebrowStyle: CSSProperties = {
  color: "#8b93a7",
  fontSize: "0.65rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const titleStyle: CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
};

export const summaryRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem 0.75rem",
  justifyContent: "space-between",
  marginTop: "0.75rem",
};

export const summaryStyle: CSSProperties = {
  display: "flex",
  fontVariantNumeric: "tabular-nums",
  fontSize: "0.8rem",
  gap: "0.75rem",
};

export const summaryActionsStyle: CSSProperties = {
  display: "flex",
  flexShrink: 0,
  gap: "0.35rem",
};

export const refreshBannerStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: "0.5rem",
  display: "flex",
  fontSize: "0.8rem",
  gap: "0.75rem",
  justifyContent: "space-between",
  marginTop: "0.75rem",
  padding: "0.5rem 0.75rem",
};

export const refreshButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.375rem",
  cursor: "pointer",
  flexShrink: 0,
  font: "inherit",
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "0.3rem 0.625rem",
};

export const searchRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  gap: "0.75rem",
  marginTop: "0.75rem",
};

export const searchWrapStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minWidth: 0,
  position: "relative",
};

export const searchInputStyle: CSSProperties = {
  borderRadius: "0.5rem",
  font: "inherit",
  fontSize: "0.8rem",
  outline: "none",
  padding: "0.45rem 2rem 0.45rem 0.625rem",
  width: "100%",
};

export const searchClearStyle: CSSProperties = {
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

export const noResultsStyle: CSSProperties = {
  fontSize: "0.8rem",
  margin: "1rem 0 0",
  textAlign: "center",
};

// Full-width scroll area; row padding keeps handler content aligned with the chrome above.
export const listStyle: CSSProperties = {
  flex: 1,
  listStyle: "none",
  margin: 0,
  minHeight: 0,
  overflowY: "auto",
  padding: 0,
};

export const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  padding: "0.55rem 0.5rem",
};

export const rowHeaderStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "0.5rem",
  justifyContent: "space-between",
  minWidth: 0,
  width: "100%",
};

export const treeSubListStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  paddingInlineStart: "0.75rem",
  paddingInlineEnd: "0.25rem",
};

export const treeControlsStyle: CSSProperties = {
  display: "flex",
  flexShrink: 0,
  gap: "0.75rem",
};

// "Only used" filter toggle in the search row: one <label> wraps the checkbox and a stacked text
// label + live used-count, so clicking either line toggles it and the checkbox stays vertically
// centered against the two-line stack.
export const onlyUsedToggleStyle: CSSProperties = {
  alignItems: "center",
  cursor: "pointer",
  display: "flex",
  flexShrink: 0,
  gap: "0.35rem",
  userSelect: "none",
};

export const onlyUsedTextStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.1,
};

export const onlyUsedLabelStyle: CSSProperties = {
  fontSize: "0.72rem",
  whiteSpace: "nowrap",
};

export const onlyUsedCountStyle: CSSProperties = {
  fontSize: "0.66rem",
  fontVariantNumeric: "tabular-nums",
  opacity: 0.7,
  whiteSpace: "nowrap",
};

export const onlyUsedCheckboxStyle: CSSProperties = {
  cursor: "pointer",
  flexShrink: 0,
  margin: 0,
};

export const treeControlButtonStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.72rem",
  // Sized to fit the longer "Collapse all" label and right-aligned, so toggling between the two
  // labels doesn't change the button's width and shift the rest of the search row.
  minWidth: "4.5rem",
  padding: "0.1rem 0.2rem",
  textAlign: "right",
  textDecoration: "underline",
};

export const groupRowStyle: CSSProperties = {
  alignItems: "center",
  background: "transparent",
  border: 0,
  color: "inherit",
  cursor: "pointer",
  display: "flex",
  font: "inherit",
  gap: "0.4rem",
  padding: "0.5rem 0.5rem",
  textAlign: "left",
  width: "100%",
};

export const groupLabelStyle: CSSProperties = {
  flex: 1,
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.75rem",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const groupCountStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: "0.65rem",
  fontVariantNumeric: "tabular-nums",
};

export const rowMetaStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  flexWrap: "wrap",
  gap: "0.4rem",
  minWidth: 0,
};

export const rowContentStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minWidth: 0,
};

export const rowControlsStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  gap: "0.5rem",
};

export const usageMetaStyle: CSSProperties = {
  borderRadius: "999px",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.65rem",
  letterSpacing: "0.04em",
  padding: "0.1rem 0.35rem",
  textTransform: "uppercase",
};

export const kindBadgeStyle: CSSProperties = {
  borderRadius: "0.28rem",
  flexShrink: 0,
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.6rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  padding: "0.14em 0.42em",
  textTransform: "uppercase",
};

export const methodBadgeStyle: CSSProperties = {
  borderRadius: "0.28rem",
  flexShrink: 0,
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.6rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  padding: "0.14em 0.42em",
  textTransform: "uppercase",
};

export const pathStyle: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.75rem",
  lineHeight: 1.45,
  minWidth: 0,
  overflowWrap: "anywhere",
  whiteSpace: "normal",
};

export const tagChipStyle: CSSProperties = {
  borderRadius: "999px",
  flexShrink: 0,
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.6rem",
  letterSpacing: "0.02em",
  padding: "0.1rem 0.4rem",
};

export const scenarioSelectStyle: CSSProperties = {
  borderRadius: "0.4rem",
  cursor: "pointer",
  flexShrink: 0,
  font: "inherit",
  fontSize: "0.72rem",
  maxWidth: "10rem",
  outline: "none",
  padding: "0.2rem 0.4rem",
};

// Group header laid out as a row so the feature scenario selector can sit beside the toggle.
// Background matches the panel frame — applied via theme.groupHeader at render time.
export const groupHeaderRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "0.5rem",
  paddingInlineEnd: "1.25rem",
};

// Compact selector shown in a feature group header to drive the whole feature's scenario state.
export const featureScenarioSelectStyle: CSSProperties = {
  borderRadius: "0.4rem",
  cursor: "pointer",
  flexShrink: 0,
  font: "inherit",
  fontSize: "0.68rem",
  maxWidth: "11rem",
  outline: "none",
  padding: "0.15rem 0.3rem",
};

export const presetSelectStyle: CSSProperties = {
  borderRadius: "0.4rem",
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.75rem",
  outline: "none",
  padding: "0.25rem 0.4rem",
};

// Header icon buttons (gear, close, back) — fixed equal-sized squares so they line up.
export const ghostButtonStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: "0.5rem",
  cursor: "pointer",
  display: "inline-flex",
  flexShrink: 0,
  font: "inherit",
  fontSize: "0.85rem",
  height: "1.9rem",
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
  width: "1.9rem",
};

// Compact text buttons used for the inline "Enable all" / "Disable all" / "Sync" actions.
export const compactButtonStyle: CSSProperties = {
  borderRadius: "0.45rem",
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.72rem",
  padding: "0.25rem 0.5rem",
  whiteSpace: "nowrap",
};

export const settingSelectStyle: CSSProperties = {
  borderRadius: "0.4rem",
  cursor: "pointer",
  flexShrink: 0,
  font: "inherit",
  fontSize: "0.78rem",
  outline: "none",
  padding: "0.25rem 0.4rem",
};

export const triggerButtonStyle: CSSProperties = {
  alignItems: "center",
  border: 0,
  // Rounded square echoing the MSW logo tile rather than a circle, so the
  // launcher reads as the MSW mark. Radius matches the logo's own corners.
  borderRadius: "0.6rem",
  cursor: "pointer",
  display: "flex",
  height: "3.25rem",
  justifyContent: "center",
  lineHeight: 0,
  padding: 0,
  pointerEvents: "auto",
  position: "relative",
  width: "3.25rem",
};

export const triggerBadgeStyle: CSSProperties = {
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

export const toggleTrackBase: CSSProperties = {
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

export const toggleThumbStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "50%",
  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
  height: "1.125rem",
  position: "absolute",
  top: "0.1875rem",
  transition: "left 180ms ease",
  width: "1.125rem",
};

export const emptyStateStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "0.4rem",
  justifyContent: "center",
  textAlign: "center",
};

export const emptyIconStyle: CSSProperties = {
  marginBottom: "0.25rem",
};

export const emptyTitleStyle: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  margin: 0,
};

export const emptyBodyStyle: CSSProperties = {
  fontSize: "0.78rem",
  lineHeight: 1.5,
  margin: 0,
};

export const inlineCodeStyle: CSSProperties = {
  borderRadius: "0.25rem",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.72rem",
  padding: "0.1em 0.35em",
};
