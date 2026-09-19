import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedSystemBootstrap } from "./seed-system-bootstrap";
import { ROLE_DEFINITIONS } from "../../domain/auth-access-control/role-definitions";

describe("SeedSystemBootstrap", () => {
  const createMockRepos = () => {
    const principals: any[] = [];
    const grants: any[] = [];

    return {
      repos: {
        principalRepo: {
          findById: vi.fn().mockResolvedValue(null),
          findByIdentifier: vi.fn().mockImplementation(async (identifier: string) => {
            return principals.find((p) => p.identifier === identifier) ?? null;
          }),
          verifyCredential: vi.fn().mockResolvedValue(false),
          create: vi.fn().mockImplementation(async (input: any) => {
            const principal = {
              id: "generated-id",
              ...input,
              status: "ACTIVE",
            };
            principals.push({ ...principal, identifier: input.identifier });
            return principal;
          }),
          updateCredentialHashByIdentifier: vi.fn().mockResolvedValue(undefined),
        },
        grantRepo: {
          upsertGrant: vi.fn().mockImplementation(async (grant: any) => {
            const existing = grants.find(
              (g) =>
                g.granteeKey === grant.granteeKey &&
                g.permissionKey === grant.permissionKey,
            );
            if (existing) return existing;
            const newGrant = {
              grantId: `grant-${grants.length}`,
              ...grant,
              createdAt: new Date(),
            };
            grants.push(newGrant);
            return newGrant;
          }),
        },
      },
      principals,
      grants,
    };
  };

  beforeEach(() => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    vi.restoreAllMocks();
  });

  it("creates admin principal on first boot", async () => {
    const { repos } = createMockRepos();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);

    expect(repos.principalRepo.create).toHaveBeenCalledOnce();
    const createCall = repos.principalRepo.create.mock.calls[0][0];
    expect(createCall.identifier).toBe("admin");
    expect(createCall.subjectType).toBe("user");
    expect(createCall.roleKeys).toEqual(["admin"]);
    expect(createCall.credentialHash).toBeTruthy();
    expect(createCall.credentialHash.startsWith("$2")).toBe(true);

    // Password logged to stdout
    const logCalls = logSpy.mock.calls.flat().join("\n");
    expect(logCalls).toContain("ADMIN CREDENTIALS");
    expect(logCalls).toContain("Username: admin");
    expect(logCalls).toContain("Password:");

    logSpy.mockRestore();
  });

  it("uses ADMIN_USERNAME env var when set", async () => {
    process.env.ADMIN_USERNAME = "superadmin";
    const { repos } = createMockRepos();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);

    expect(repos.principalRepo.findByIdentifier).toHaveBeenCalledWith(
      "superadmin",
    );
    expect(repos.principalRepo.create.mock.calls[0][0].identifier).toBe(
      "superadmin",
    );
  });

  it("skips admin creation when admin already exists", async () => {
    const { repos } = createMockRepos();
    repos.principalRepo.findByIdentifier.mockResolvedValue({
      id: "existing-admin",
      identifier: "admin",
      subjectType: "user",
      status: "ACTIVE",
      roleKeys: ["admin"],
      directPermissions: [],
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);

    expect(repos.principalRepo.create).not.toHaveBeenCalled();
    expect(
      repos.principalRepo.updateCredentialHashByIdentifier,
    ).not.toHaveBeenCalled();
    const logCalls = logSpy.mock.calls.flat().join("\n");
    expect(logCalls).not.toContain("Password:");

    logSpy.mockRestore();
  });

  it("seeds all role permission grants", async () => {
    const { repos, grants } = createMockRepos();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);

    // Count expected grants from role definitions
    const expectedGrantCount = ROLE_DEFINITIONS.reduce(
      (sum, role) => sum + role.permissions.length,
      0,
    );
    expect(repos.grantRepo.upsertGrant).toHaveBeenCalledTimes(
      expectedGrantCount,
    );

    // Verify admin grants
    const adminGrants = grants.filter((g) => g.granteeKey === "admin");
    expect(adminGrants.length).toBe(
      ROLE_DEFINITIONS.find((r) => r.roleKey === "admin")!.permissions.length,
    );

    // All grants are ALLOW with granteeType=role
    for (const grant of grants) {
      expect(grant.granteeType).toBe("role");
      expect(grant.effect).toBe("ALLOW");
    }
  });

  it("grant sync is idempotent — no duplicates on repeated calls", async () => {
    const { repos, grants } = createMockRepos();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);
    const grantCountAfterFirst = grants.length;

    // Simulate admin already exists for second call
    repos.principalRepo.findByIdentifier.mockResolvedValue({
      id: "existing-admin",
      identifier: "admin",
      subjectType: "user",
      status: "ACTIVE",
      roleKeys: ["admin"],
      directPermissions: [],
    });

    await seedSystemBootstrap(repos);

    // Grants should not be duplicated
    expect(grants.length).toBe(grantCountAfterFirst);
  });

  it("generates password with sufficient entropy (>= 24 chars)", async () => {
    const { repos } = createMockRepos();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);

    const passwordLine = logSpy.mock.calls
      .flat()
      .find((line) => typeof line === "string" && line.includes("Password:"));
    expect(passwordLine).toBeDefined();
    const password = passwordLine!.replace(/.*Password:\s*/, "").trim();
    expect(password.length).toBeGreaterThanOrEqual(24);

    logSpy.mockRestore();
  });

  it("uses ADMIN_PASSWORD on first boot without logging plaintext", async () => {
    process.env.ADMIN_PASSWORD = "e2e-admin-password";
    const { repos } = createMockRepos();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await seedSystemBootstrap(repos);

    expect(repos.principalRepo.create).toHaveBeenCalledOnce();
    const logCalls = logSpy.mock.calls.flat().join("\n");
    expect(logCalls).toContain("Password source: ADMIN_PASSWORD");
    expect(logCalls).not.toContain("Password: e2e-admin-password");

    logSpy.mockRestore();
  });

  it("refreshes existing admin credential when ADMIN_PASSWORD is provided", async () => {
    process.env.ADMIN_PASSWORD = "e2e-admin-password";
    const { repos } = createMockRepos();
    repos.principalRepo.findByIdentifier.mockResolvedValue({
      id: "existing-admin",
      identifier: "admin",
      subjectType: "user",
      status: "ACTIVE",
      roleKeys: ["admin"],
      directPermissions: [],
    });

    await seedSystemBootstrap(repos);

    expect(repos.principalRepo.create).not.toHaveBeenCalled();
    expect(
      repos.principalRepo.updateCredentialHashByIdentifier,
    ).toHaveBeenCalledTimes(1);
    expect(
      repos.principalRepo.updateCredentialHashByIdentifier,
    ).toHaveBeenCalledWith("admin", expect.stringMatching(/^\$2/));
  });
});
