/// <reference types="vite/client" />
import { CSSProperties } from "react";

declare module "react" {
  interface CSSProperties {
    WebkitAppRegion?: "drag" | "no-drag";
  }
}
