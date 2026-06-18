import type { CSSProperties } from "react";

export const panelFrameStyle: CSSProperties = {
  borderRadius: "0.75rem",
  display: "flex",
  flexDirection: "column",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "0.875rem",
  height: "30rem",
  padding: "1rem",
  pointerEvents: "auto",
  width: "100%",
};

export const contentAreaStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  marginTop: "0.75rem",
  minHeight: 0,
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
  alignItems: "flex-start",
  display: "flex",
  gap: "1rem",
  justifyContent: "space-between",
};

export const settingTextStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  minWidth: 0,
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
  background: "#ff6a33",
  borderRadius: "0.375rem",
  color: "#fff",
  display: "flex",
  flexShrink: 0,
  height: "2.25rem",
  justifyContent: "center",
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

export const summaryStyle: CSSProperties = {
  display: "flex",
  fontVariantNumeric: "tabular-nums",
  fontSize: "0.8rem",
  gap: "0.75rem",
  marginTop: "0.75rem",
};

export const toolbarStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  marginTop: "0.75rem",
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

export const searchWrapStyle: CSSProperties = {
  display: "flex",
  flexShrink: 0,
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

export const listStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "0.75rem",
  flex: 1,
  listStyle: "none",
  margin: "0.75rem 0 0",
  minHeight: 0,
  overflowY: "auto",
  padding: 0,
};

export const rowStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  gap: "0.75rem",
  justifyContent: "space-between",
  padding: "0.6rem 0.75rem",
};

export const treeSubListStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  paddingLeft: "0.75rem",
};

export const treeControlsStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexShrink: 0,
  justifyContent: "flex-end",
  margin: "0.75rem 0 0",
};

export const treeControlButtonStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.72rem",
  padding: "0.1rem 0.2rem",
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
  padding: "0.5rem 0.75rem",
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

export const rowMainStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "0.35rem",
  minWidth: 0,
};

export const rowMetaStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  minWidth: 0,
};

export const rowContentStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minWidth: 0,
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

const sharedButtonStyle: CSSProperties = {
  borderRadius: "0.5rem",
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.75rem",
};

export const ghostButtonStyle: CSSProperties = {
  ...sharedButtonStyle,
  padding: "0.35rem 0.6rem",
};

export const actionButtonStyle: CSSProperties = {
  ...sharedButtonStyle,
  padding: "0.35rem 0.6rem",
};

export const triggerButtonStyle: CSSProperties = {
  alignItems: "center",
  border: 0,
  borderRadius: "50%",
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
  padding: "1rem",
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
