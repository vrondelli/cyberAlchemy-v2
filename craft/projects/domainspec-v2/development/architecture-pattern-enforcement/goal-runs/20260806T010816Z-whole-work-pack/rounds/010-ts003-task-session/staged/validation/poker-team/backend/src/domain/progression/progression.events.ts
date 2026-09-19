export type ProgressionCheckedEvent = {
  type: "ProgressionChecked";
  playerId: string;
  eligibleForPromotion: boolean;
  reason: string;
  avgHands: number;
  winrate: number;
  period: "BI_WEEKLY" | "MONTHLY";
  occurredAt: Date;
};

export type ProgressionEvent = ProgressionCheckedEvent;

export type ProgressionEventHandler = (
  event: ProgressionEvent,
) => void | Promise<void>;
