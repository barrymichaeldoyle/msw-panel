import type { MswPanelHandlerSnapshot } from "./index.js";
import type { PanelThemeStyles } from "./panel-theme.js";
import {
  kindBadgeStyle,
  methodBadgeStyle,
  pathStyle,
  rowContentStyle,
  rowControlsStyle,
  rowHeaderStyle,
  rowMetaStyle,
  rowStyle,
  scenarioSelectStyle,
  tagChipStyle,
  toggleThumbStyle,
  toggleTrackBase,
  usageMetaStyle,
} from "./panel-styles.js";

interface HandlerRowProps {
  handler: MswPanelHandlerSnapshot;
  isLast?: boolean;
  onSetScenario?: (scenarioId: string) => void;
  onToggle: () => void;
  theme: PanelThemeStyles;
}

export function HandlerRow({ handler, isLast, onSetScenario, onToggle, theme }: HandlerRowProps) {
  const badge = handler.method ? (
    <span style={{ ...methodBadgeStyle, ...theme.methodBadge }}>
      {handler.method === "*" ? "ANY" : handler.method}
    </span>
  ) : (
    <span style={{ ...kindBadgeStyle, ...theme.kindBadge }}>{handler.kind}</span>
  );
  const label = handler.path ?? handler.label;
  const usageLabel = handler.used ? "used" : "idle";
  const hasScenarios = handler.scenarios && handler.scenarios.length > 0;

  return (
    <li
      data-handler-id={handler.id}
      data-handler-method={handler.method ?? undefined}
      data-handler-path={handler.path ?? undefined}
      style={{
        ...rowStyle,
        ...(isLast ? null : theme.rowBorder),
        ...(handler.used ? null : theme.rowUnused),
      }}
    >
      <div style={rowHeaderStyle}>
        <div style={rowMetaStyle}>
          {badge}
          <span style={{ ...usageMetaStyle, ...theme.usageMeta }}>{usageLabel}</span>
          {(handler.tags ?? []).map((tag) => (
            <span data-handler-tag={tag} key={tag} style={{ ...tagChipStyle, ...theme.tagChip }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={rowControlsStyle}>
          {hasScenarios ? (
            <select
              aria-label={`Scenario for ${label}`}
              data-handler-scenario={handler.id}
              onChange={(event) => onSetScenario?.(event.target.value)}
              style={{ ...scenarioSelectStyle, ...theme.scenarioSelect }}
              value={handler.activeScenario}
            >
              {handler.scenarios?.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
          ) : null}
          <ToggleSwitch enabled={handler.enabled} label={label} onToggle={onToggle} theme={theme} />
        </div>
      </div>
      <div style={rowContentStyle}>
        <span style={{ ...pathStyle, ...(handler.used ? theme.pathUsed : theme.pathUnused) }}>
          {label}
        </span>
      </div>
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
