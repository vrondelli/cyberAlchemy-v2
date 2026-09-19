import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  decimal,
  timestamp,
  date,
  pgEnum,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const playerStatusEnum = pgEnum("player_status", [
  "ACTIVE",
  "INACTIVE",
  "OBSERVATION",
]);
export const playerLimitEnum = pgEnum("player_limit", [
  "NL20",
  "NL40",
  "NL60",
  "NL80",
  "NL100",
]);
export const statsSourceTypeEnum = pgEnum("stats_source_type", [
  "MANUAL",
  "IMPORT",
  "API",
]);
export const statsRecordStatusEnum = pgEnum("stats_record_status", [
  "RECORDED",
  "CORRECTED",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "SANGRIA",
  "REPOSICAO",
  "PAYOUT",
  "MAKEUP_ADJUSTMENT",
  "MAKEUP_APPLIED",
]);

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    principalId: varchar("principal_id", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    canonicalEmail: varchar("canonical_email", { length: 255 })
      .notNull()
      .unique(),
    currentLimit: playerLimitEnum("current_limit").notNull(),
    status: playerStatusEnum("status").default("OBSERVATION").notNull(),
    bankroll: decimal("bankroll", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    makeup: decimal("makeup", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    makeupPolicy: jsonb("makeup_policy")
      .$type<{
        applyProfitFirst: boolean;
        applyRakebackSecond: boolean;
        playerRakebackShare: number;
      } | null>()
      .default(null),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniquePrincipalId: uniqueIndex("players_principal_id_unique")
      .on(table.principalId)
      .where(sql`${table.principalId} IS NOT NULL`),
  }),
);

export const playerStats = pgTable(
  "player_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
    statDate: date("stat_date").notNull(),
    hands: integer("hands").notNull(),
    profit: decimal("profit", { precision: 10, scale: 2 }).notNull(),
    rakeback: decimal("rakeback", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    rake: decimal("rake", { precision: 10, scale: 2 }).default("0").notNull(),
    closingBankroll: decimal("closing_bankroll", {
      precision: 10,
      scale: 2,
    }).notNull(),
    sessionDuration: integer("session_duration").default(0).notNull(),
    sourceType: statsSourceTypeEnum("source_type").default("MANUAL").notNull(),
    status: statsRecordStatusEnum("status").default("RECORDED").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniquePlayerDate: uniqueIndex("player_stats_unique_player_date").on(
      table.playerId,
      table.statDate,
    ),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
    type: transactionTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    date: date("date").defaultNow().notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueMakeupAppliedPerPlayerDate: uniqueIndex(
      "transactions_unique_makeup_applied_player_date",
    )
      .on(table.playerId, table.date)
      .where(sql`${table.type} = 'MAKEUP_APPLIED'`),
    uniquePayoutPerPlayerDate: uniqueIndex(
      "transactions_unique_payout_player_date",
    )
      .on(table.playerId, table.date)
      .where(sql`${table.type} = 'PAYOUT'`),
  }),
);

