import { UI_META_TYPES, type UiProfile, type UiResponsibilityRecord } from "./uiProfile";

const AUTHORITY_WORDS = /\b(promote|promotion|authoritative|production authority|release authority)\b/i;

export function validateUiProfile(value: unknown): asserts value is UiProfile {
  if (!value || typeof value !== "object") throw new Error("UI profile must be an object.");
  const profile = value as Partial<UiProfile>;
  if (profile.schemaVersion !== "oew.ui-profile.v1" || profile.provenance !== "candidate-only:domainspec-v2-ui-meta-types" || !Array.isArray(profile.records)) throw new Error("UI profile header is invalid.");
  const ids = new Set<string>();
  for (const candidate of profile.records) {
    const record = candidate as Partial<UiResponsibilityRecord>;
    if (!record.id || !record.label || !record.evidenceSurface || !UI_META_TYPES.includes(record.metaType as never) || !Array.isArray(record.owns) || !Array.isArray(record.inputs) || !Array.isArray(record.outputs)) throw new Error(`Invalid UI responsibility record ${String(record.id)}.`);
    if (ids.has(record.id)) throw new Error(`Duplicate UI responsibility ${record.id}.`);
    if (AUTHORITY_WORDS.test(JSON.stringify(record))) throw new Error(`Authority-inflating language in ${record.id}.`);
    ids.add(record.id);
  }
  for (const record of profile.records) for (const child of record.owns) if (!ids.has(child)) throw new Error(`Dangling owned responsibility ${child}.`);
  const visit = (id: string, path: Set<string>): void => {
    if (path.has(id)) throw new Error(`Circular UI containment at ${id}.`);
    const record = profile.records!.find((item) => item.id === id);
    if (!record) return;
    const next = new Set(path).add(id);
    record.owns.forEach((child) => visit(child, next));
  };
  profile.records.forEach((record) => visit(record.id, new Set()));
  if (!ids.has("hook.keyboard")) throw new Error("Keyboard responsibility is required.");
}
