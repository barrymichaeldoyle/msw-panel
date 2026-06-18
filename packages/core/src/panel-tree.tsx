import { useMemo, useState } from "react";

import type { MswPanelHandlerSnapshot } from "./index.js";
import { groupHandlers, type HandlerGroupNode } from "./panel-grouping.js";
import { HandlerRow } from "./panel-handlers.js";
import { ChevronIcon } from "./panel-icons.js";
import type { PanelThemeStyles } from "./panel-theme.js";
import {
  groupCountStyle,
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
  /** While a filter is active every group is force-expanded so matches stay visible. */
  filtering: boolean;
  onToggleHandler: (id: string) => void;
  theme: PanelThemeStyles;
}

export function HandlerTreeView({
  handlers,
  filtering,
  onToggleHandler,
  theme,
}: HandlerTreeViewProps) {
  const groups = useMemo(() => groupHandlers(handlers), [handlers]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const toggleGroup = (key: string) => {
    setExpandedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <>
      {groups.roots.length > 0 && (
        <div style={treeControlsStyle}>
          <button
            onClick={() => setExpandedKeys(new Set(collectKeys(groups.roots)))}
            style={{ ...treeControlButtonStyle, ...theme.summary }}
            type="button"
          >
            Expand all
          </button>
          <button
            onClick={() => setExpandedKeys(new Set())}
            style={{ ...treeControlButtonStyle, ...theme.summary }}
            type="button"
          >
            Collapse all
          </button>
        </div>
      )}
      <ul style={listStyle}>
        {groups.roots.map((node) => (
          <GroupNode
            expandedKeys={expandedKeys}
            filtering={filtering}
            key={node.key}
            node={node}
            onToggleGroup={toggleGroup}
            onToggleHandler={onToggleHandler}
            theme={theme}
          />
        ))}
        {groups.ungrouped.map((handler) => (
          <HandlerRow
            handler={handler}
            key={handler.id}
            onToggle={() => onToggleHandler(handler.id)}
            theme={theme}
          />
        ))}
      </ul>
    </>
  );
}

interface GroupNodeProps {
  expandedKeys: Set<string>;
  filtering: boolean;
  node: HandlerGroupNode;
  onToggleGroup: (key: string) => void;
  onToggleHandler: (id: string) => void;
  theme: PanelThemeStyles;
}

function GroupNode({
  expandedKeys,
  filtering,
  node,
  onToggleGroup,
  onToggleHandler,
  theme,
}: GroupNodeProps) {
  // A leaf path (no nested segments) renders its handler rows directly — no collapsible header.
  if (node.children.length === 0) {
    return node.handlers.map((handler) => (
      <HandlerRow
        handler={handler}
        key={handler.id}
        onToggle={() => onToggleHandler(handler.id)}
        theme={theme}
      />
    ));
  }

  const expanded = filtering || expandedKeys.has(node.key);

  return (
    <li>
      <button
        aria-expanded={expanded}
        data-msw-panel-group={node.key}
        onClick={() => onToggleGroup(node.key)}
        style={{ ...groupRowStyle, ...theme.rowBorder }}
        type="button"
      >
        <ChevronIcon expanded={expanded} size={14} />
        <span style={groupLabelStyle}>{node.label}</span>
        <span style={{ ...groupCountStyle, ...theme.summary }}>{countHandlers(node)}</span>
      </button>
      {expanded && (
        <ul style={treeSubListStyle}>
          {node.handlers.map((handler) => (
            <HandlerRow
              handler={handler}
              key={handler.id}
              onToggle={() => onToggleHandler(handler.id)}
              theme={theme}
            />
          ))}
          {node.children.map((child) => (
            <GroupNode
              expandedKeys={expandedKeys}
              filtering={filtering}
              key={child.key}
              node={child}
              onToggleGroup={onToggleGroup}
              onToggleHandler={onToggleHandler}
              theme={theme}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
