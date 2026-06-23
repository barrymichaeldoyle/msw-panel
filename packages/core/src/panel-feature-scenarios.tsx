import { useEffect, useState } from "react";

import type { MswPanelHandlerSnapshot, MswPanelPresetSnapshot } from "./index.js";
import type { PanelThemeStyles } from "./panel-theme.js";
import { featureScenarioSelectStyle } from "./panel-styles.js";

interface FeatureScenarioControlProps {
  /** Handlers belonging to this feature group. */
  handlers: MswPanelHandlerSnapshot[];
  onApplyPreset: (presetId: string) => void;
  onSetScenario: (id: string, scenarioId: string) => void;
  /** All scenario presets; the control surfaces the ones scoped to this `tag`. */
  presets: MswPanelPresetSnapshot[];
  /** The feature tag this group represents. */
  tag: string;
  theme: PanelThemeStyles;
}

const PRESET_PREFIX = "preset:";
const SCENARIO_PREFIX = "scenario:";

/** Scenario ids shared by every scenario-bearing handler in the list (empty when fewer than two). */
function commonScenarioIds(handlers: MswPanelHandlerSnapshot[]): string[] {
  const withScenarios = handlers.filter((handler) => (handler.scenarios?.length ?? 0) > 0);
  if (withScenarios.length < 2) return [];

  let shared: string[] | null = null;
  for (const handler of withScenarios) {
    const ids = (handler.scenarios ?? []).map((scenario) => scenario.id);
    shared = shared === null ? ids : shared.filter((id) => ids.includes(id));
  }
  return shared ?? [];
}

/**
 * A compact selector in a feature group header that drives the whole feature's scenario state.
 *
 * It combines two sources, either of which may be empty:
 * - **Feature presets** — presets declared with `definePreset(..., { tag })` matching this tag.
 * - **Common scenarios** — scenario ids shared by every scenario-bearing handler in the group,
 *   so "Set all → error" fans out to each one (no authoring required).
 *
 * Renders nothing when there is neither a feature preset nor a shared scenario to offer.
 */
export function FeatureScenarioControl({
  handlers,
  onApplyPreset,
  onSetScenario,
  presets,
  tag,
  theme,
}: FeatureScenarioControlProps) {
  const featurePresets = presets.filter((preset) => preset.tag === tag);
  const sharedScenarioIds = commonScenarioIds(handlers);

  if (featurePresets.length === 0 && sharedScenarioIds.length === 0) {
    return null;
  }

  const scenarioHandlers = handlers.filter((handler) => (handler.scenarios?.length ?? 0) > 0);
  // The group reads as a single scenario only when every scenario-bearing handler agrees on it.
  const firstActive = scenarioHandlers[0]?.activeScenario;
  const uniformScenario =
    scenarioHandlers.length > 0 &&
    scenarioHandlers.every((handler) => handler.activeScenario === firstActive)
      ? firstActive
      : undefined;

  const activePreset = featurePresets.find((preset) => preset.active);
  const derivedValue = activePreset
    ? `${PRESET_PREFIX}${activePreset.id}`
    : uniformScenario && sharedScenarioIds.includes(uniformScenario)
      ? `${SCENARIO_PREFIX}${uniformScenario}`
      : "";

  // Commands reach the controller asynchronously (e.g. across the bridge), and "Set all to" fans out
  // one command per handler, so the group is momentarily mixed mid-flight. Hold the picked value until
  // the live snapshot catches up, so the label doesn't flash back to "Mixed…" before settling.
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
  useEffect(() => {
    if (optimisticValue !== null && derivedValue === optimisticValue) {
      setOptimisticValue(null);
    }
  }, [derivedValue, optimisticValue]);
  const value = optimisticValue ?? derivedValue;

  const onChange = (raw: string) => {
    if (raw.startsWith(PRESET_PREFIX)) {
      setOptimisticValue(raw);
      onApplyPreset(raw.slice(PRESET_PREFIX.length));
    } else if (raw.startsWith(SCENARIO_PREFIX)) {
      setOptimisticValue(raw);
      const scenarioId = raw.slice(SCENARIO_PREFIX.length);
      for (const handler of scenarioHandlers) {
        if ((handler.scenarios ?? []).some((scenario) => scenario.id === scenarioId)) {
          onSetScenario(handler.id, scenarioId);
        }
      }
    }
  };

  return (
    <select
      aria-label={`Scenario state for ${tag}`}
      data-msw-panel-feature-scenario={tag}
      onChange={(event) => onChange(event.target.value)}
      style={{ ...featureScenarioSelectStyle, ...theme.scenarioSelect }}
      value={value}
    >
      {/* "Mixed…" only labels the current mixed/custom state — it isn't a real choice you can switch
          to — so show it as the selected label but drop it once the group reads as a single state. */}
      {value === "" && <option value="">Mixed…</option>}
      {featurePresets.length > 0 && (
        <optgroup label="Presets">
          {featurePresets.map((preset) => (
            <option key={preset.id} value={`${PRESET_PREFIX}${preset.id}`}>
              {preset.label}
            </option>
          ))}
        </optgroup>
      )}
      {sharedScenarioIds.length > 0 && (
        <optgroup label="Set all to">
          {sharedScenarioIds.map((scenarioId) => (
            <option key={scenarioId} value={`${SCENARIO_PREFIX}${scenarioId}`}>
              {scenarioId}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
