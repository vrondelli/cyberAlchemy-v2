import { PlayerStatsSnapshot } from "../../../domain/player-stats/player-stats.entity";
import { PlayerStatsWindow } from "../../../domain/player-stats/player-stats-window.vo";

export function toHistoryItem(snapshot: PlayerStatsSnapshot) {
  return {
    id: snapshot.id,
    statDate: snapshot.statDate,
    hands: snapshot.hands,
    profit: snapshot.profit,
    rakeback: snapshot.rakeback,
    rake: snapshot.rake,
    closingBankroll: snapshot.closingBankroll,
    sessionDuration: snapshot.sessionDuration,
    sourceType: snapshot.sourceType,
    status: snapshot.status,
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}

export function toWindowProjection(window: PlayerStatsWindow) {
  return {
    playerId: window.playerId,
    fromDate: window.fromDate,
    toDate: window.toDate,
    totalHands: window.totalHands,
    totalProfit: window.totalProfit,
    totalRakeback: window.totalRakeback,
    totalRake: window.totalRake,
    totalSessionMinutes: window.totalSessionMinutes,
    sessionCount: window.sessionCount,
    avgHandsPerDay: window.avgHandsPerDay,
    winrateBbPer100: window.winrateBbPer100,
  };
}
