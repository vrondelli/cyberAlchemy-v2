import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { validateCandidateCarrier } from "../src/contracts/candidate-v1.mjs";

const fixtureUrl = new URL("../fixtures/cases/", import.meta.url);

async function readJson(name) {
  return JSON.parse(await readFile(new URL(name, fixtureUrl), "utf8"));
}

function applyMutation(base, mutation) {
  const clone = structuredClone(base);
  const tokens = [...mutation.path.matchAll(/([^\.\[\]]+)|\[(\d+)\]/g)].map((match) =>
    match[2] === undefined ? match[1] : Number(match[2]),
  );
  let target = clone;
  for (const token of tokens.slice(0, -1)) target = target[token];
  target[tokens.at(-1)] = mutation.value;
  return clone;
}

test("accepts the five-node closed candidate carrier", async () => {
  const candidate = await readJson("carrier-minimal.v1.json");
  assert.deepEqual(validateCandidateCarrier(candidate), {
    contract_version: "candidate-v1",
    accepted: true,
    node_count: 5,
    edge_count: 4,
    issues: [],
  });
});

for (const name of ["unknown-kind.v1.json", "authority-effect-forbidden.v1.json"]) {
  test(`rejects the one-condition mutation ${name}`, async () => {
    const base = await readJson("carrier-minimal.v1.json");
    const descriptor = await readJson(name);
    const result = validateCandidateCarrier(applyMutation(base, descriptor.mutation));
    assert.equal(result.accepted, false);
    assert.deepEqual(result.issues.map(({ code }) => code), [descriptor.expected_issue_code]);
  });
}

test("returns byte-stable result bodies for repeated evaluation", async () => {
  const candidate = await readJson("carrier-minimal.v1.json");
  assert.equal(
    JSON.stringify(validateCandidateCarrier(candidate)),
    JSON.stringify(validateCandidateCarrier(structuredClone(candidate))),
  );
});

test("rejects duplicate identifiers", async () => {
  const candidate = await readJson("carrier-minimal.v1.json");
  candidate.nodes[1].node_id = candidate.nodes[0].node_id;
  const result = validateCandidateCarrier(candidate);
  assert.ok(result.issues.some(({ code }) => code === "DUPLICATE_NODE_ID"));
});

test("rejects unresolved endpoints", async () => {
  const candidate = await readJson("carrier-minimal.v1.json");
  candidate.edges[0].target = "MISSING";
  const result = validateCandidateCarrier(candidate);
  assert.deepEqual(result.issues.map(({ code }) => code), ["UNRESOLVED_ENDPOINT"]);
});

test("rejects unknown fields", async () => {
  const candidate = await readJson("carrier-minimal.v1.json");
  candidate.promote = true;
  const result = validateCandidateCarrier(candidate);
  assert.deepEqual(result.issues.map(({ code }) => code), ["UNKNOWN_FIELD"]);
});

test("carrier module has no filesystem writer", async () => {
  const source = await readFile(new URL("../src/contracts/candidate-v1.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|writeFile|mkdir|rename|createWriteStream/);
});
