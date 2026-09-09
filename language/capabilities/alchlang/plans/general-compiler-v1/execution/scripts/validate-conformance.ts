import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = path.resolve(packageRoot, "../../../../../..");
const tsx = path.join(repositoryRoot, "projects/domainspec-v2/impl/node_modules/.bin/tsx");
const evidencePath = path.join(packageRoot, "evidence/conformance.json");
const bindingPath = path.join(packageRoot, "evidence/construction-binding.candidate.json");
const sha256 = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");

function run(command: string, args: string[]): void {
  execFileSync(command, args, { cwd: packageRoot, env: process.env, encoding: "utf8", stdio: "pipe" });
}

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : [target];
  });
}

const failures: string[] = [];
const check = (condition: boolean, message: string): void => { if (!condition) failures.push(message); };

run("python3", ["validate.py"]);
const workPackValidation = spawnSync("python3", ["validate-work-pack.py"], { cwd: packageRoot, env: process.env, encoding: "utf8" });
const workPackBlocked = workPackValidation.status !== 0 && workPackValidation.stderr.includes("source-drift:../../../../../../projects/domainspec-v2/impl/cli/src/input/project-model.ts");
run(tsx, ["execution/scripts/validate-domainspec-source.ts"]);
run(tsx, ["execution/scripts/compile-system-model.ts", "--check"]);
run("npm", ["--prefix", "implementation", "test"]);
run("npm", ["--prefix", "implementation", "run", "typecheck"]);
run("npm", ["--prefix", "implementation", "run", "build"]);
run(tsx, ["execution/scripts/validate-binding.ts"]);

const availablePatterns = JSON.parse(execFileSync("node", ["implementation/dist/cli.js", "patterns", "--available"], { cwd: packageRoot, env: process.env, encoding: "utf8" }));
const blockedPatterns = JSON.parse(execFileSync("node", ["implementation/dist/cli.js", "patterns", "--blocked"], { cwd: packageRoot, env: process.env, encoding: "utf8" }));
check(availablePatterns.patterns.some((item: { pattern_id: string }) => item.pattern_id === "operation-port"), "operation-port is not available");
check(availablePatterns.patterns.some((item: { pattern_id: string }) => item.pattern_id === "transactional-outbox"), "transactional-outbox is not available");
check(!blockedPatterns.patterns.some((item: { pattern_id: string }) => item.pattern_id === "transactional-outbox"), "available transactional-outbox appears blocked");
const selectedOutbox = JSON.parse(execFileSync("node", ["implementation/dist/cli.js", "pattern", "transactional-outbox"], { cwd: packageRoot, env: process.env, encoding: "utf8" }));
check(selectedOutbox.status === "generatable" && selectedOutbox.pattern?.integration_binding?.id === "sqlite-transactional-outbox", "transactional-outbox selection did not resolve the SQLite binding");

const forbidden = /credit-release-reference|inventory-reservation-reference|production-rollback-sandbox|customer-credit-release|inventory-reservation|production-rollback/;
for (const file of sourceFiles(path.join(packageRoot, "implementation/src"))) {
  check(!forbidden.test(readFileSync(file, "utf8")), `domain/profile branch token found in ${path.relative(packageRoot, file)}`);
}

