import type { PortalDescriptor } from "../contracts/scene";
import type { WorkbenchAction } from "./workbenchState";
export function portalAction(portal: PortalDescriptor): WorkbenchAction { return { type: "pivot", focusId: portal.pivotFocusId }; }
