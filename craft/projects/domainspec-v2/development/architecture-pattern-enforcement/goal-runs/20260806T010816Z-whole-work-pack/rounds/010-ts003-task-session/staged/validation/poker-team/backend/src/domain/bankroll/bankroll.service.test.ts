import { describe, expect, it } from "vitest";
import { calculateBankrollReset } from "./bankroll.service";

describe("Bankroll Service", () => {
    // NL10 -> Buyin 1000 (cents). Target 8000.
    const limitBuyIn = 1000;
    const target = 8000;

    it("should generate SANGRIA when bankroll > 8 buyins", () => {
        const currentCheck = 10000; // 100 buyins? No, 10000 cents.
        const result = calculateBankrollReset(currentCheck, limitBuyIn);
        
        expect(result.transactionType).toBe("SANGRIA");
        expect(result.transactionAmount).toBe(2000);
        expect(result.finalBankroll).toBe(target);
    });

    it("should generate REPOSICAO when bankroll < 8 buyins", () => {
        const currentCheck = 5000;
        const result = calculateBankrollReset(currentCheck, limitBuyIn);
        
        expect(result.transactionType).toBe("REPOSICAO");
        expect(result.transactionAmount).toBe(3000);
        expect(result.finalBankroll).toBe(target);
    });

    it("should do nothing when bankroll == 8 buyins", () => {
        const result = calculateBankrollReset(target, limitBuyIn);
        
        expect(result.transactionType).toBeNull();
        expect(result.transactionAmount).toBe(0);
        expect(result.finalBankroll).toBe(target);
    });
});
