import type { FocusScene } from "../contracts/scene";
import type { NodeViewModel } from "../presentation/nodePresentation";
export interface RendererNode { readonly id: string; readonly x: number; readonly y: number; readonly view: NodeViewModel; readonly selected: boolean }
export interface RendererScene { readonly nodes: readonly RendererNode[]; readonly relations: FocusScene["relations"] }
export interface RendererCallbacks { readonly onSelectNode: (id: string) => void; readonly onSelectRelation: (id: string) => void }
