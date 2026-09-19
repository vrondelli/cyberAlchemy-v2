export type PlayerStatsRecordedEvent = {
  type: "PlayerStatsRecorded";
  snapshotId: string;
  playerId: string;
  statDate: string;
  occurredAt: Date;
};

export type PlayerStatsCorrectedEvent = {
  type: "PlayerStatsCorrected";
  snapshotId: string;
  playerId: string;
  statDate: string;
  changedFields: string[];
  occurredAt: Date;
};

export type PlayerStatsEvent =
  | PlayerStatsRecordedEvent
  | PlayerStatsCorrectedEvent;

export type PlayerStatsEventHandler = (
  event: PlayerStatsEvent,
) => void | Promise<void>;
