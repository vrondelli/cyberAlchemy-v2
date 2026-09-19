import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { ROLE_DEFINITIONS } from "../../domain/auth-access-control/role-definitions";
import type { PrincipalRepository } from "../../domain/auth-access-control/auth.repository";

const BCRYPT_COST_FACTOR = 12;

export type SeedableRepos = {
  principalRepo: PrincipalRepository & {
    create(input: {
      identifier: string;
      subjectType: "user" | "service" | "automation";
      roleKeys: string[];
      directPermissions: string[];
      credentialHash: string;
    }): Promise<unknown>;
    updateCredentialHashByIdentifier(
      identifier: string,
      credentialHash: string,
    ): Promise<void>;
  };
  grantRepo: {
    upsertGrant(grant: {
      granteeType: "role" | "principal";
      granteeKey: string;
      permissionKey: string;
      effect: "ALLOW" | "DENY";
    }): Promise<unknown>;
  };
};

/**
 * SeedSystemBootstrap operation.
 * @source auth-access-control.SeedSystemBootstrap
 *
 * Creates admin principal on first boot and syncs all role → permission grants
 * on every boot.
 */
export const seedSystemBootstrap = async (
  repos: SeedableRepos,
): Promise<void> => {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPasswordFromEnv = process.env.ADMIN_PASSWORD?.trim();

  // R1: Check if admin principal already exists
  const existingAdmin =
    await repos.principalRepo.findByIdentifier(adminUsername);

  if (!existingAdmin) {
    // C1: Generate admin password
    const password =
      adminPasswordFromEnv && adminPasswordFromEnv.length > 0
        ? adminPasswordFromEnv
        : randomBytes(32).toString("base64url");

    // R3: Hash with bcrypt cost 12
    const credentialHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // C2: Create admin principal
    await repos.principalRepo.create({
      identifier: adminUsername,
      subjectType: "user",
      roleKeys: ["admin"],
      directPermissions: [],
      credentialHash,
    });

    // Log password exactly once — never persist in plaintext.
    // When ADMIN_PASSWORD is supplied, avoid echoing the secret.
    if (adminPasswordFromEnv && adminPasswordFromEnv.length > 0) {
      console.log("═══════════════════════════════════════════════════════");
      console.log("  ADMIN CREDENTIALS (first boot — from environment)");
      console.log(`  Username: ${adminUsername}`);
      console.log("  Password source: ADMIN_PASSWORD");
      console.log("═══════════════════════════════════════════════════════");
    } else {
      console.log("═══════════════════════════════════════════════════════");
      console.log("  ADMIN CREDENTIALS (first boot — save these now!)");
      console.log(`  Username: ${adminUsername}`);
      console.log(`  Password: ${password}`);
      console.log("═══════════════════════════════════════════════════════");
    }
  } else if (adminPasswordFromEnv && adminPasswordFromEnv.length > 0) {
    // Keep test/runtime environments deterministic when ADMIN_PASSWORD is provided.
    const credentialHash = await bcrypt.hash(
      adminPasswordFromEnv,
      BCRYPT_COST_FACTOR,
    );
    await repos.principalRepo.updateCredentialHashByIdentifier(
      adminUsername,
      credentialHash,
    );
  }

  // R4: Sync all role → permission grants (idempotent)
  for (const role of ROLE_DEFINITIONS) {
    for (const permissionKey of role.permissions) {
      await repos.grantRepo.upsertGrant({
        granteeType: "role",
        granteeKey: role.roleKey,
        permissionKey,
        effect: "ALLOW",
      });
    }
  }
};
