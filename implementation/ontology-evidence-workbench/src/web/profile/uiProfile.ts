export const UI_META_TYPES = ["Page", "Layout", "Component", "View Model", "Hook", "Action", "Guard", "Binding"] as const;
export type UiMetaType = typeof UI_META_TYPES[number];

export interface UiResponsibilityRecord {
  readonly id: string;
  readonly metaType: UiMetaType;
  readonly label: string;
  readonly owns: readonly string[];
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly evidenceSurface: string;
}

export interface UiProfile {
  readonly schemaVersion: "oew.ui-profile.v1";
  readonly provenance: string;
  readonly records: readonly UiResponsibilityRecord[];
}

export interface CompiledUiProfile extends UiProfile {
  readonly byId: ReadonlyMap<string, UiResponsibilityRecord>;
  readonly digestInput: string;
}
