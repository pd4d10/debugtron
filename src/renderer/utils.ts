import type { CSSProperties } from "react";

export const noDragStyle: CSSProperties = {
  // @ts-expect-error disable drag
  "-webkit-app-region": "no-drag",
};
