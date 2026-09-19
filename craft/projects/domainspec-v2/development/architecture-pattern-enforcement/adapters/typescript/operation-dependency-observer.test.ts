import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  OPERATION_PROFILE_PROPERTY_IDS,
  loadLockedTextSource,
  observeOperationDependencies,
  orderedStringDigest,
  type OperationDependencyObserverInput,
} from "./operation-dependency-observer.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const PROFILE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.json";
const PROFILE_SCHEMA_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.schema.json";
const APPLICABILITY_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/applicability.json";
const POKER_CREATE_PLAYER_REF =
  "validation/poker-team/backend/src/use-cases/player/create-player.ts";

function sha256(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

interface Fixture {
  repoRoot: string;
  sourceRef: string;
  sourceDigest: string;
  adapterRef: string;
  adapterDigest: string;
  cleanup(): void;
}

function fixture(source: string): Fixture {
  const repoRoot = mkdtempSync(join(tmpdir(), "aop-dependency-observer-"));
  mkdirSync(join(repoRoot, "src"), { recursive: true });
  const sourceRef = "src/operation.ts";
  const adapterRef = "src/composition.ts";
  const adapter = "export const playerAdapter = { create: async () => ({ id: 'p1' }) };\n";
  writeFileSync(join(repoRoot, sourceRef), source, "utf8");
  writeFileSync(join(repoRoot, adapterRef), adapter, "utf8");
  return {
    repoRoot,
    sourceRef,
    sourceDigest: sha256(source),
    adapterRef,
    adapterDigest: sha256(adapter),
    cleanup: () => rmSync(repoRoot, { recursive: true }),
  };
}

function inputFor(fx: Fixture): OperationDependencyObserverInput {
  return {
    source: {
      repoRoot: fx.repoRoot,
      sourceRef: fx.sourceRef,
      sourceDigest: fx.sourceDigest,
    },
    factoryName: "createPlayer",
    expectedDependencies: [
      {
        parameterName: "playerRepo",
        contractName: "PlayerRepository",
        role: "repository",
        consumerContractRef: `${fx.sourceRef}#PlayerRepository`,
      },
    ],
    compositionBindings: [
      {
        parameterName: "playerRepo",
        role: "repository",
        adapterRef: fx.adapterRef,
        adapterDigest: fx.adapterDigest,
        suppliedAtCompositionRoot: true,
      },
    ],
    forbiddenConcreteImportPatterns: ["(?:^|/)infrastructure(?:/|$)", "^drizzle"],
  };
}

const POSITIVE_SOURCE = [
  'import type { PlayerRepository } from "./player.repository";',
  'import { normalizeEmail } from "./email-rule";',
  "export const createPlayer = (playerRepo: PlayerRepository) => async (email: string) => {",
  "  const normalized = normalizeEmail(email);",
  "  return playerRepo.create({ email: normalized });",
  "};",
  "",
].join("\n");

test("profile schema is strict and the ordered denominator digest is exact", () => {
  const profilePath = join(REPO_ROOT, PROFILE_REF);
  const schemaPath = join(REPO_ROOT, PROFILE_SCHEMA_REF);
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  assert.deepEqual(profile.property_denominator.ordered_property_ids, [
    ...OPERATION_PROFILE_PROPERTY_IDS,
  ]);
  assert.equal(profile.property_denominator.count, 13);
  assert.equal(
    profile.property_denominator.sha256,
    orderedStringDigest(profile.property_denominator.ordered_property_ids),
  );
  assert.equal(
    profile.property_denominator.sha256,
    "7aa69ff1927bbd26e1cd8bde453baae17cde326881b66f3d93dc48c6f344ab86",
  );
  assert.equal(profile.portable_semantics, false);
  assert.equal(profile.rmt_semantic_policy.rule_ordering, "not-promoted");
  assert.equal(
    sha256(
      readFileSync(
        join(REPO_ROOT, profile.rmt_semantic_policy.operation_contract_ref),
      ),
    ),
    profile.rmt_semantic_policy.operation_contract_sha256,
  );

  const python = [
    "import copy, json, sys",
    "from jsonschema import Draft202012Validator",
    "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
    "profile = json.load(open(sys.argv[2], encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "validator = Draft202012Validator(schema)",
    "assert not list(validator.iter_errors(profile))",
    "invalid = copy.deepcopy(profile)",
    "invalid['properties'][0]['portable_semantics'] = True",
    "assert list(validator.iter_errors(invalid))",
  ].join("\n");
  const run = spawnSync("/usr/bin/python3", ["-c", python, schemaPath, profilePath], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
});

test("every applicability case has one row per property and zero unaccounted IDs", () => {
  const fixtureSet = JSON.parse(
    readFileSync(join(REPO_ROOT, APPLICABILITY_REF), "utf8"),
  );
  assert.equal(
    fixtureSet.denominator_sha256,
    orderedStringDigest(OPERATION_PROFILE_PROPERTY_IDS),
  );
  for (const applicabilityCase of fixtureSet.cases) {
    const ids = applicabilityCase.applicability_results.map(
      (row: { property_id: string }) => row.property_id,
    );
    assert.deepEqual(ids, [...OPERATION_PROFILE_PROPERTY_IDS]);
    assert.equal(new Set(ids).size, OPERATION_PROFILE_PROPERTY_IDS.length);
    const recomposed = [
      ...applicabilityCase.applicable_property_ids,
      ...applicabilityCase.non_applicable_property_ids,
      ...applicabilityCase.owner_blocked_applicability_ids,
    ];
    assert.equal(new Set(recomposed).size, OPERATION_PROFILE_PROPERTY_IDS.length);
    assert.deepEqual(
      [...recomposed].sort(),
      [...OPERATION_PROFILE_PROPERTY_IDS].sort(),
    );
    assert.deepEqual(applicabilityCase.unaccounted_property_ids, []);
  }
});

test("observes a role-specific HOF and exact composition-root binding", () => {
  const fx = fixture(POSITIVE_SOURCE);
  try {
    const input = inputFor(fx);
    const first = observeOperationDependencies(input);
    const second = observeOperationDependencies(input);
    assert.deepEqual(second, first);
    assert.equal(first.result, "pass");
    assert.equal(first.diagnostic, "AOP_DEPENDENCY_PASS");
    assert.equal(first.bindings.length, 1);
    assert.equal(first.observations.length, 1);
    assert.equal(first.runtimeGuaranteeClaimed, false);
    assert.equal(first.bindings[0].dependency_role, "repository");
  } finally {
    fx.cleanup();
  }
});

test("the selected Poker source exposes the expected HOF roles but remains missing without composition evidence", () => {
  const digest = sha256(readFileSync(join(REPO_ROOT, POKER_CREATE_PLAYER_REF)));
  const result = observeOperationDependencies({
    source: { repoRoot: REPO_ROOT, sourceRef: POKER_CREATE_PLAYER_REF, sourceDigest: digest },
    factoryName: "createPlayerUseCase",
    expectedDependencies: [
      {
        parameterName: "playerRepo",
        contractName: "PlayerRepository",
        role: "repository",
        consumerContractRef: `${POKER_CREATE_PLAYER_REF}#PlayerRepository`,
      },
      {
        parameterName: "onEvent",
        contractName: "PlayerManagementEventHandler",
        role: "event-handler",
        consumerContractRef: `${POKER_CREATE_PLAYER_REF}#PlayerManagementEventHandler`,
      },
    ],
    compositionBindings: [],
    forbiddenConcreteImportPatterns: [],
  });
  assert.equal(result.result, "missing");
  assert.equal(result.diagnostic, "AOP_DEPENDENCY_COMPOSITION_BINDING_MISSING");
  assert.deepEqual(
    result.parameters.map((parameter) => parameter.name),
    ["playerRepo", "onEvent"],
  );
});

const hostileCases: ReadonlyArray<{
  name: string;
  source: string;
  mutate?: (input: OperationDependencyObserverInput) => void;
  expectedResult: string;
  expectedDiagnostic: string;
}> = [
  {
    name: "generic Port contract",
    source: POSITIVE_SOURCE,
    mutate: (input) => {
      input.expectedDependencies[0].contractName = "Port<Player>";
    },
    expectedResult: "fail",
    expectedDiagnostic: "AOP_DEPENDENCY_GENERIC_CONTRACT",
  },
  {
    name: "concrete provider import",
    source: POSITIVE_SOURCE.replace(
      'import type { PlayerRepository } from "./player.repository";',
      'import type { PlayerRepository } from "./infrastructure/player.repository";',
    ),
    expectedResult: "fail",
    expectedDiagnostic: "AOP_DEPENDENCY_CONCRETE_PROVIDER_IMPORT",
  },
  {
    name: "service locator",
    source: POSITIVE_SOURCE.replace(
      "const normalized = normalizeEmail(email);",
      "const normalized = normalizeEmail(email); const db = container.resolve('db');",
    ),
    expectedResult: "fail",
    expectedDiagnostic: "AOP_DEPENDENCY_SERVICE_LOCATOR",
  },
  {
    name: "dynamic provider resolution",
    source: POSITIVE_SOURCE.replace(
      "const normalized = normalizeEmail(email);",
      "const normalized = normalizeEmail(email); const provider = await import(email);",
    ),
    expectedResult: "unsupported",
    expectedDiagnostic: "AOP_DEPENDENCY_DYNAMIC_UNSUPPORTED",
  },
  {
    name: "missing role parameter",
    source: POSITIVE_SOURCE.replace("playerRepo: PlayerRepository", "repo: PlayerRepository"),
    expectedResult: "missing",
    expectedDiagnostic: "AOP_DEPENDENCY_ROLE_MISSING",
  },
  {
    name: "missing composition binding",
    source: POSITIVE_SOURCE,
    mutate: (input) => {
      input.compositionBindings = [];
    },
    expectedResult: "missing",
    expectedDiagnostic: "AOP_DEPENDENCY_COMPOSITION_BINDING_MISSING",
  },
];

for (const hostile of hostileCases) {
  test(`rejects or preserves ${hostile.name} for its exact cause`, () => {
    const fx = fixture(hostile.source);
    try {
      const input = inputFor(fx);
      hostile.mutate?.(input);
      const result = observeOperationDependencies(input);
      assert.equal(result.result, hostile.expectedResult);
      assert.equal(result.diagnostic, hostile.expectedDiagnostic);
    } finally {
      fx.cleanup();
    }
  });
}

test("stale source bytes block before dependency observation", () => {
  const fx = fixture(POSITIVE_SOURCE);
  try {
    const input = inputFor(fx);
    input.source.sourceDigest = "0".repeat(64);
    const result = observeOperationDependencies(input);
    assert.equal(result.result, "block");
    assert.equal(result.diagnostic, "AOP_OBSERVER_SOURCE_STALE");
    assert.deepEqual(result.observations, []);
  } finally {
    fx.cleanup();
  }
});

test("lexical path escape blocks before reading outside the selected root", () => {
  const fx = fixture(POSITIVE_SOURCE);
  try {
    const result = loadLockedTextSource({
      repoRoot: fx.repoRoot,
      sourceRef: "../outside.ts",
      sourceDigest: fx.sourceDigest,
    });
    assert.equal(result.result, "block");
    assert.equal(result.diagnostic, "AOP_OBSERVER_SOURCE_PATH_ESCAPE");
  } finally {
    fx.cleanup();
  }
});

test("symlink escape blocks before accepting physically external bytes", () => {
  const fx = fixture(POSITIVE_SOURCE);
  const outsideRoot = mkdtempSync(join(tmpdir(), "aop-dependency-outside-"));
  try {
    const external = "export const outside = true;\n";
    writeFileSync(join(outsideRoot, "outside.ts"), external, "utf8");
    symlinkSync(join(outsideRoot, "outside.ts"), join(fx.repoRoot, "src", "escape.ts"));
    const result = loadLockedTextSource({
      repoRoot: fx.repoRoot,
      sourceRef: "src/escape.ts",
      sourceDigest: sha256(external),
    });
    assert.equal(result.result, "block");
    assert.equal(result.diagnostic, "AOP_OBSERVER_SOURCE_PATH_ESCAPE");
  } finally {
    fx.cleanup();
    rmSync(outsideRoot, { recursive: true });
  }
});
