import { describe, expect, it } from "vitest";

import type { MswPanelHandlerSnapshot } from "./index.js";
import {
  groupHandlers,
  groupHandlersByTag,
  splitPath,
  type HandlerGroupNode,
} from "./panel-grouping.js";

function handler(overrides: Partial<MswPanelHandlerSnapshot>): MswPanelHandlerSnapshot {
  return {
    enabled: true,
    id: overrides.path ?? overrides.id ?? "id",
    kind: "http",
    label: "",
    method: "GET",
    path: null,
    used: false,
    ...overrides,
  };
}

/** Flattens a tree to `key` strings for concise structural assertions. */
function keys(nodes: HandlerGroupNode[]): string[] {
  return nodes.flatMap((node) => [node.key, ...keys(node.children)]);
}

function findNode(nodes: HandlerGroupNode[], key: string): HandlerGroupNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    const found = findNode(node.children, key);
    if (found) return found;
  }
  return undefined;
}

describe("splitPath", () => {
  it("splits relative paths into segments and preserves params and wildcards", () => {
    expect(splitPath("/profile/:id/followers")).toEqual(["profile", ":id", "followers"]);
    expect(splitPath("/files/*")).toEqual(["files", "*"]);
  });

  it("uses the origin as the first segment for absolute URLs", () => {
    expect(splitPath("https://api.example.com/v1/users")).toEqual([
      "https://api.example.com",
      "v1",
      "users",
    ]);
  });

  it("drops query strings and hashes", () => {
    expect(splitPath("/search?q=1#top")).toEqual(["search"]);
  });

  it("represents the bare root as a single '/' segment", () => {
    expect(splitPath("/")).toEqual(["/"]);
    expect(splitPath("")).toEqual(["/"]);
  });
});

describe("groupHandlers", () => {
  it("groups the issue's profile route family with a node owning both a handler and children", () => {
    const { roots } = groupHandlers([
      handler({ path: "/profile/me", id: "me" }),
      handler({ path: "/profile/:id", id: "id" }),
      handler({ path: "/profile/:id/followers", id: "followers" }),
    ]);

    expect(keys(roots)).toEqual(["profile", "profile/:id", "profile/:id/followers", "profile/me"]);

    // `/profile/:id` is both a leaf (its own handler) and a parent of `followers`.
    const idNode = findNode(roots, "profile/:id");
    expect(idNode?.handlers.map((h) => h.id)).toEqual(["id"]);
    expect(idNode?.children.map((c) => c.label)).toEqual(["followers"]);
  });

  it("compacts single-child chains into one node", () => {
    const { roots } = groupHandlers([
      handler({ path: "/api/v1/users", id: "users" }),
      handler({ path: "/api/v1/posts", id: "posts" }),
    ]);

    // `api` and `v1` each have a single child and no handlers, so they collapse.
    expect(roots).toHaveLength(1);
    expect(roots[0].label).toBe("api/v1");
    expect(roots[0].children.map((c) => c.label)).toEqual(["posts", "users"]);
  });

  it("keeps multiple methods on the same path in one node", () => {
    const { roots } = groupHandlers([
      handler({ path: "/users", id: "get", method: "GET" }),
      handler({ path: "/users", id: "post", method: "POST" }),
    ]);

    expect(roots).toHaveLength(1);
    expect(roots[0].key).toBe("users");
    expect(roots[0].handlers.map((h) => h.id)).toEqual(["get", "post"]);
  });

  it("separates handlers by origin for absolute URLs", () => {
    const { roots } = groupHandlers([
      handler({ path: "https://a.example.com/users", id: "a" }),
      handler({ path: "https://b.example.com/users", id: "b" }),
    ]);

    expect(roots.map((node) => node.label)).toEqual([
      "https://a.example.com/users",
      "https://b.example.com/users",
    ]);
  });

  it("puts handlers without a path into the ungrouped bucket", () => {
    const { roots, ungrouped } = groupHandlers([
      handler({ path: "/users", id: "users" }),
      handler({ path: null, id: "gql", kind: "graphql", method: null, label: "QUERY GetUser" }),
      handler({ path: null, id: "ws", kind: "websocket", method: null, label: "WS connection" }),
    ]);

    expect(keys(roots)).toEqual(["users"]);
    expect(ungrouped.map((h) => h.id)).toEqual(["gql", "ws"]);
  });

  it("sorts sibling groups by label", () => {
    const { roots } = groupHandlers([
      handler({ path: "/zebra", id: "z" }),
      handler({ path: "/apple", id: "a" }),
      handler({ path: "/mango", id: "m" }),
    ]);

    expect(roots.map((node) => node.label)).toEqual(["apple", "mango", "zebra"]);
  });

  it("does not mutate the input array", () => {
    const input = [handler({ path: "/users", id: "users" })];
    const snapshot = [...input];
    groupHandlers(input);
    expect(input).toEqual(snapshot);
  });
});

describe("groupHandlersByTag", () => {
  it("groups handlers under each of their tags and sorts tags alphabetically", () => {
    const groups = groupHandlersByTag([
      handler({ id: "a", path: "/a", tags: ["billing", "auth"] }),
      handler({ id: "b", path: "/b", tags: ["auth"] }),
    ]);

    expect(groups.roots.map((node) => node.label)).toEqual(["auth", "billing"]);
    const auth = groups.roots.find((node) => node.label === "auth");
    expect(auth?.handlers.map((h) => h.id)).toEqual(["a", "b"]);
    expect(auth?.key).toBe("tag:auth");
  });

  it("returns untagged handlers in ungrouped", () => {
    const groups = groupHandlersByTag([
      handler({ id: "a", path: "/a", tags: ["auth"] }),
      handler({ id: "b", path: "/b" }),
    ]);

    expect(groups.roots.map((node) => node.label)).toEqual(["auth"]);
    expect(groups.ungrouped.map((h) => h.id)).toEqual(["b"]);
  });
});
