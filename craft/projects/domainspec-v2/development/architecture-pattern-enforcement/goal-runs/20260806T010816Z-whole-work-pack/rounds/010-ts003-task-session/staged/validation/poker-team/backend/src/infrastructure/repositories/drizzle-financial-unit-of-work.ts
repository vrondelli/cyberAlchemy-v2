import {
  FinancialWriteContext,
  FinancialWriteUnitOfWork,
} from "../../domain/shared/financial-write-unit-of-work";
import { db } from "../database";
import { createDrizzlePlayerRepository } from "./drizzle-player.repository";
import { createDrizzleTransactionRepository } from "./drizzle-transaction.repository";

export const drizzleFinancialUnitOfWork: FinancialWriteUnitOfWork = {
  async runInTransaction<T>(
    work: (context: FinancialWriteContext) => Promise<T>,
  ): Promise<T> {
    return db.transaction<T>(async (tx) => {
      const playerRepo = createDrizzlePlayerRepository(tx);
      const transactionRepo = createDrizzleTransactionRepository(tx);
      return work({ playerRepo, transactionRepo });
    });
  },
};
