export type MakeupOperation = "increase" | "decrease" | "set";

export type CalculateMakeupAdjustmentInput = {
  previousMakeup: number;
  operation: MakeupOperation;
  amount: number;
};

export type CalculateMakeupAdjustmentResult = {
  previousMakeup: number;
  currentMakeup: number;
  normalizedAmount: number;
  signedDelta: number;
};

export const isValidMakeupOperation = (
  operation: string,
): operation is MakeupOperation => {
  return (
    operation === "increase" || operation === "decrease" || operation === "set"
  );
};

export const normalizeNonNegativeAmount = (amount: number): number => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid amount");
  }

  return Math.floor(amount + 0.5);
};

export const calculateMakeupAdjustment = (
  input: CalculateMakeupAdjustmentInput,
): CalculateMakeupAdjustmentResult => {
  const normalizedAmount = normalizeNonNegativeAmount(input.amount);
  const previousMakeup = Math.max(0, Math.floor(input.previousMakeup));

  let currentMakeup = previousMakeup;
  if (input.operation === "increase") {
    currentMakeup = previousMakeup + normalizedAmount;
  } else if (input.operation === "decrease") {
    currentMakeup = Math.max(0, previousMakeup - normalizedAmount);
  } else {
    currentMakeup = Math.max(0, normalizedAmount);
  }

  return {
    previousMakeup,
    currentMakeup,
    normalizedAmount,
    signedDelta: currentMakeup - previousMakeup,
  };
};