const bindingBytes = readFileSync(bindingPath);
const binding = JSON.parse(bindingBytes.toString("utf8"));
const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
const cliRoot = mkdtempSync(path.join(tmpdir(), "domainspec-conformance-"));
try {
  const source = "implementation/examples/customer-approval.md";
  const output = path.join(cliRoot, "generated");
  run("node", ["implementation/dist/cli.js", "build", source, "--out", output]);
  check(readFileSync(path.join(output, "manifest.json"), "utf8") === readFileSync(path.join(packageRoot, binding.d65_chain.exact_implementation.cli_proofs[0].manifest_ref), "utf8"), "fresh CLI build manifest differs from bound proof");
  const runOutput = execFileSync("node", ["implementation/dist/cli.js", "run", source, "ReleaseCredit", "--actor", "CreditOperator", "--facts", "{\"customerId\":\"c-1\",\"riskScore\":600,\"status\":\"approved\",\"amount\":100}", "--grant", "credit-release-authority", "--adapter", "memory"], { cwd: packageRoot, env: process.env, encoding: "utf8" });
  const actionResult = JSON.parse(runOutput);
  check(actionResult.status === "executed" && actionResult.rule_results["approved-release"] === true && actionResult.permission_results["release-credit"] === true, "fresh CLI run did not execute the guarded action");
  const outboxDatabase = path.join(cliRoot, "outbox.sqlite");
  const outboxFacts = JSON.stringify({ operationId: "operation-1", orderId: "order-1", status: "pending", outboxMessageId: "message-1", occurredAt: "2026-09-03T12:00:00.000Z", payload: { kind: "order-committed" } });
  const outboxRun = JSON.parse(execFileSync("node", ["implementation/dist/cli.js", "run", "implementation/examples/outbox-operation.md", "CommitOrderWithOutbox", "--actor", "OrderService", "--facts", outboxFacts, "--grant", "order-transaction-authority", "--binding", "sqlite-transactional-outbox", "--database", outboxDatabase, "--effect-request-file", "implementation/examples/outbox-request.json"], { cwd: packageRoot, env: process.env, encoding: "utf8" }));
  check(outboxRun.outcome === "committed-with-outbox" && outboxRun.adapter_data?.integration_binding_ref === "sqlite-transactional-outbox" && outboxRun.outbox?.pending === 1, "fresh CLI Outbox run did not resolve and commit the declared effect");
  const pending = JSON.parse(execFileSync("node", ["implementation/dist/cli.js", "outbox", "pending", "--database", outboxDatabase], { cwd: packageRoot, env: process.env, encoding: "utf8" }));
  check(pending.messages?.length === 1 && pending.messages[0].messageId === "message-1" && pending.messages[0].eventType === "outbox-message-recorded", "pending inspection did not preserve the explicit message contract");
  const dispatched = JSON.parse(execFileSync("node", ["implementation/dist/cli.js", "outbox", "dispatch", "--database", outboxDatabase, "--transport", "stdout", "--worker-id", "conformance-worker", "--now", "2026-09-03T12:00:00.000Z"], { cwd: packageRoot, env: process.env, encoding: "utf8" }));
  check(dispatched.result?.published === 1 && dispatched.result?.failed === 0 && dispatched.stats?.pending === 0 && dispatched.stats?.published === 1, "local stdout dispatch did not publish and mark the message");
} finally { rmSync(cliRoot, { recursive: true, force: true }); }

check(evidence.schema_version === "cav2.alchlang.operation-pattern-registry.conformance/v1", "unexpected conformance schema_version");
check(evidence.status === "not_evaluable", "conformance status must preserve the Work-Pack currency blocker");
check(evidence.binding.ref === "evidence/construction-binding.candidate.json", "binding ref mismatch");
check(evidence.binding.sha256 === sha256(bindingBytes), "binding digest drift");
check(evidence.binding.binding_id === binding.binding_id, "binding id mismatch");
check(evidence.implementation.material_tree_sha256 === binding.d65_chain.exact_implementation.source_config_tests_example.tree_sha256, "implementation material tree digest mismatch");
check(evidence.implementation.dist_tree_sha256 === binding.d65_chain.exact_implementation.built_dist.tree_sha256, "dist tree digest mismatch");
check(evidence.package.tarball_sha256 === binding.d65_chain.exact_implementation.local_tarball.sha256, "tarball digest mismatch");
check(binding.d65_chain.conformance === null, "binding must remain pending and immutable");
check(binding.dependency_closure.conformance_pending === true, "binding conformance_pending must remain true");
check(workPackBlocked, "expected exact Work-Pack loader-source drift was not observed");
check(evidence.checks.every((item: { status: string }) => item.status === "PASS" || item.status === "not_evaluable"), "unexpected conformance check status");
check(evidence.checks.some((item: { check_id: string; status: string }) => item.check_id === "work-pack-currency" && item.status === "not_evaluable"), "Work-Pack currency blocker is not represented");
check(evidence.authority_effect === "none", "authority_effect must remain none");
check(evidence.claims.product_capability === "extension-candidate-not-product-proof", "product claim separation mismatch");
check(evidence.claims.business_ontology === "extension-candidate-not-runtime-admission", "ontology claim separation mismatch");
check(evidence.claims.domainspec === "source-local-valid-not-profile-admission", "DomainSpec claim separation mismatch");
check(evidence.claims.implementation === "local-runtime-cli-source-conformant-candidate", "implementation claim separation mismatch");
check(evidence.claims.operation_pattern_registry === "source-local-conformant-candidate", "pattern registry claim separation mismatch");
check(evidence.claims.architecture_pattern_stability === "candidate-not-owner-promoted", "pattern stability claim separation mismatch");
check(evidence.claims.release === "not-authorized", "release claim separation mismatch");

if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", failures, authority_effect: "none" }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  schema_version: "cav2.alchlang.operation-pattern-registry.conformance-validation/v1",
  status: "not_evaluable",
  conformance_id: evidence.conformance_id,
  binding_sha256: evidence.binding.sha256,
  implementation_tree_sha256: evidence.implementation.material_tree_sha256,
  tarball_sha256: evidence.package.tarball_sha256,
  checks: evidence.checks.length,
  authority_effect: "none",
  claim_ceiling: evidence.claim_ceiling
}, null, 2));
process.exitCode = 1;
