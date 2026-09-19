import { TransactionType } from "../transaction/transaction.entity";

export type BankrollResetResult = {
  transactionType: TransactionType | null;
  transactionAmount: number;
  finalBankroll: number;
};

export const calculateBankrollReset = (currentBankroll: number, limitBuyIn: number): BankrollResetResult => {
  const targetBankroll = 8 * limitBuyIn;
  const diff = currentBankroll - targetBankroll;

  if (diff > 0) {
    return {
      transactionType: "SANGRIA",
      transactionAmount: diff,
      finalBankroll: targetBankroll,
    };
  } else if (diff < 0) {
    return {
      transactionType: "REPOSICAO",
      transactionAmount: Math.abs(diff),
      finalBankroll: targetBankroll,
    };
  }

  return {
    transactionType: null,
    transactionAmount: 0,
    finalBankroll: targetBankroll,
  };
};
