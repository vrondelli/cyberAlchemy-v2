import rawProfile from "./ui-profile.v1.json";
import type { CompiledUiProfile } from "./uiProfile";
import { validateUiProfile } from "./validateUiProfile";

export function compileUiProfile(value: unknown = rawProfile): CompiledUiProfile {
  validateUiProfile(value);
  const records = [...value.records].sort((a, b) => a.id.localeCompare(b.id));
  return Object.freeze({ ...value, records, byId: new Map(records.map((record) => [record.id, record])), digestInput: JSON.stringify(records) });
}

export const uiProfile = compileUiProfile();
