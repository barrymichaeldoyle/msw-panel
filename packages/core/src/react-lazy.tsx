import { lazy, Suspense } from "react";
import type { MswPanelEmbeddedProps, MswPanelProps } from "./react.js";

const LazyMswPanel = lazy(() => import("./react.js").then((m) => ({ default: m.MswPanel })));
const LazyMswPanelEmbedded = lazy(() =>
  import("./react.js").then((m) => ({ default: m.MswPanelEmbedded })),
);

export function MswPanel(props: MswPanelProps) {
  return (
    <Suspense>
      <LazyMswPanel {...props} />
    </Suspense>
  );
}

export function MswPanelEmbedded(props: MswPanelEmbeddedProps) {
  return (
    <Suspense>
      <LazyMswPanelEmbedded {...props} />
    </Suspense>
  );
}

export type { MswPanelEmbeddedProps, MswPanelProps, PanelPosition, PanelSide, PanelTheme } from "./react.js";
