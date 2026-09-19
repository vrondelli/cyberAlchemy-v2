"""Exact SWU-APE-ENUM-TS-003 product target inventory."""

ADAPTER = "projects/domainspec-v2/impl/architecture-conformance/typescript/adapter/enum/index.ts"

TARGETS = [
    ADAPTER,
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/positive.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/missing-member.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/extra-member.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/duplicate-member.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/empty.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/value-object-shape.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/state-machine-shape.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/native-enum.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/spread-member.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/computed-member.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/fake-provider.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/helper-impersonation.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/standalone-union.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/expected-results.json",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixture-tests/enum/fixture-matrix.test.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/fixture-tests/enum/tsconfig.json",
]
