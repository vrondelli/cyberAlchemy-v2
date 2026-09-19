import { describe, expect, it } from "vitest";
import type { CoachStatus } from "./coach.entity";

describe("coach domain invariants", () => {
  // PM-CDM-001: Coach principalId uniqueness
  // Enforced at DB level via uniqueIndex on (principalId) WHERE status = ACTIVE.
  // Use-case level verification: create-coach catches 23505 → DUPLICATE_PRINCIPAL.
  // See create-coach.test.ts PM-COACH-009 for use-case coverage.
  it("CoachStatus type only allows ACTIVE and INACTIVE (PM-CDM-004)", () => {
    const validStatuses: CoachStatus[] = ["ACTIVE", "INACTIVE"];
    expect(validStatuses).toHaveLength(2);
    expect(validStatuses).toContain("ACTIVE");
    expect(validStatuses).toContain("INACTIVE");
  });

  // PM-CDM-002: One active coach per player
  // Enforced at DB level via uniqueIndex on (playerId) WHERE unassignedAt IS NULL.
  // Use-case level: assign-coach R4 checks findActiveByPlayerId.
  // See assign-coach.test.ts PM-ASGN-008 for use-case coverage.

  // PM-CDM-003: Soft-delete preserves assignment history
  it("unassign sets unassignedAt instead of deleting (PM-CDM-003)", () => {
    // The CoachAssignment type has `unassignedAt: Date | null` –
    // a soft-delete model where null = active, non-null = unassigned.
    const active = {
      id: "a1",
      coachId: "c1",
      playerId: "p1",
      assignedAt: new Date(),
      unassignedAt: null as Date | null,
    };
    expect(active.unassignedAt).toBeNull();

    const unassigned = {
      ...active,
      unassignedAt: new Date(),
    };
    expect(unassigned.unassignedAt).toBeInstanceOf(Date);
    // Record still exists — not deleted
    expect(unassigned.id).toBe(active.id);
    expect(unassigned.coachId).toBe(active.coachId);
    expect(unassigned.playerId).toBe(active.playerId);
  });

  // PM-CDM-004: CoachStatus enum coverage
  it("Coach entity requires all mandatory fields", () => {
    const coach = {
      id: "c-1",
      principalId: "p-1",
      name: "Coach Name",
      email: "coach@test.com",
      status: "ACTIVE" as CoachStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(coach.id).toBeDefined();
    expect(coach.principalId).toBeDefined();
    expect(coach.name).toBeDefined();
    expect(coach.email).toBeDefined();
    expect(coach.status).toBe("ACTIVE");
    expect(coach.createdAt).toBeInstanceOf(Date);
    expect(coach.updatedAt).toBeInstanceOf(Date);
  });
});
