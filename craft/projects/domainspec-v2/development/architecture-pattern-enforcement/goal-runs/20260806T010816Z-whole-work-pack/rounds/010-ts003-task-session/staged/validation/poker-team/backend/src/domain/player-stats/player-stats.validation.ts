import { StatsSourceType } from "./player-stats.entity";
import { DomainError } from "../errors";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_SOURCE_TYPES: StatsSourceType[] = ["MANUAL", "IMPORT", "API"];

export class PlayerStatsValidationError extends DomainError {
  constructor(
    code: string,
    message: string,
  ) {
    super(code, message);
    this.name = "PlayerStatsValidationError";
  }
}

export function validateStatDate(statDate: string): void {
  if (!DATE_REGEX.test(statDate) || isNaN(Date.parse(statDate))) {
    throw new PlayerStatsValidationError(
      "VALIDATION_ERROR",
      `Invalid statDate format: ${statDate}. Expected YYYY-MM-DD.`,
    );
  }
}

export function validateHands(hands: number): void {
  if (!Number.isInteger(hands) || hands < 0) {
    throw new PlayerStatsValidationError(
      "VALIDATION_ERROR",
      `Hands must be a non-negative integer. Received: ${hands}`,
    );
  }
}

export function validateSourceType(sourceType: string): void {
  if (!VALID_SOURCE_TYPES.includes(sourceType as StatsSourceType)) {
    throw new PlayerStatsValidationError(
      "VALIDATION_ERROR",
      `Invalid sourceType: ${sourceType}. Expected one of: ${VALID_SOURCE_TYPES.join(", ")}`,
    );
  }
}

export function validateRake(rake: number): void {
  if (rake < 0) {
    throw new PlayerStatsValidationError(
      "VALIDATION_ERROR",
      `Rake must be non-negative. Received: ${rake}`,
    );
  }
}

export function validateSessionDuration(sessionDuration: number): void {
  if (!Number.isInteger(sessionDuration) || sessionDuration < 0) {
    throw new PlayerStatsValidationError(
      "VALIDATION_ERROR",
      `Session duration must be a non-negative integer. Received: ${sessionDuration}`,
    );
  }
}
