import type { WorkbenchAction } from "./workbenchState";
export function enterPathMode(): WorkbenchAction { return { type: "set-mode", mode: "path" }; }
