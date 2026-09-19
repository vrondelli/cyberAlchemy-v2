import {
  PlayerStatsSnapshot,
  RecordPlayerStatsInput,
} from "./player-stats.entity";
import { PlayerStatsValidationError } from "./player-stats.validation";

const COMPARABLE_FIELDS = [
  "hands",
  "profit",
  "rakeback",
  "rake",
  "closingBankroll",
  "sessionDuration",
  "sourceType",
] as const;

export function detectEffectiveChange(
  existing: PlayerStatsSnapshot,
  input: RecordPlayerStatsInput,
): string[] {
  const changedFields: string[] = [];

  for (const field of COMPARABLE_FIELDS) {
    if (existing[field] !== input[field]) {
      changedFields.push(field);
    }
  }

  if (changedFields.length === 0) {
    throw new PlayerStatsValidationError(
      "NO_CHANGES_DETECTED",
      `Correction for ${input.playerId}:${input.statDate} has no effective changes.`,
    );
  }

  return changedFields;
}
