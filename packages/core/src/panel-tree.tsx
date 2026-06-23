import { useMemo } from "react";
import type { Ref } from "react";

import type { MswPanelHandlerSnapshot, MswPanelPresetSnapshot } from "./index.js";
import { groupHandlers, groupHandlersByTag, type HandlerGroupNode } from "./panel-grouping.js";
import { useExpandedGroups } from "./panel-settings.js";
import { FeatureScenarioControl } from "./panel-feature-scenarios.js";
import { HandlerRow } from "./panel-handlers.js";
import { ChevronIcon } from "./panel-icons.js";
import type { PanelThemeStyles } from "./panel-theme.js";
import {
  groupCountStyle,
  groupHeaderRowStyle,
  groupLabelStyle,
  groupRowStyle,
  listStyle,
  treeControlButtonStyle,
  treeControlsStyle,
  treeSubListStyle,
} from "./panel-styles.js";

function countHandlers(node: HandlerGroupNode): number {
  return node.handlers.length + node.children.reduce((sum, child) => sum + countHandlers(child), 0);
}

function collectKeys(nodes: HandlerGroupNode[]): string[] {
  return nodes.flatMap((node) => [node.key, ...collectKeys(node.children)]);
}

interface HandlerTreeViewProps {
  handlers: MswPanelHandlerSnapshot[];
  /** Group by shared path segments (`"path"`) or by feature tag (`"tags"`). */
  groupBy: "path" | "tags";
  onApplyPreset: (presetId: string) => void;
  onSetScenario: (id: string, scenarioId: string) => void;
  onToggleHandler: (id: string) => void;
  /** Scenario presets, used to surface feature-scoped presets in tag group headers. */
  presets: MswPanelPresetSnapshot[];
  theme: PanelThemeStyles;
}

export interface HandlerTreeState {
  collapseAll: () => void;
  expandAll: () => void;
  expandedKeys: Set<string>;
  groupBy: "path" | "tags";
  groups: ReturnType<typeof groupHandlers>;
  toggleGroup: (key: string) => void;
}

export function useHandlerTree(
  handlers: MswPanelHandlerSnapshot[],
  groupBy: "path" | "tags",
): HandlerTreeState {
  const groups = useMemo(
    () => (groupBy === "tags" ? groupHandlersByTag(handlers) : groupHandlers(handlers)),
    [groupBy, handlers],
  );
  const [expandedKeys, setExpandedKeys] = useExpandedGroups();

  const toggleGroup = (key: string) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedKeys(next);
  };

  return {
    collapseAll: () => setExpandedKeys(new Set()),
    expandAll: () => setExpandedKeys(new Set(collectKeys(groups.roots))),
    expandedKeys,
    groupBy,
    groups,
    toggleGroup,
  };
}

interface HandlerTreeControlsProps {
  theme: PanelThemeStyles;
  tree: HandlerTreeState;
}

export function HandlerTreeControls({ theme, tree }: HandlerTreeControlsProps) {
  if (tree.groups.roots.length === 0) {
    return null;
  }

  // One toggle rather than two buttons: when everything is already open, offer "Collapse all";
  // otherwise offer "Expand all" (which also opens the rest from a partially-expanded state).
  const allKeys = collectKeys(tree.groups.roots);
  const allExpanded = allKeys.every((key) => tree.expandedKeys.has(key));

  return (
    <div style={treeControlsStyle}>
      <button
        onClick={allExpanded ? tree.collapseAll : tree.expandAll}
        style={{ ...treeControlButtonStyle, ...theme.summary }}
        type="button"
      >
        {allExpanded ? "Collapse all" : "Expand all"}
      </button>
    </div>
  );
}

interface HandlerTreeListProps extends HandlerTreeViewProps {
  /** Ref for the scrollable list container, used to persist/restore scroll position. */
  listRef?: Ref<HTMLUListElement>;
  /** Fires as the list scrolls, so the scroll position can be remembered across reloads. */
  onListScroll?: () => void;
  tree: HandlerTreeState;
}

