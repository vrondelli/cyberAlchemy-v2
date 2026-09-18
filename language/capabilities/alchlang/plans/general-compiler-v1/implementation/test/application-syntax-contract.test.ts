import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { defaultDomainSpecPackageRoot } from "../src/domainspec-cli.js";
import { parseDomainSource } from "../src/parser.js";
import { parseFormalProposition, type FormalSignature } from "../src/formal-claim.js";
import { CompilationRejected } from "../src/model.js";

const contract = JSON.parse(readFileSync(path.resolve(defaultDomainSpecPackageRoot(), "../../development/authoring-to-runtime-v1/syntax-cases.json"), "utf8"));
const deferred = new Set(["policy-rule-reference", "state-trigger-guard", "invariant-claim", "operation-rule", "inline-policy", "inline-guard", "competing-invariant"]);
const supported = new Set(["declared-claim-rule", "typed-functions-equality", "legacy-profile-mix", "duplicate-proposition", "missing-claim", "rule-second-condition", "free-variable", "unknown-symbol", "wrong-arity", "wrong-sort", "unknown-sort"]);
function parseCase(c: any) {
  if (c.proposition) {
    const signature: FormalSignature = { sorts: c.signature.sorts.map((name: string) => ({ name })), functions: [], constants: [],
      predicates: c.signature.predicates.map((p: any) => ({ name: p.name, parameter_sorts: p.parameters })) };
    return parseFormalProposition(c.proposition, signature);
  }
  const profile = /^profile /m.test(c.source) ? "" : "profile application-v1\n";
  return parseDomainSource('domain contract "Contract"\nowner fixture-owner\n' + profile + c.source);
}

test("every versioned syntax obligation is explicitly assigned to L0 or deferred C03 breadth", () => {
  const ids = [...contract.positive, ...contract.negative].map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), [...supported, ...deferred].sort());
});
test("L0 consumes the versioned positive and exact-diagnostic negative cases", () => {
  for (const c of contract.positive.filter((c: any) => supported.has(c.id))) assert.doesNotThrow(() => parseCase(c), c.id);
  for (const c of contract.negative.filter((c: any) => supported.has(c.id))) {
    assert.throws(() => parseCase(c), (e: unknown) => e instanceof CompilationRejected && e.issues.some(i => i.code === c.expected), c.id);
  }
});
test("deferred C03 target forms reject rather than silently enter compatibility", () => {
  for (const c of [...contract.positive, ...contract.negative].filter(c => deferred.has(c.id))) {
    assert.throws(() => parseCase(c), (e: unknown) => e instanceof CompilationRejected, c.id);
  }
});
