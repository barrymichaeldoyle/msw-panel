import type { MswPanelHandlerSnapshot } from "./index.js";

/**
 * A node in the grouped handler tree. A node may carry both its own `handlers`
 * (handlers whose path terminates exactly here, e.g. `GET` and `POST` on the
 * same path) and `children` (deeper path segments).
 */
export interface HandlerGroupNode {
  /** Display label — one or more path segments joined by `/` after chain compaction. */
  label: string;
  /** Stable key from the root (used for expand/collapse state). Unique within the tree. */
  key: string;
  /** Child group nodes, sorted by label. */
  children: HandlerGroupNode[];
  /** Handlers whose path terminates exactly at this node, in snapshot order. */
  handlers: MswPanelHandlerSnapshot[];
}

/** Result of grouping a handler list by shared path segments. */
export interface HandlerGroups {
  /** Top-level grouped nodes for handlers that have a path. */
  roots: HandlerGroupNode[];
  /** Handlers with no path (GraphQL, WebSocket, unknown), shown flat. */
  ungrouped: MswPanelHandlerSnapshot[];
}

interface MutableNode {
  segment: string;
  children: Map<string, MutableNode>;
  handlers: MswPanelHandlerSnapshot[];
}

function createNode(segment: string): MutableNode {
  return { segment, children: new Map(), handlers: [] };
}

/**
 * Splits a handler path into display segments. Absolute URLs contribute their
 * origin as the first segment; query strings and hashes are dropped; `:params`
 * and `*` wildcards are preserved verbatim. A bare root (`/`) becomes `["/"]`.
 */
export function splitPath(rawPath: string): string[] {
  const path = String(rawPath);
  let pathname = path.split(/[?#]/, 1)[0];
  let origin = "";

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(pathname)) {
    try {
      const url = new URL(path);
      origin = url.origin;
      pathname = url.pathname;
    } catch {
      // Not a parseable URL — fall through and treat it as a raw path string.
    }
  }

  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  if (origin) {
    return [origin, ...segments];
  }
  return segments.length > 0 ? segments : ["/"];
}

/**
 * Collapses single-child chains so deep route families read compactly, e.g.
 * `api → v1 → users` (no handlers on `api`/`v1`) becomes one `api/v1/users`
 * node. A node stops collapsing once it owns handlers or has multiple children.
 */
function collapse(node: MutableNode): MutableNode {
  let current = node;

  while (current.handlers.length === 0 && current.children.size === 1) {
    const [child] = current.children.values();
    current = {
      segment: `${current.segment}/${child.segment}`,
      children: child.children,
      handlers: child.handlers,
    };
  }

  const collapsedChildren = new Map<string, MutableNode>();
  for (const child of current.children.values()) {
    const collapsedChild = collapse(child);
    collapsedChildren.set(collapsedChild.segment, collapsedChild);
  }
  current.children = collapsedChildren;
  return current;
}

function toGroupNode(node: MutableNode, parentKey: string): HandlerGroupNode {
  const key = parentKey ? `${parentKey}/${node.segment}` : node.segment;
  const children = [...node.children.values()]
    .map((child) => toGroupNode(child, key))
    .sort((a, b) => a.label.localeCompare(b.label));
  return { label: node.segment, key, children, handlers: node.handlers };
}

/**
 * Groups handlers into a tree keyed by shared path segments. Handlers without a
 * path are returned untouched in `ungrouped`. Pure and order-stable: the input
 * snapshot array is never mutated.
 */
export function groupHandlers(handlers: readonly MswPanelHandlerSnapshot[]): HandlerGroups {
  const root = createNode("");
  const ungrouped: MswPanelHandlerSnapshot[] = [];

  for (const handler of handlers) {
    if (handler.path == null || handler.path === "") {
      ungrouped.push(handler);
      continue;
    }

    let node = root;
    for (const segment of splitPath(handler.path)) {
      let child = node.children.get(segment);
      if (!child) {
        child = createNode(segment);
        node.children.set(segment, child);
      }
      node = child;
    }
    node.handlers.push(handler);
  }

  const roots = [...root.children.values()]
    .map((child) => collapse(child))
    .map((child) => toGroupNode(child, ""))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { roots, ungrouped };
}
