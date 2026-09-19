import { desc, eq } from "drizzle-orm";
import {
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from "../../domain/transaction/transaction.entity";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import { db } from "../database";
import { transactions } from "../database/schema";

type TransactionDatabase = Pick<typeof db, "insert" | "select">;

const mapTransaction = (
  result: typeof transactions.$inferSelect,
): Transaction => {
  return {
    ...result,
    amount: Number(result.amount),
    type: result.type as TransactionType,
    date: result.date,
    metadata: result.metadata ?? {},
  };
};

export const createDrizzleTransactionRepository = (
  database: TransactionDatabase = db,
): TransactionRepository => {
  const create = async (data: CreateTransactionInput): Promise<Transaction> => {
    const [result] = await database
      .insert(transactions)
      .values({
        playerId: data.playerId,
        type: data.type,
        amount: data.amount.toString(),
        date: data.date,
        metadata: data.metadata ?? {},
      })
      .returning();

    return mapTransaction(result);
  };

  return {
    create,

    async createSettlementEventIfAbsent(
      data: CreateTransactionInput,
    ): Promise<boolean> {
      try {
        await create(data);
        return true;
      } catch (error) {
        if ((error as { code?: string }).code === "23505") {
          return false;
        }

        throw error;
      }
    },

    async findByPlayerId(playerId: string): Promise<Transaction[]> {
      const results = await database
        .select()
        .from(transactions)
        .where(eq(transactions.playerId, playerId))
        .orderBy(desc(transactions.createdAt));

      return results.map((result) => mapTransaction(result));
    },
  };
};

export const drizzleTransactionRepository: TransactionRepository =
  createDrizzleTransactionRepository();
