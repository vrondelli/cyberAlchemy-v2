import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {test} from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../upstream/overlay/packages/dashboard/src/oew/ui-api");
const profile = JSON.parse(await readFile(resolve(root, "profile.v0.1.json"), "utf8"));
const inventory = JSON.parse(await readFile(resolve(root, "inventory.v0.1.json"), "utf8"));
const compiler = await import(pathToFileURL(resolve(root, "compileInventory.ts")));
const validator = await import(pathToFileURL(resolve(root, "validateInventory.ts")));
const clone = (value) => JSON.parse(JSON.stringify(value));

test("the OEW-owned snapshot compiles byte-for-byte to 58 bounded records", async () => {
  const compiled = await compiler.compileUiInventory(profile);
  assert.deepEqual(compiled, inventory);
  assert.deepEqual(inventory.counts.by_meta_type, {
    Page: 1,
    Layout: 1,
    Component: 13,
    "View Model": 11,
    Hook: 6,
    Form: 1,
    Action: 10,
    Guard: 4,
    Binding: 5,
    Mapping: 6,
  });
  assert.deepEqual(inventory.counts.by_realization_swu, {
    "UOVARR-005": 19,
    "UOVARR-006": 36,
    "UOVARR-007": 1,
    "UOVARR-009": 2,
  });
  assert.equal(inventory.records.filter((record) => record.realization_state === "planned").length, 39);
  assert.equal(inventory.records.filter((record) => record.realization_state === "described-and-validated").length, 19);
});

test("the inventory validates its digests, special dispositions, and claim ceiling", async () => {
  const receipt = await validator.validateUiInventory(inventory, profile);
  assert.deepEqual(receipt, {
    result: "pass",
    contracts: 58,
    current_realizations: 19,
    planned_successors: 39,
    inventory_digest: inventory.inventory_digest,
    authority_effect: "none",
  });
  assert.equal(inventory.counts.adapter_nodes, 0);
  assert.equal(inventory.counts.general_state_indicator_nodes, 0);
  assert.doesNotMatch(JSON.stringify({profile, inventory}), /projects\/domainspec-v2\//);
  assert.doesNotMatch(JSON.stringify(inventory), /v1\.2/);
});

test("future work, authority, and cross-project runtime paths cannot be overclaimed", async () => {
  const future = clone(inventory);
  const planned = future.records.find((record) => record.realization_swu === "UOVARR-006");
  planned.realization_state = "described-and-validated";
  planned.realization_owner = "future.ts#notImplemented";
  await assert.rejects(validator.validateUiInventory(future, profile), /FUTURE_REALIZATION_OVERCLAIM/);

  const authority = clone(inventory);
  authority.records[0].authority_effect = "promotion";
  await assert.rejects(validator.validateUiInventory(authority, profile), /RECORD_AUTHORITY_LEAK/);

  const external = clone(inventory);
  external.records[0].realization_owner = "projects/domainspec-v2/runtime.ts";
  await assert.rejects(validator.validateUiInventory(external, profile), /RUNTIME_FORBIDDEN_PREFIX/);
});

test("formation digest and deterministic output drift are rejected", async () => {
  const formation = clone(inventory);
  formation.records[0].formation_digest = "not-a-digest";
  await assert.rejects(validator.validateUiInventory(formation, profile), /FORMATION_DIGEST/);

  const nondeterministic = clone(inventory);
  nondeterministic.inventory_digest = "0".repeat(64);
  await assert.rejects(validator.validateUiInventory(nondeterministic, profile), /NON_DETERMINISTIC_OUTPUT/);
});
