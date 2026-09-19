/**
 * Computes BB/100 winrate from profit, hands, and big-blind value.
 * Both totalProfit and bbValue must use the same currency unit (cents or dollars).
 *
 * Returns 0 when inputs are insufficient (zero hands, zero/negative bbValue).
 */
export const computeWinrateBbPer100 = (
  totalProfit: number,
  totalHands: number,
  bbValue: number,
): number => {
  if (bbValue <= 0 || totalHands <= 0) return 0;
  const profitInBb = totalProfit / bbValue;
  return profitInBb / (totalHands / 100);
};