export function HandlerTreeList({
  listRef,
  onApplyPreset,
  onListScroll,
  onSetScenario,
  onToggleHandler,
  presets,
  theme,
  tree,
}: HandlerTreeListProps) {
  return (
    <ul onScroll={onListScroll} ref={listRef} style={{ ...listStyle, ...theme.list }}>
      {tree.groups.roots.map((node, index) => (
        <GroupNode
          expandedKeys={tree.expandedKeys}
          forceHeader={tree.groupBy === "tags"}
          isLastInList={
            index === tree.groups.roots.length - 1 && tree.groups.ungrouped.length === 0
          }
          key={node.key}
          node={node}
          onApplyPreset={onApplyPreset}
          onSetScenario={onSetScenario}
          onToggleGroup={tree.toggleGroup}
          onToggleHandler={onToggleHandler}
          presets={presets}
          theme={theme}
        />
      ))}
      {tree.groups.ungrouped.map((handler, index) => (
        <HandlerRow
          handler={handler}
          isLast={index === tree.groups.ungrouped.length - 1}
          key={handler.id}
          onSetScenario={(scenarioId) => onSetScenario(handler.id, scenarioId)}
          onToggle={() => onToggleHandler(handler.id)}
          theme={theme}
        />
      ))}
    </ul>
  );
}

interface GroupNodeProps {
  expandedKeys: Set<string>;
  /** Render a collapsible header even when the node has no child groups (used for tag groups). */
  forceHeader?: boolean;
  isLastInList?: boolean;
  node: HandlerGroupNode;
  onApplyPreset: (presetId: string) => void;
  onSetScenario: (id: string, scenarioId: string) => void;
  onToggleGroup: (key: string) => void;
  onToggleHandler: (id: string) => void;
  presets: MswPanelPresetSnapshot[];
  theme: PanelThemeStyles;
}

function GroupNode({
  expandedKeys,
  forceHeader,
  isLastInList,
  node,
  onApplyPreset,
  onSetScenario,
  onToggleGroup,
  onToggleHandler,
  presets,
  theme,
}: GroupNodeProps) {
  // A leaf path (no nested segments) renders its handler rows directly — no collapsible header,
  // unless `forceHeader` is set (feature/tag groups always get a header).
  if (node.children.length === 0 && !forceHeader) {
    return node.handlers.map((handler, index) => (
      <HandlerRow
        handler={handler}
        isLast={isLastInList === true && index === node.handlers.length - 1}
        key={handler.id}
        onSetScenario={(scenarioId) => onSetScenario(handler.id, scenarioId)}
        onToggle={() => onToggleHandler(handler.id)}
        theme={theme}
      />
    ));
  }

  const expanded = expandedKeys.has(node.key);
  // Tag groups carry their tag in the key as `tag:<name>`; drive the feature scenario control off it.
  const featureTag = forceHeader && node.key.startsWith("tag:") ? node.key.slice(4) : undefined;

  return (
    <li>
      <div style={{ ...groupHeaderRowStyle, ...theme.groupHeader, ...theme.groupHeaderBorder }}>
        <button
          aria-expanded={expanded}
          data-msw-panel-group={node.key}
          onClick={() => onToggleGroup(node.key)}
          style={{ ...groupRowStyle, flex: 1 }}
          type="button"
        >
          <ChevronIcon expanded={expanded} size={14} />
          <span style={groupLabelStyle}>{node.label}</span>
        </button>
        {featureTag !== undefined && (
          <FeatureScenarioControl
            handlers={node.handlers}
            onApplyPreset={onApplyPreset}
            onSetScenario={onSetScenario}
            presets={presets}
            tag={featureTag}
            theme={theme}
          />
        )}
        <span style={{ ...groupCountStyle, ...theme.summary }}>{countHandlers(node)}</span>
      </div>
      {expanded && (
        <ul style={treeSubListStyle}>
          {node.handlers.map((handler, index) => (
            <HandlerRow
              handler={handler}
              isLast={
                isLastInList === true &&
                index === node.handlers.length - 1 &&
                node.children.length === 0
              }
              key={handler.id}
              onSetScenario={(scenarioId) => onSetScenario(handler.id, scenarioId)}
              onToggle={() => onToggleHandler(handler.id)}
              theme={theme}
            />
          ))}
          {node.children.map((child, index) => (
            <GroupNode
              expandedKeys={expandedKeys}
              isLastInList={isLastInList === true && index === node.children.length - 1}
              key={child.key}
              node={child}
              onApplyPreset={onApplyPreset}
              onSetScenario={onSetScenario}
              onToggleGroup={onToggleGroup}
              onToggleHandler={onToggleHandler}
              presets={presets}
              theme={theme}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
