import type { MswPanelHandlerSnapshot } from "./index.js";
import type { PanelThemeStyles } from "./panel-theme.js";
import {
  kindBadgeStyle,
  methodBadgeStyle,
  pathStyle,
  rowContentStyle,
  rowMainStyle,
  rowMetaStyle,
  rowStyle,
  toggleThumbStyle,
  toggleTrackBase,
  usageMetaStyle,
} from "./panel-styles.js";

interface HandlerRowProps {
  handler: MswPanelHandlerSnapshot;
  onToggle: () => void;
  theme: PanelThemeStyles;
}

export function HandlerRow({ handler, onToggle, theme }: HandlerRowProps) {
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
      <ToggleSwitch enabled={handler.enabled} label={label} onToggle={onToggle} theme={theme} />
    </li>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  label: string;
  onToggle: () => void;
  theme: PanelThemeStyles;
}

export function ToggleSwitch({ enabled, label, onToggle, theme }: ToggleSwitchProps) {
  return (
    <button
      aria-checked={enabled}
      aria-label={`Toggle ${label}`}
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