export const candidateApplications = pgTable(
  "candidate_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    birthDate: date("birth_date").notNull(),
    cityState: varchar("city_state", { length: 255 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    educationLevel: varchar("education_level", { length: 50 }).notNull(),
    currentWorkStatus: varchar("current_work_status", { length: 50 }).notNull(),
    dailyPokerAvailability: varchar("daily_poker_availability", {
      length: 50,
    }).notNull(),
    preferredTimeWindows: jsonb("preferred_time_windows")
      .$type<string[]>()
      .notNull(),
    weeklyDaysAvailability: varchar("weekly_days_availability", {
      length: 50,
    }).notNull(),
    pokerExperienceRange: varchar("poker_experience_range", {
      length: 50,
    }).notNull(),
    primaryModality: varchar("primary_modality", { length: 50 }).notNull(),
    hasOwnComputer: boolean("has_own_computer").notNull(),
    hasDiscordFamiliarity: boolean("has_discord_familiarity").notNull(),
    trackerUsage: varchar("tracker_usage", { length: 20 }).notNull(),
    trackerDetail: varchar("tracker_detail", { length: 255 }),
    nickPokerStars: varchar("nick_poker_stars", { length: 100 }),
    nickGGPoker: varchar("nick_gg_poker", { length: 100 }),
    nickSuprema: varchar("nick_suprema", { length: 100 }),
    lgpdConsentAccepted: boolean("lgpd_consent_accepted").notNull(),
    acceptedRegulationVersion: varchar("accepted_regulation_version", {
      length: 50,
    }).notNull(),
    acceptedRegulationAt: timestamp("accepted_regulation_at").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("SUBMITTED"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: varchar("reviewed_by", { length: 255 }),
    reviewDecisionNote: varchar("review_decision_note", { length: 500 }),
    retentionUntil: timestamp("retention_until"),
  },
  (table) => ({
    uniqueWhatsapp: uniqueIndex("candidate_applications_whatsapp_unique").on(
      table.whatsapp,
    ),
    uniqueEmail: uniqueIndex("candidate_applications_email_unique").on(
      table.email,
    ),
  }),
);

export const onboardingPlayerIntakeHandoffs = pgTable(
  "onboarding_player_intake_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .references(() => candidateApplications.id)
      .notNull(),
    candidateFullName: varchar("candidate_full_name", { length: 255 }).notNull(),
    candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
    candidateWhatsapp: varchar("candidate_whatsapp", { length: 50 }).notNull(),
    approvedBy: varchar("approved_by", { length: 255 }).notNull(),
    approvedAt: timestamp("approved_at").notNull(),
    acceptedRegulationVersion: varchar("accepted_regulation_version", {
      length: 50,
    }).notNull(),
    acceptedRegulationAt: timestamp("accepted_regulation_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueApplicationId: uniqueIndex(
      "onboarding_player_intake_handoffs_application_id_unique",
    ).on(table.applicationId),
  }),
);

// ──────────────────────────────────────────
// Auth Access Control tables
// ──────────────────────────────────────────

export const principalSubjectTypeEnum = pgEnum("principal_subject_type", [
  "user",
  "service",
  "automation",
]);

export const principalStatusEnum = pgEnum("principal_status", [
  "ACTIVE",
  "DISABLED",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "ACTIVE",
  "TERMINATED",
  "EXPIRED",
]);

export const permissionEffectEnum = pgEnum("permission_effect", [
  "ALLOW",
  "DENY",
]);

export const granteeTypeEnum = pgEnum("grantee_type", ["role", "principal"]);

export const authPrincipals = pgTable("auth_principals", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull().unique(),
  subjectType: principalSubjectTypeEnum("subject_type").notNull(),
  status: principalStatusEnum("status").default("ACTIVE").notNull(),
  roleKeys: jsonb("role_keys").$type<string[]>().notNull().default([]),
  directPermissions: jsonb("direct_permissions")
    .$type<string[]>()
    .notNull()
    .default([]),
  credentialHash: varchar("credential_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  principalId: uuid("principal_id")
    .references(() => authPrincipals.id)
    .notNull(),
  status: sessionStatusEnum("status").default("ACTIVE").notNull(),
  effectivePermissions: jsonb("effective_permissions")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const authAccessTokens = pgTable("auth_access_tokens", {
  tokenId: uuid("token_id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => authSessions.id)
    .notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  revokeReason: varchar("revoke_reason", { length: 100 }),
  scope: jsonb("scope").$type<string[]>().notNull().default([]),
});

export const authPermissionGrants = pgTable("auth_permission_grants", {
  grantId: uuid("grant_id").defaultRandom().primaryKey(),
  granteeType: granteeTypeEnum("grantee_type").notNull(),
  granteeKey: varchar("grantee_key", { length: 255 }).notNull(),
  permissionKey: varchar("permission_key", { length: 255 }).notNull(),
  effect: permissionEffectEnum("effect").default("ALLOW").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ──────────────────────────────────────────
// Coach Management tables
// ──────────────────────────────────────────

export const coachStatusEnum = pgEnum("coach_status", ["ACTIVE", "INACTIVE"]);

export const coaches = pgTable(
  "coaches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    principalId: varchar("principal_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    status: coachStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueActivePrincipal: uniqueIndex("coaches_unique_active_principal")
      .on(table.principalId)
      .where(sql`${table.status} = 'ACTIVE'`),
  }),
);

export const coachAssignments = pgTable(
  "coach_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coachId: uuid("coach_id")
      .references(() => coaches.id)
      .notNull(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    unassignedAt: timestamp("unassigned_at"),
  },
  (table) => ({
    uniqueActivePlayerCoach: uniqueIndex(
      "coach_assignments_unique_active_player",
    )
      .on(table.playerId)
      .where(sql`${table.unassignedAt} IS NULL`),
  }),
);
