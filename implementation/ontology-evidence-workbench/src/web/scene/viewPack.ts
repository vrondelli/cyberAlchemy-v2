import type { FocusScene, PortalDescriptor } from "../contracts/scene";
export interface SceneViewPack { readonly scene: FocusScene; readonly portals: readonly PortalDescriptor[]; readonly conservation: { readonly visible: number; readonly omitted: number; readonly boundary: number } }
