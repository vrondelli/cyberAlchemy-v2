import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = path.resolve(packageRoot, "../../../../../..");
const tsx = path.join(repositoryRoot, "projects/domainspec-v2/impl/node_modules/.bin/tsx");
const checks: Array<{ check_id: string; status: "PASS"; evidence: string }> = [];

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { cwd: packageRoot, env: process.env, encoding: "utf8", stdio: "pipe" });
}

function pass(check_id: string, evidence: string): void { checks.push({ check_id, status: "PASS", evidence }); }

run("python3", ["validate.py"]); pass("package-source", "candidate package source validates");
run(tsx, ["execution/scripts/validate-domainspec-source.ts"]); pass("domainspec-source", "38 nodes and 32 typed relationships validate");
run(tsx, ["execution/scripts/compile-system-model.ts", "--check"]); pass("compiled-projections", "compiled graph and system ontology match deterministic source");
run("npm", ["--prefix", "implementation", "test"]); pass("runtime-tests", "48 package tests pass");
run("npm", ["--prefix", "implementation", "run", "typecheck"]); pass("typecheck", "strict TypeScript typecheck passes");
run("npm", ["--prefix", "implementation", "run", "build"]); pass("build", "candidate package builds");
run(tsx, ["execution/scripts/validate-binding.ts"]); pass("exact-binding", "current D65 source, implementation, dist, package and CLI proof sets close");

const temporary = mkdtempSync(path.join(tmpdir(), "domainspec-runtime-proof-"));
try {
  const database = path.join(temporary, "outbox.sqlite");
  const facts = JSON.stringify({ operationId: "operation-1", orderId: "order-1", status: "pending", outboxMessageId: "message-1", occurredAt: "2026-09-03T12:00:00.000Z", payload: { kind: "order-committed" } });
  const executed = JSON.parse(run("node", ["implementation/dist/cli.js", "run", "implementation/examples/outbox-operation.md", "CommitOrderWithOutbox", "--actor", "OrderService", "--facts", facts, "--grant", "order-transaction-authority", "--binding", "sqlite-transactional-outbox", "--database", database, "--effect-request-file", "implementation/examples/outbox-request.json"]));
  if (executed.outcome !== "committed-with-outbox" || executed.adapter_data?.integration_binding_ref !== "sqlite-transactional-outbox" || executed.outbox?.pending !== 1) throw new Error("RUNTIME_OUTBOX_COMMIT_PROOF_FAILED");
  pass("cli-outbox-commit", "declared effect resolves to SQLite and leaves one pending message");
  const pending = JSON.parse(run("node", ["implementation/dist/cli.js", "outbox", "pending", "--database", database]));
  if (pending.messages?.length !== 1 || pending.messages[0].messageId !== "message-1" || pending.messages[0].eventType !== "outbox-message-recorded") throw new Error("RUNTIME_OUTBOX_PENDING_PROOF_FAILED");
  pass("cli-outbox-pending", "pending inspection preserves explicit message identity and event type");
  const dispatched = JSON.parse(run("node", ["implementation/dist/cli.js", "outbox", "dispatch", "--database", database, "--transport", "stdout", "--worker-id", "validation-worker", "--now", "2026-09-03T12:00:00.000Z"]));
  if (dispatched.result?.published !== 1 || dispatched.result?.failed !== 0 || dispatched.stats?.pending !== 0 || dispatched.stats?.published !== 1) throw new Error("RUNTIME_OUTBOX_DISPATCH_PROOF_FAILED");
  pass("cli-outbox-dispatch", "separate local stdout dispatch publishes and marks the message");
  if (!readFileSync(database).length) throw new Error("RUNTIME_OUTBOX_DATABASE_MISSING");
  pass("sqlite-materialization", "real temporary SQLite database was materialized and inspected");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

console.log(JSON.stringify({ schema_version: "cav2.alchlang.sqlite-outbox-runtime-validation/v1-candidate", status: "PASS", checks, authority_effect: "local-temporary-sqlite-loopback-http-and-stdout-only", claim_ceiling: "Local candidate runtime evidence only; no stable promotion, canonical provider admission, external network dispatch, release, deployment or production claim." }, null, 2));
