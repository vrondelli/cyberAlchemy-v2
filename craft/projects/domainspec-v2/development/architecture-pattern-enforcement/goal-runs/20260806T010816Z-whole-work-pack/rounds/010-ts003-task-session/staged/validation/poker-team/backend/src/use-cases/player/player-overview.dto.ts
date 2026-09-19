export type PlayerOverviewDto = {
  id: string;
  name: string;
  currentLimit: string;
  status: string;
  bankroll: number;
  makeup: number;
  lifetimeProfit: number;
  avgHandsLastPeriod: number;
  winrateLastPeriod: number;
  periodDays: number;
};
