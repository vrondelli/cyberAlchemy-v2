#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const designRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const repositoryRoot = path.resolve(designRoot, "../../../../../../../..");
const n02Root = "continuations/N02-ORCHESTRATES-ORDER-AUTHORSHIP";
const n03Root = "continuations/N03-ORCHESTRATES-DUPLICATE-AUTHORSHIP";
const n04Root = "continuations/N04-OWNS-SELF-EDGE-POLICY";
const n05Root = "continuations/N05-OWNS-CYCLE-POLICY-GOVERNANCE";
const n06Root = "continuations/N06-OWNS-UNIFORM-LONGER-CYCLE-BEHAVIOR";
const n07Root = "continuations/N07-OWNS-MIXED-DIMENSION-CLOSED-PATH-BEHAVIOR";
const n08Root = "continuations/N08-OWNS-DUPLICATE-AUTHORSHIP";
const n09Root = "continuations/N09-OWNS-INVERSE-DIMENSION-PRESERVATION";
const n10Root = "continuations/N10-OWNED-BY-MATERIALIZATION-POLICY";
const n11Root = "continuations/N11-OWNS-CYCLE-PARTIAL-VIEW-VERDICT";
const n12Root = "continuations/N12-OWNS-CYCLE-CLOSURE-PROOF-SHAPE";
const n13Root = "continuations/N13-OWNS-PATH-CONSEQUENCE-GOVERNANCE";
const n14Root = "continuations/N14-OWNS-LIFECYCLE-PATH-CONSEQUENCE-BEHAVIOR";
const n15Root = "continuations/N15-OWNS-CUSTODY-PATH-CONSEQUENCE-BEHAVIOR";
const n16Root = "continuations/N16-OWNS-WRITE-RESPONSIBILITY-PATH-CONSEQUENCE-BEHAVIOR";
const n17Root = "continuations/N17-OWNS-MIXED-DIMENSION-PATH-CONSEQUENCE-BEHAVIOR";
const n18Root = "continuations/N18-OWNS-MIXED-DIMENSION-CLOSED-PATH-SELF-REACHABILITY-BEHAVIOR";
const n19Root = "continuations/N19-BELONGS-TO-SELF-EDGE-POLICY-GOVERNANCE";
const n20Root = "continuations/N20-BELONGS-TO-UNIFORM-SELF-EDGE-BEHAVIOR";
const n21Root = "continuations/N21-BELONGS-TO-LONGER-CYCLE-POLICY-GOVERNANCE";
const n22Root = "continuations/N22-BELONGS-TO-UNIFORM-LONGER-CYCLE-BEHAVIOR";
const n23Root = "continuations/N23-BELONGS-TO-MIXED-KIND-CLOSED-PATH-BEHAVIOR";
const n24Root = "continuations/N24-BELONGS-TO-DUPLICATE-AUTHORSHIP";
const n25Root = "continuations/N25-BELONGS-TO-SAME-KIND-CYCLE-PARTIAL-VIEW-VERDICT";
const n26Root = "continuations/N26-BELONGS-TO-SAME-KIND-CYCLE-CLOSURE-PROOF-SHAPE";
const n27Root = "continuations/N27-BELONGS-TO-PATH-CONSEQUENCE-POLICY-GOVERNANCE";
const n28Root = "continuations/N28-BELONGS-TO-CLASSIFICATION-PATH-CONSEQUENCE-BEHAVIOR";
const n29Root = "continuations/N29-BELONGS-TO-HOME-ASSIGNMENT-PATH-CONSEQUENCE-BEHAVIOR";
const n30Root = "continuations/N30-BELONGS-TO-MIXED-KIND-PATH-CONSEQUENCE-BEHAVIOR";
const n31Root = "continuations/N31-BELONGS-TO-MIXED-KIND-CLOSED-PATH-SELF-REACHABILITY-BEHAVIOR";
const n32Root = "continuations/N32-PRODUCES-DUPLICATE-AUTHORSHIP";
const n33Root = "continuations/N33-EMITS-DUPLICATE-AUTHORSHIP";
const n34Root = "continuations/N34-EMITS-OCCURRENCE-SEMANTICS";
const n35Root = "continuations/N35-EMITS-ORDERING";
const failures = [];
const checks = [];

function pass(name) { checks.push({ name, status: "pass" }); }
function fail(name, message) {
  failures.push(`${name}: ${message}`);
  checks.push({ name, status: "fail", message });
}
function assert(name, condition, message) { condition ? pass(name) : fail(name, message); }
function absolute(relative) { return path.join(designRoot, relative); }
function repoAbsolute(relative) { return path.join(repositoryRoot, relative); }
function readJson(relative) { return JSON.parse(fs.readFileSync(absolute(relative), "utf8")); }
function readText(relative) { return fs.readFileSync(absolute(relative), "utf8"); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function digestBytes(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function digestFile(relative) { return digestBytes(fs.readFileSync(absolute(relative))); }
function digestValue(value) { return digestBytes(Buffer.from(canonical(value), "utf8")); }
function without(document, key) { const result = { ...document }; delete result[key]; return result; }
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(resolved) : [resolved];
  });
}
function run(name, command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, encoding: "utf8" });
  assert(name, result.status === 0, `exit ${result.status}: ${(result.stderr || result.stdout).trim()}`);
  return result;
}

const n01RequestPath = "decisions/BMC-REL-NONNUMERIC-01-OPTION-ADMISSIBILITY-REQUEST.json";
const n01ReceiptPath = "decisions/BMC-REL-NONNUMERIC-01-OPTION-ADMISSIBILITY-RECEIPT.json";
const n01SelectionPath = "decisions/BMC-REL-NONNUMERIC-01-OWNER-SELECTION-RECEIPT.json";
assert("historical N01 request bytes", digestFile(n01RequestPath) === "e1f18466e2fb8da057392b370155a5acefdb6314b42d0d7f64cfafc5f7b4b1ef", "historical request changed");
assert("historical N01 receipt bytes", digestFile(n01ReceiptPath) === "0c772a9e7317b230581d673b64ef948df044cdee909ff6afba4b4f2d641b4e0e", "historical receipt changed");
assert("historical N01 selection bytes", digestFile(n01SelectionPath) === "3b6233ada4fb6f69c6fec57176a2915853f4c0951730afbda60f55d1339d7820", "historical selection changed");
const n01Request = readJson(n01RequestPath);
const n01Receipt = readJson(n01ReceiptPath);
const n01 = readJson(n01SelectionPath);
assert("historical N01 requestDigest", digestValue(n01Request) === n01Receipt.requestDigest && n01Receipt.requestDigest === "9ea5f2e1172b99c53624b65ab18f4c834110f93f2ddf687666bd90a1ac1084ec", "historical requestDigest mismatch");
assert("N01 selection response", n01.selection.response === "A" && n01.selection.selected_option_id === "BMC-REL-NONNUMERIC-01-A-REJECT-DUPLICATE-AUTHORED-CREATES", "N01 is not exact A");
assert("N01 selection owner", n01.selection.selected_by === "user", "N01 owner mismatch");
assert("N01 recording timestamp semantics", n01.selection.exact_response_timestamp_exposed === false && n01.selection.selection_recorded_at === "2026-08-23T21:27:49+01:00" && n01.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N01 timestamp overstated");
assert("N01 admissibility binding", n01.admissibility_binding.request_sha256 === digestFile(n01RequestPath) && n01.admissibility_binding.receipt_sha256 === digestFile(n01ReceiptPath) && n01.admissibility_binding.requestDigest === n01Receipt.requestDigest, "N01 binding mismatch");
assert("N01 selected option admitted", n01.admissibility_binding.selected_option_admitted === true && n01.admissibility_binding.selected_option_presented === true && n01.admissibility_binding.hazard_class === "authority" && n01.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N01 selected option was not validly gated");
assert("N01 narrow effect", n01.selection_effect.candidate_design_policy.includes("Reject an exact duplicate authored canonical creates proposition") && n01.authorization_boundary.global_duplicate_policy_selected === false && n01.authorization_boundary.implementation_authorized === false, "N01 scope widened");

assert("initial selection result preserved", digestFile("DESIGN-SELECTION-RESULT.json") === "1fece11cc9c8bf127715a708a3073dc784e57448bca17c6318f5a5eca7c4498c", "initial selection result changed");
const initialManifest = readJson("DESIGN-SCOPE-MANIFEST.json");
assert("initial denominator preserved", new Set(initialManifest.source_contracts.map((source) => source.path)).size === 14, "initial denominator changed");

const n02RequestPath = `${n02Root}/decisions/BMC-REL-NONNUMERIC-02-OPTION-ADMISSIBILITY-REQUEST.json`;
const n02ReceiptPath = `${n02Root}/decisions/BMC-REL-NONNUMERIC-02-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n02SelectionPath = `${n02Root}/decisions/BMC-REL-NONNUMERIC-02-OWNER-SELECTION-RECEIPT.json`;
assert("historical N02 selection result bytes", digestFile(`${n02Root}/DESIGN-SELECTION-RESULT.json`) === "5c04b86d218222dc7f0cdaa5617f0e3e14cc58e0710b87af23c384caaf657d13", "historical N02 selection result changed");
assert("historical N02 request bytes", digestFile(n02RequestPath) === "7019723e5f43f6a365e1d73b0df939d907f88db2f7e4c16013f24975cc603d9c", "historical N02 request changed");
assert("historical N02 receipt bytes", digestFile(n02ReceiptPath) === "630ee4af9699e236b0d4ef3c784bc354fdd4636718ae5a582f029bf9315b103f", "historical N02 receipt changed");
assert("N02 immutable selection bytes", digestFile(n02SelectionPath) === "5b65509a239c19b47b09a78853ae090a32743c14957290b5fdd0e8d9a321b1c5", "N02 selection receipt changed");
const n02Request = readJson(n02RequestPath);
const n02Receipt = readJson(n02ReceiptPath);
const n02 = readJson(n02SelectionPath);
assert("historical N02 requestDigest", digestValue(n02Request) === n02Receipt.requestDigest && n02Receipt.requestDigest === "b7ec08e95dcf3513716cc16b77023bdf297e53ff3b8b0a3b976d4c496988b477", "N02 requestDigest mismatch");
assert("N02 selection response", n02.selection.response === "A" && n02.selection.selected_option_id === "BMC-REL-NONNUMERIC-02-A-ORDERED-STEP-IDS-SOLE-AUTHOR", "N02 is not exact A");
assert("N02 selection owner", n02.selection.selected_by === "user", "N02 owner mismatch");
assert("N02 recording timestamp semantics", n02.selection.exact_response_timestamp_exposed === false && n02.selection.selection_recorded_at === "2026-08-23T21:58:54+01:00" && n02.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N02 timestamp overstated");
assert("N02 admissibility binding", n02.admissibility_binding.request_sha256 === digestFile(n02RequestPath) && n02.admissibility_binding.receipt_sha256 === digestFile(n02ReceiptPath) && n02.admissibility_binding.requestDigest === n02Receipt.requestDigest, "N02 binding mismatch");
assert("N02 selected option admitted", n02.admissibility_binding.selected_option_admitted === true && n02.admissibility_binding.selected_option_presented === true && n02.admissibility_binding.hazard_class === "authority" && n02.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N02 selected option was not validly gated");
assert("N02 exact bounded effect", n02.selection_effect.candidate_design_policy.includes("sole authored total order") && n02.selection_effect.coverage.includes("exactly once") && n02.selection_effect.steps_array_position === "non-semantic" && n02.selection_effect.after_authorship.includes("not co-authoritative"), "N02 effect incomplete");
assert("N02 authority ceiling", n02.authorization_boundary.n03_or_later_owner_choice_made === false && n02.authorization_boundary.packet_mutation_authorized === false && n02.authorization_boundary.implementation_authorized === false && n02.authorization_boundary.repository_authority_effect === "none", "N02 scope widened");

const manifestPath = `${n03Root}/DESIGN-SCOPE-MANIFEST.json`;
const denominatorPath = `${n03Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const selectionPath = `${n03Root}/DESIGN-SELECTION-RESULT.json`;
const manifest = readJson(manifestPath);
assert("N03 manifest input digest", digestValue(without(manifest, "input_digest")) === manifest.input_digest && manifest.input_digest === "7a7eb6fec86aa3420fe92c5845bad91b96e0084b611c92fb6c9ec7de52631acb", "canonical digest mismatch");
assert("N03 manifest closed", manifest.unknowns.length === 0 && manifest.authored_by !== "invoke-design-scope-extractor", "manifest is not closed and independent");
const sources = new Map(manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N03 exact denominator count", sources.size === 14, `expected 14, got ${sources.size}`);
for (const [relative, expected] of sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N03 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}

const denominator = readJson(denominatorPath);
assert("N03 denominator verdict", denominator.verdict === "pass", "denominator failed");
assert("N03 denominator digest", digestValue(without(denominator, "receipt_digest")) === denominator.receipt_digest && denominator.receipt_digest === "f067c9592d417b4dcd003a6d7da28b8864cf24f4eee2aa83f6c8e2df5e8f89ed", "denominator digest mismatch");
assert("N03 denominator complete", denominator.inspected_selectors.length === 14 && denominator.unbound_signal_ids.length === 0 && denominator.missing_detector_inputs.length === 0, "denominator incomplete");
const selection = readJson(selectionPath);
assert("N03 selection verdict", selection.verdict === "pass" && selection.evidence_state === "design-validator-pass", "selection failed");
assert("N03 selection fixed point", selection.fixed_point === true && selection.pass_1_digest === selection.pass_2_digest && selection.pass_1_digest === "a2455ca6fada09f3bdf9388f9ecbe4cd8366a0f8734a4548a41d20723e7437d3", "selection is not the expected fixed point");
assert("N03 selection digest", digestValue(without(selection, "result_digest")) === selection.result_digest && selection.result_digest === "2243fd6de228e8bbc8e02f1448fb6cff7d9827ed003a3d088a008426e183943c", "selection digest mismatch");
assert("N03 selected outputs", JSON.stringify(selection.selected_outputs) === JSON.stringify(["architecture", "validation-contracts"]), "unexpected outputs");

const n03RequestPath = `${n03Root}/decisions/BMC-REL-NONNUMERIC-03-OPTION-ADMISSIBILITY-REQUEST.json`;
const n03ReceiptPath = `${n03Root}/decisions/BMC-REL-NONNUMERIC-03-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n03SelectionPath = `${n03Root}/decisions/BMC-REL-NONNUMERIC-03-OWNER-SELECTION-RECEIPT.json`;
const n03Request = readJson(n03RequestPath);
const n03Receipt = readJson(n03ReceiptPath);
const n03OwnerSelection = readJson(n03SelectionPath);
assert("historical N03 request bytes", digestFile(n03RequestPath) === "e5ada0f7d7944ad9bcaad7b8459589ac6ca3ba37e4ae2fd702a94ab71dc9235e", "historical N03 request changed");
assert("historical N03 receipt bytes", digestFile(n03ReceiptPath) === "1ed829090798a43c50213c8a33d440cc25e7d088c58ac7e2dab47d618f9619d9", "historical N03 receipt changed");
assert("N03 immutable selection bytes", digestFile(n03SelectionPath) === "9cd246b2b90a29e1a7304e34487a2c0b9b141bbedc731caa27a6ae085653b6dc", "N03 selection receipt changed");
assert("N03 requestDigest", digestValue(n03Request) === n03Receipt.requestDigest && n03Receipt.requestDigest === "4d1459e5e67142c20403bc5954e5000bf04c86be0bb5712b8a060c41829fef27", "prefilter binding mismatch");
assert("N03 gate route", n03Receipt.routeOutcome === "gate" && n03Receipt.decisionGateRequired === true, "N03 did not route to gate");
const expectedPresented = [
  "BMC-REL-NONNUMERIC-03-A-REJECT-DUPLICATE-AUTHORED-ORCHESTRATES",
  "BMC-REL-NONNUMERIC-03-B-COALESCE-EXACT-DUPLICATE-AUTHORED-ORCHESTRATES",
  "BMC-REL-NONNUMERIC-03-C-DEFER",
  "BMC-REL-NONNUMERIC-03-D-STOP",
];
assert("N03 presented options", JSON.stringify(n03Receipt.presentedOptionIds) === JSON.stringify(expectedPresented), "presented option set mismatch");
const actions = n03Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N03 action gates", actions.length === 2 && actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "A/B owner gates invalid");
const n03B = actions.find((candidate) => candidate.optionId.includes("-B-"));
assert("N03 B provenance remains conditional", n03B.evidence.some((item) => item.includes("must close separately before admission")), "B implies authorized merge provenance");
assert("N03 rejected forms", JSON.stringify(n03Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify([
  "BMC-REL-NONNUMERIC-03-X-AUTHOR-EDGE-PER-STEP-OCCURRENCE",
  "BMC-REL-NONNUMERIC-03-Y-SILENT-COALESCE-WITHOUT-PROVENANCE",
]), "inadmissible forms not rejected");
assert("N03 selection response", n03OwnerSelection.selection.response === "A" && n03OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-03-A-REJECT-DUPLICATE-AUTHORED-ORCHESTRATES", "N03 is not exact A");
assert("N03 selection owner and timestamp", n03OwnerSelection.selection.selected_by === "user" && n03OwnerSelection.selection.exact_response_timestamp_exposed === false && n03OwnerSelection.selection.selection_recorded_at === "2026-08-23T23:03:56+01:00", "N03 owner or timestamp semantics mismatch");
assert("N03 admissibility binding", n03OwnerSelection.admissibility_binding.request_sha256 === digestFile(n03RequestPath) && n03OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n03ReceiptPath) && n03OwnerSelection.admissibility_binding.requestDigest === n03Receipt.requestDigest && n03OwnerSelection.admissibility_binding.hazard_class === "authority", "N03 gate binding mismatch");
assert("N03 narrow effect", n03OwnerSelection.selection_effect.candidate_design_policy.includes("Reject an exact duplicate authored canonical Workflow --[orchestrates]--> Operation proposition") && n03OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("reuse one Operation")) && n03OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N03 scope widened");

const n04ManifestPath = `${n04Root}/DESIGN-SCOPE-MANIFEST.json`;
const n04DenominatorPath = `${n04Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n04SelectionPath = `${n04Root}/DESIGN-SELECTION-RESULT.json`;
const n04Manifest = readJson(n04ManifestPath);
assert("N04 manifest input digest", digestValue(without(n04Manifest, "input_digest")) === n04Manifest.input_digest && n04Manifest.input_digest === "5f109777154badac18da85e2adaad4cd6c0ae605c7a4fed46a6f26de4a4718bd", "N04 canonical digest mismatch");
assert("N04 manifest closed", n04Manifest.unknowns.length === 0 && n04Manifest.authored_by !== "invoke-design-scope-extractor", "N04 manifest is not closed and independent");
const n04Sources = new Map(n04Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N04 exact denominator count", n04Sources.size === 14, `expected 14, got ${n04Sources.size}`);
for (const [relative, expected] of n04Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N04 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n04Denominator = readJson(n04DenominatorPath);
assert("N04 denominator verdict", n04Denominator.verdict === "pass", "N04 denominator failed");
assert("N04 denominator digest", digestValue(without(n04Denominator, "receipt_digest")) === n04Denominator.receipt_digest && n04Denominator.receipt_digest === "59502be649e9b2f80effe3fe0cf0e3582d7180ca82c244b8a2aba48bf03ff1da", "N04 denominator digest mismatch");
assert("N04 denominator complete", n04Denominator.inspected_selectors.length === 14 && n04Denominator.unbound_signal_ids.length === 0 && n04Denominator.missing_detector_inputs.length === 0, "N04 denominator incomplete");
const n04Selection = readJson(n04SelectionPath);
assert("N04 selection verdict", n04Selection.verdict === "pass" && n04Selection.evidence_state === "design-validator-pass", "N04 selection failed");
assert("N04 selection fixed point", n04Selection.fixed_point === true && n04Selection.pass_1_digest === n04Selection.pass_2_digest && n04Selection.pass_1_digest === "d65d6a8ade6c6ce4f9369fdbad57cbdf9a266cac7cd984aed0dc537e25b31334", "N04 selection is not expected fixed point");
assert("N04 selection digest", digestValue(without(n04Selection, "result_digest")) === n04Selection.result_digest && n04Selection.result_digest === "5ca2860f695408525bddd51f3877c02d04a39cd5c891dd6183eb42400e5c889b", "N04 selection digest mismatch");

const n04RequestPath = `${n04Root}/decisions/BMC-REL-NONNUMERIC-04-OPTION-ADMISSIBILITY-REQUEST.json`;
const n04ReceiptPath = `${n04Root}/decisions/BMC-REL-NONNUMERIC-04-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n04OwnerSelectionPath = `${n04Root}/decisions/BMC-REL-NONNUMERIC-04-OWNER-SELECTION-RECEIPT.json`;
const n04Request = readJson(n04RequestPath);
const n04Receipt = readJson(n04ReceiptPath);
const n04OwnerSelection = readJson(n04OwnerSelectionPath);
assert("historical N04 request bytes", digestFile(n04RequestPath) === "0f8615f294b07fc46f92de632bea22c420e578224ac05fd2c407aca18db4d37c", "historical N04 request changed");
assert("historical N04 receipt bytes", digestFile(n04ReceiptPath) === "c287dfbfd735c42490e1bb35fc030b1d895c4563652e7a0c9f1b104b129979e3", "historical N04 receipt changed");
assert("N04 immutable selection bytes", digestFile(n04OwnerSelectionPath) === "5a03cd2f4a8ed53d8e22a9b06a4665390f1737edc041796b6a5f2c02cfb8509b", "N04 selection receipt changed");
assert("N04 requestDigest", digestValue(n04Request) === n04Receipt.requestDigest && n04Receipt.requestDigest === "a1e7c11051fc36ea37863777476c4a94390dabf081b94cac8bc8804fc1ade75e", "N04 prefilter binding mismatch");
assert("N04 gate route", n04Receipt.routeOutcome === "gate" && n04Receipt.decisionGateRequired === true, "N04 did not route to gate");
const expectedN04Presented = [
  "BMC-REL-NONNUMERIC-04-A-REJECT-OWNS-SELF-EDGE-PER-DIMENSION",
  "BMC-REL-NONNUMERIC-04-B-ALLOW-OWNS-SELF-EDGE-PER-DIMENSION",
  "BMC-REL-NONNUMERIC-04-C-DEFER",
  "BMC-REL-NONNUMERIC-04-D-STOP",
];
assert("N04 presented options", JSON.stringify(n04Receipt.presentedOptionIds) === JSON.stringify(expectedN04Presented), "N04 presented option set mismatch");
const n04Actions = n04Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N04 action gates", n04Actions.length === 2 && n04Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N04 A/B owner gates invalid");
assert("N04 rejected forms", JSON.stringify(n04Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify([
  "BMC-REL-NONNUMERIC-04-X-BUNDLE-LONGER-CYCLES",
  "BMC-REL-NONNUMERIC-04-Y-MANDATORY-SELF-OWNERSHIP",
  "BMC-REL-NONNUMERIC-04-Z-INFER-FROM-ONE-TO-MANY",
]), "N04 inadmissible forms not rejected");
assert("N04 selection response", n04OwnerSelection.selection.response === "A" && n04OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-04-A-REJECT-OWNS-SELF-EDGE-PER-DIMENSION", "N04 is not exact A");
assert("N04 selection owner and timestamp", n04OwnerSelection.selection.selected_by === "user" && n04OwnerSelection.selection.exact_response_timestamp_exposed === false && n04OwnerSelection.selection.selection_recorded_at === "2026-08-23T23:32:48+01:00" && n04OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N04 owner or timestamp semantics mismatch");
assert("N04 admissibility binding", n04OwnerSelection.admissibility_binding.request_sha256 === digestFile(n04RequestPath) && n04OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n04ReceiptPath) && n04OwnerSelection.admissibility_binding.requestDigest === n04Receipt.requestDigest && n04OwnerSelection.admissibility_binding.hazard_class === "authority", "N04 gate binding mismatch");
assert("N04 narrow effect", n04OwnerSelection.selection_effect.candidate_design_policy.includes("reject the direct canonical owns_d(e,e) self-edge") && n04OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("cycles over two or more distinct Entities")) && n04OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N04 scope widened");

const n05ManifestPath = `${n05Root}/DESIGN-SCOPE-MANIFEST.json`;
const n05DenominatorPath = `${n05Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n05SelectionPath = `${n05Root}/DESIGN-SELECTION-RESULT.json`;
const n05Manifest = readJson(n05ManifestPath);
assert("N05 manifest input digest", digestValue(without(n05Manifest, "input_digest")) === n05Manifest.input_digest && n05Manifest.input_digest === "3a15c1ae511a1e88d7aeb7bf1c38ea27ef7c920053eefb5f0f78edd9a744fec2", "N05 canonical digest mismatch");
assert("N05 manifest closed", n05Manifest.unknowns.length === 0 && n05Manifest.authored_by !== "invoke-design-scope-extractor", "N05 manifest is not closed and independent");
const n05Sources = new Map(n05Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N05 exact denominator count", n05Sources.size === 14, `expected 14, got ${n05Sources.size}`);
for (const [relative, expected] of n05Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N05 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n05Denominator = readJson(n05DenominatorPath);
assert("N05 denominator verdict", n05Denominator.verdict === "pass", "N05 denominator failed");
assert("N05 denominator digest", digestValue(without(n05Denominator, "receipt_digest")) === n05Denominator.receipt_digest && n05Denominator.receipt_digest === "27c329598aa2dfcb1557f72746fd9b1cea6d70970f530cc937f4bdc50c3467eb", "N05 denominator digest mismatch");
assert("N05 denominator complete", n05Denominator.inspected_selectors.length === 14 && n05Denominator.unbound_signal_ids.length === 0 && n05Denominator.missing_detector_inputs.length === 0, "N05 denominator incomplete");
const n05Selection = readJson(n05SelectionPath);
assert("N05 selection verdict", n05Selection.verdict === "pass" && n05Selection.evidence_state === "design-validator-pass", "N05 selection failed");
assert("N05 selection fixed point", n05Selection.fixed_point === true && n05Selection.pass_1_digest === n05Selection.pass_2_digest && n05Selection.pass_1_digest === "7a8a7103c5964b31a6d867fcba1a8ed5a582d424b5fbe6ba7f607793205c531f", "N05 selection is not expected fixed point");
assert("N05 selection digest", digestValue(without(n05Selection, "result_digest")) === n05Selection.result_digest && n05Selection.result_digest === "8fdeabefc45960691d476d88d87a13ad6ec20e07f2b01293b4e6884e55247950", "N05 selection digest mismatch");

const n05RequestPath = `${n05Root}/decisions/BMC-REL-NONNUMERIC-05-OPTION-ADMISSIBILITY-REQUEST.json`;
const n05ReceiptPath = `${n05Root}/decisions/BMC-REL-NONNUMERIC-05-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n05OwnerSelectionPath = `${n05Root}/decisions/BMC-REL-NONNUMERIC-05-OWNER-SELECTION-RECEIPT.json`;
const n05Request = readJson(n05RequestPath);
const n05Receipt = readJson(n05ReceiptPath);
const n05OwnerSelection = readJson(n05OwnerSelectionPath);
assert("N05 requestDigest", digestValue(n05Request) === n05Receipt.requestDigest && n05Receipt.requestDigest === "94656a5b00f9b99778098f1a18b4568817ee4c05942b759e8c0f5afd96615083", "N05 prefilter binding mismatch");
assert("N05 gate route", n05Receipt.routeOutcome === "gate" && n05Receipt.decisionGateRequired === true, "N05 did not route to gate");
const expectedN05Presented = ["BMC-REL-NONNUMERIC-05-A-UNIFORM-CYCLE-POLICY-ACROSS-DIMENSIONS", "BMC-REL-NONNUMERIC-05-B-DIMENSION-SPECIFIC-CYCLE-POLICY", "BMC-REL-NONNUMERIC-05-C-DEFER", "BMC-REL-NONNUMERIC-05-D-STOP"];
assert("N05 presented options", JSON.stringify(n05Receipt.presentedOptionIds) === JSON.stringify(expectedN05Presented), "N05 presented option set mismatch");
const n05Actions = n05Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N05 action gates", n05Actions.length === 2 && n05Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N05 A/B owner gates invalid");
assert("N05 rejected forms", JSON.stringify(n05Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-05-X-REJECT-ALL-LONGER-CYCLES-NOW", "BMC-REL-NONNUMERIC-05-Y-INCLUDE-MIXED-DIMENSION-PATHS", "BMC-REL-NONNUMERIC-05-Z-INFER-UNIFORMITY-FROM-OWNS-VERB"]), "N05 inadmissible forms not rejected");
assert("N05 immutable selection bytes", digestFile(n05OwnerSelectionPath) === "c1a430cf883ad962cd903db0d36ddf56c71326d6d263b19c5275777c9c463f87", "N05 selection receipt changed");
assert("N05 selection response", n05OwnerSelection.selection.response === "A" && n05OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-05-A-UNIFORM-CYCLE-POLICY-ACROSS-DIMENSIONS", "N05 is not exact A");
assert("N05 selection owner and timestamp", n05OwnerSelection.selection.selected_by === "user" && n05OwnerSelection.selection.exact_response_timestamp_exposed === false && n05OwnerSelection.selection.selection_recorded_at === "2026-08-23T23:53:55+01:00" && n05OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N05 owner or timestamp semantics mismatch");
assert("N05 admissibility binding", n05OwnerSelection.admissibility_binding.request_sha256 === digestFile(n05RequestPath) && n05OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n05ReceiptPath) && n05OwnerSelection.admissibility_binding.requestDigest === n05Receipt.requestDigest && n05OwnerSelection.admissibility_binding.hazard_class === "authority" && n05OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N05 gate binding mismatch");
assert("N05 narrow effect", n05OwnerSelection.selection_effect.candidate_design_policy.includes("one uniform rule across every admitted D29 dimension") && n05OwnerSelection.selection_effect.registry_evolution.includes("later-added admitted D29 dimensions") && n05OwnerSelection.selection_effect.behavior_status === "reject-versus-allow behavior remains unselected" && n05OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N05 scope widened");

const n06ManifestPath = `${n06Root}/DESIGN-SCOPE-MANIFEST.json`;
const n06DenominatorPath = `${n06Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n06SelectionPath = `${n06Root}/DESIGN-SELECTION-RESULT.json`;
const n06Manifest = readJson(n06ManifestPath);
assert("N06 manifest input digest", digestValue(without(n06Manifest, "input_digest")) === n06Manifest.input_digest && n06Manifest.input_digest === "2f43e05736c562dbe127fc21c5be9bf2712f4a63691ef8d16c6db3efaf6b47bc", "N06 canonical digest mismatch");
assert("N06 manifest closed", n06Manifest.unknowns.length === 0 && n06Manifest.authored_by !== "invoke-design-scope-extractor", "N06 manifest is not closed and independent");
const n06Sources = new Map(n06Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N06 exact denominator count", n06Sources.size === 14, `expected 14, got ${n06Sources.size}`);
for (const [relative, expected] of n06Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N06 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n06Denominator = readJson(n06DenominatorPath);
assert("N06 denominator verdict", n06Denominator.verdict === "pass", "N06 denominator failed");
assert("N06 denominator digest", digestValue(without(n06Denominator, "receipt_digest")) === n06Denominator.receipt_digest && n06Denominator.receipt_digest === "d8b5d8aa4097f3a9186be548e6418fec904451b8c43a8e5337e2db5fdcd02949", "N06 denominator digest mismatch");
assert("N06 denominator complete", n06Denominator.inspected_selectors.length === 14 && n06Denominator.unbound_signal_ids.length === 0 && n06Denominator.missing_detector_inputs.length === 0, "N06 denominator incomplete");
const n06Selection = readJson(n06SelectionPath);
assert("N06 selection verdict", n06Selection.verdict === "pass" && n06Selection.evidence_state === "design-validator-pass", "N06 selection failed");
assert("N06 selection fixed point", n06Selection.fixed_point === true && n06Selection.pass_1_digest === n06Selection.pass_2_digest && n06Selection.pass_1_digest === "ce027eb350f2a38b1bfe1459758f53aa51279e47b5f44953dc6c4f09688fae17", "N06 selection is not expected fixed point");
assert("N06 selection digest", digestValue(without(n06Selection, "result_digest")) === n06Selection.result_digest && n06Selection.result_digest === "c23afa5f5f242d136779ab88f3570bc81ba8770a89e8d2893a1c213f3eac63a9", "N06 selection digest mismatch");
assert("N06 selected outputs", JSON.stringify(n06Selection.selected_outputs) === JSON.stringify(["architecture", "architecture:authority-trust", "validation-contracts"]), "N06 unexpected outputs");

const n06RequestPath = `${n06Root}/decisions/BMC-REL-NONNUMERIC-06-OPTION-ADMISSIBILITY-REQUEST.json`;
const n06ReceiptPath = `${n06Root}/decisions/BMC-REL-NONNUMERIC-06-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n06OwnerSelectionPath = `${n06Root}/decisions/BMC-REL-NONNUMERIC-06-OWNER-SELECTION-RECEIPT.json`;
const n06Request = readJson(n06RequestPath);
const n06Receipt = readJson(n06ReceiptPath);
const n06OwnerSelection = readJson(n06OwnerSelectionPath);
assert("N06 request bytes", digestFile(n06RequestPath) === "6012e87fadc420f6c4cc9204f767159665b4a64c737e77c2936468fdf52a5931", "N06 request changed");
assert("N06 receipt bytes", digestFile(n06ReceiptPath) === "6328574d5f7c5eadae048dff18285248c48123397178e2629284b3f833e61d9e", "N06 receipt changed");
assert("N06 requestDigest", digestValue(n06Request) === n06Receipt.requestDigest && n06Receipt.requestDigest === "10f7c3d48fb54447fb9c1f6abfcc4ec9e8836c4c1bf5b465f1ca3084798ca810", "N06 prefilter binding mismatch");
assert("N06 gate route", n06Receipt.routeOutcome === "gate" && n06Receipt.decisionGateRequired === true && n06Receipt.directOptionId === null, "N06 did not route to gate");
const expectedN06Presented = ["BMC-REL-NONNUMERIC-06-A-REJECT-UNIFORM-SAME-DIMENSION-LONGER-CYCLES", "BMC-REL-NONNUMERIC-06-B-ALLOW-UNIFORM-SAME-DIMENSION-LONGER-CYCLES", "BMC-REL-NONNUMERIC-06-C-DEFER", "BMC-REL-NONNUMERIC-06-D-STOP"];
assert("N06 presented options", JSON.stringify(n06Receipt.presentedOptionIds) === JSON.stringify(expectedN06Presented), "N06 presented option set mismatch");
const n06Actions = n06Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N06 action gates", n06Actions.length === 2 && n06Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N06 A/B owner gates invalid");
assert("N06 rejected forms", JSON.stringify(n06Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-06-W-REOPEN-SELF-EDGES", "BMC-REL-NONNUMERIC-06-X-CONDITIONAL-CYCLE-EXCEPTIONS", "BMC-REL-NONNUMERIC-06-Y-INCLUDE-MIXED-DIMENSION-CYCLES", "BMC-REL-NONNUMERIC-06-Z-INFER-FROM-ONE-TO-MANY"]), "N06 inadmissible forms not rejected");
assert("N06 immutable selection bytes", digestFile(n06OwnerSelectionPath) === "a968c7535306021f208ec67532773fd49dad7dc114fdbd1ece0b40bbeaf71182", "N06 selection receipt changed");
assert("N06 selection response", n06OwnerSelection.selection.response === "A" && n06OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-06-A-REJECT-UNIFORM-SAME-DIMENSION-LONGER-CYCLES", "N06 is not exact A");
assert("N06 selection owner and timestamp", n06OwnerSelection.selection.selected_by === "user" && n06OwnerSelection.selection.exact_response_timestamp_exposed === false && n06OwnerSelection.selection.selection_recorded_at === "2026-08-24T01:21:16+01:00" && n06OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N06 owner or timestamp semantics mismatch");
assert("N06 admissibility binding", n06OwnerSelection.admissibility_binding.request_sha256 === digestFile(n06RequestPath) && n06OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n06ReceiptPath) && n06OwnerSelection.admissibility_binding.requestDigest === n06Receipt.requestDigest && n06OwnerSelection.admissibility_binding.hazard_class === "authority" && n06OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N06 gate binding mismatch");
assert("N06 narrow effect", n06OwnerSelection.selection_effect.candidate_design_policy.includes("Reject every same-dimension directed canonical owns cycle") && n06OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("mixed-dimension")) && n06OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N06 scope widened");

const n07ManifestPath = `${n07Root}/DESIGN-SCOPE-MANIFEST.json`;
const n07DenominatorPath = `${n07Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n07SelectionPath = `${n07Root}/DESIGN-SELECTION-RESULT.json`;
const n07Manifest = readJson(n07ManifestPath);
assert("N07 manifest input digest", digestValue(without(n07Manifest, "input_digest")) === n07Manifest.input_digest && n07Manifest.input_digest === "73eff0d7cbe7e3c4008caa5c1cb3137ede758c339efe098da801074d972c0af6", "N07 canonical digest mismatch");
assert("N07 manifest closed", n07Manifest.unknowns.length === 0 && n07Manifest.authored_by !== "invoke-design-scope-extractor", "N07 manifest is not closed and independent");
const n07Sources = new Map(n07Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N07 exact denominator count", n07Sources.size === 14, `expected 14, got ${n07Sources.size}`);
for (const [relative, expected] of n07Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N07 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n07Denominator = readJson(n07DenominatorPath);
assert("N07 denominator verdict", n07Denominator.verdict === "pass", "N07 denominator failed");
assert("N07 denominator digest", digestValue(without(n07Denominator, "receipt_digest")) === n07Denominator.receipt_digest && n07Denominator.receipt_digest === "b709ba52a09066e1adb4b0b75f5cee8b89354a02beecaf46aad758f96c873d50", "N07 denominator digest mismatch");
assert("N07 denominator complete", n07Denominator.inspected_selectors.length === 14 && n07Denominator.unbound_signal_ids.length === 0 && n07Denominator.missing_detector_inputs.length === 0, "N07 denominator incomplete");
const n07Selection = readJson(n07SelectionPath);
assert("N07 selection verdict", n07Selection.verdict === "pass" && n07Selection.evidence_state === "design-validator-pass", "N07 selection failed");
assert("N07 selection fixed point", n07Selection.fixed_point === true && n07Selection.pass_1_digest === n07Selection.pass_2_digest && n07Selection.pass_1_digest === "c15e931fcfc7e55f2934ec2bb73dc5e4fb6aacccefa67b37974e94fa82a564b6", "N07 selection is not expected fixed point");
assert("N07 selection digest", digestValue(without(n07Selection, "result_digest")) === n07Selection.result_digest && n07Selection.result_digest === "b2a05aa08aef03653e5c058ea14d0fdcc7ba0d4dbafb25b6ba26ab6ded6231ff", "N07 selection digest mismatch");
assert("N07 selected outputs", JSON.stringify(n07Selection.selected_outputs) === JSON.stringify(["architecture", "validation-contracts"]), "N07 unexpected outputs");

const n07RequestPath = `${n07Root}/decisions/BMC-REL-NONNUMERIC-07-OPTION-ADMISSIBILITY-REQUEST.json`;
const n07ReceiptPath = `${n07Root}/decisions/BMC-REL-NONNUMERIC-07-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n07OwnerSelectionPath = `${n07Root}/decisions/BMC-REL-NONNUMERIC-07-OWNER-SELECTION-RECEIPT.json`;
const n07Request = readJson(n07RequestPath);
const n07Receipt = readJson(n07ReceiptPath);
const n07OwnerSelection = readJson(n07OwnerSelectionPath);
assert("N07 request bytes", digestFile(n07RequestPath) === "502eb3b12c8d87ca8b3225be284cf4c85249db5673a4a56e4579d211c376f817", "N07 request changed");
assert("N07 receipt bytes", digestFile(n07ReceiptPath) === "96c02c20ec63fbd370d151c261a0db13bc9a4025b08f7150c5c109a8e1ff460f", "N07 receipt changed");
assert("N07 requestDigest", digestValue(n07Request) === n07Receipt.requestDigest && n07Receipt.requestDigest === "24653db6f1f91d167d9fffb74caadfa6dc4bb6e48a029b9e024745131dd2209a", "N07 prefilter binding mismatch");
assert("N07 gate route", n07Receipt.routeOutcome === "gate" && n07Receipt.decisionGateRequired === true && n07Receipt.directOptionId === null, "N07 did not route to gate");
const expectedN07Presented = ["BMC-REL-NONNUMERIC-07-A-ALLOW-MIXED-DIMENSION-CLOSED-PATHS", "BMC-REL-NONNUMERIC-07-B-REJECT-MIXED-DIMENSION-CLOSED-PATHS", "BMC-REL-NONNUMERIC-07-C-DEFER", "BMC-REL-NONNUMERIC-07-D-STOP"];
assert("N07 presented options", JSON.stringify(n07Receipt.presentedOptionIds) === JSON.stringify(expectedN07Presented), "N07 presented option set mismatch");
const n07Actions = n07Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N07 action gates", n07Actions.length === 2 && n07Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N07 A/B owner gates invalid");
assert("N07 rejected forms", JSON.stringify(n07Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-07-W-DERIVE-TRANSITIVE-EDGES", "BMC-REL-NONNUMERIC-07-X-PER-COMBINATION-EXCEPTIONS", "BMC-REL-NONNUMERIC-07-Y-REOPEN-SAME-DIMENSION-CYCLES", "BMC-REL-NONNUMERIC-07-Z-INFER-FROM-REGISTRY-ORDER"]), "N07 inadmissible forms not rejected");
assert("N07 immutable selection bytes", digestFile(n07OwnerSelectionPath) === "50f2058afcfeb315101a8328f370e99c1f91aa881479b71529b7bae512301580", "N07 selection receipt changed");
assert("N07 selection response", n07OwnerSelection.selection.response === "A" && n07OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-07-A-ALLOW-MIXED-DIMENSION-CLOSED-PATHS", "N07 is not exact A");
assert("N07 selection owner and timestamp", n07OwnerSelection.selection.selected_by === "user" && n07OwnerSelection.selection.exact_response_timestamp_exposed === false && n07OwnerSelection.selection.selection_recorded_at === "2026-08-24T01:38:48+01:00" && n07OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N07 owner or timestamp semantics mismatch");
assert("N07 admissibility binding", n07OwnerSelection.admissibility_binding.request_sha256 === digestFile(n07RequestPath) && n07OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n07ReceiptPath) && n07OwnerSelection.admissibility_binding.requestDigest === n07Receipt.requestDigest && n07OwnerSelection.admissibility_binding.hazard_class === "authority" && n07OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N07 gate binding mismatch");
assert("N07 narrow effect", n07OwnerSelection.selection_effect.candidate_design_policy.includes("Do not reject a directed canonical owns path solely") && n07OwnerSelection.selection_effect.preserved_prior_policy.includes("N04") && n07OwnerSelection.selection_effect.preserved_prior_policy.includes("N06") && n07OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N07 scope widened");

const n08ManifestPath = `${n08Root}/DESIGN-SCOPE-MANIFEST.json`;
const n08DenominatorPath = `${n08Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n08SelectionPath = `${n08Root}/DESIGN-SELECTION-RESULT.json`;
const n08Manifest = readJson(n08ManifestPath);
assert("N08 manifest input digest", digestValue(without(n08Manifest, "input_digest")) === n08Manifest.input_digest && n08Manifest.input_digest === "3328e18ae307de4bd12ac8b571f82d3104c825c7f359406f81e489ac415d6284", "N08 canonical digest mismatch");
assert("N08 manifest closed", n08Manifest.unknowns.length === 0 && n08Manifest.authored_by !== "invoke-design-scope-extractor", "N08 manifest is not closed and independent");
const n08Sources = new Map(n08Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N08 exact denominator count", n08Sources.size === 14, `expected 14, got ${n08Sources.size}`);
for (const [relative, expected] of n08Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N08 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n08Denominator = readJson(n08DenominatorPath);
assert("N08 denominator verdict", n08Denominator.verdict === "pass", "N08 denominator failed");
assert("N08 denominator digest", digestValue(without(n08Denominator, "receipt_digest")) === n08Denominator.receipt_digest && n08Denominator.receipt_digest === "24911277bdd08b28ede0140483d5724554f19e86d28ef40d746cba5fb5f7d7ed", "N08 denominator digest mismatch");
assert("N08 denominator complete", n08Denominator.inspected_selectors.length === 14 && n08Denominator.unbound_signal_ids.length === 0 && n08Denominator.missing_detector_inputs.length === 0, "N08 denominator incomplete");
const n08Selection = readJson(n08SelectionPath);
assert("N08 selection verdict", n08Selection.verdict === "pass" && n08Selection.evidence_state === "design-validator-pass", "N08 selection failed");
assert("N08 selection fixed point", n08Selection.fixed_point === true && n08Selection.pass_1_digest === n08Selection.pass_2_digest && n08Selection.pass_1_digest === "33b503efa842fd1afd6b4e6dcec339237097ae638dbba08bd4d3333f8bd6a829", "N08 selection is not expected fixed point");
assert("N08 selection digest", digestValue(without(n08Selection, "result_digest")) === n08Selection.result_digest && n08Selection.result_digest === "07a3477453e65343459911db396bd35c11edf1e9215611268fb185f9dac7091d", "N08 selection digest mismatch");
assert("N08 selected outputs", JSON.stringify(n08Selection.selected_outputs) === JSON.stringify(["architecture", "architecture:authority-trust", "validation-contracts"]), "N08 unexpected outputs");

const n08RequestPath = `${n08Root}/decisions/BMC-REL-NONNUMERIC-08-OPTION-ADMISSIBILITY-REQUEST.json`;
const n08ReceiptPath = `${n08Root}/decisions/BMC-REL-NONNUMERIC-08-OPTION-ADMISSIBILITY-RECEIPT.json`;
const n08OwnerSelectionPath = `${n08Root}/decisions/BMC-REL-NONNUMERIC-08-OWNER-SELECTION-RECEIPT.json`;
const n08Request = readJson(n08RequestPath);
const n08Receipt = readJson(n08ReceiptPath);
const n08OwnerSelection = readJson(n08OwnerSelectionPath);
assert("N08 request bytes", digestFile(n08RequestPath) === "c0f41d64b59b3ae0312e63a4af6fc8f81c5e2da93aeb7a2eda5dbbfae9c154c7", "N08 request changed");
assert("N08 receipt bytes", digestFile(n08ReceiptPath) === "3c46eb9d48370b67d1ac133755c55e58d948c479b2299b2025ad724209bf6a19", "N08 receipt changed");
assert("N08 requestDigest", digestValue(n08Request) === n08Receipt.requestDigest && n08Receipt.requestDigest === "df05eff24ba0dbaccd4066a2f31f4d190e4b0c6118e803f160142e9ef44e5c18", "N08 prefilter binding mismatch");
assert("N08 gate route", n08Receipt.routeOutcome === "gate" && n08Receipt.decisionGateRequired === true && n08Receipt.directOptionId === null, "N08 did not route to gate");
const expectedN08Presented = ["BMC-REL-NONNUMERIC-08-A-REJECT-DUPLICATE-AUTHORED-OWNS", "BMC-REL-NONNUMERIC-08-B-COALESCE-EXACT-DUPLICATE-AUTHORED-OWNS", "BMC-REL-NONNUMERIC-08-C-DEFER", "BMC-REL-NONNUMERIC-08-D-STOP"];
assert("N08 presented options", JSON.stringify(n08Receipt.presentedOptionIds) === JSON.stringify(expectedN08Presented), "N08 presented option set mismatch");
const n08Actions = n08Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N08 action gates", n08Actions.length === 2 && n08Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N08 A/B owner gates invalid");
assert("N08 rejected forms", JSON.stringify(n08Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-08-W-AUTHOR-INVERSE-AS-DUPLICATE", "BMC-REL-NONNUMERIC-08-X-GLOBALIZE-DUPLICATE-POLICY", "BMC-REL-NONNUMERIC-08-Y-MERGE-DIFFERENT-DIMENSIONS", "BMC-REL-NONNUMERIC-08-Z-COALESCE-COMPETING-OWNERS"]), "N08 inadmissible forms not rejected");
assert("N08 immutable selection bytes", digestFile(n08OwnerSelectionPath) === "6cbb90f152e0800832514084799657669ff100286b7f433b84be7d79ac2b0e78", "N08 selection receipt changed");
assert("N08 selection response", n08OwnerSelection.selection.response === "A" && n08OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-08-A-REJECT-DUPLICATE-AUTHORED-OWNS", "N08 is not exact A");
assert("N08 selection owner and timestamp", n08OwnerSelection.selection.selected_by === "user" && n08OwnerSelection.selection.exact_response_timestamp_exposed === false && n08OwnerSelection.selection.selection_recorded_at === "2026-08-24T02:00:40+01:00" && n08OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N08 owner or timestamp semantics mismatch");
assert("N08 admissibility binding", n08OwnerSelection.admissibility_binding.request_sha256 === digestFile(n08RequestPath) && n08OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n08ReceiptPath) && n08OwnerSelection.admissibility_binding.requestDigest === n08Receipt.requestDigest && n08OwnerSelection.admissibility_binding.hazard_class === "authority" && n08OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N08 gate binding mismatch");
assert("N08 narrow effect", n08OwnerSelection.selection_effect.candidate_design_policy.includes("Reject repeated authorship") && n08OwnerSelection.selection_effect.preserved_separations.some((item) => item.includes("different admitted D29 dimensions")) && n08OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("inverse-view detail")) && n08OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N08 scope widened");

const n09ManifestPath = `${n09Root}/DESIGN-SCOPE-MANIFEST.json`;
const n09DenominatorPath = `${n09Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n09SelectionPath = `${n09Root}/DESIGN-SELECTION-RESULT.json`;
const n09Manifest = readJson(n09ManifestPath);
assert("N09 manifest input digest", digestValue(without(n09Manifest, "input_digest")) === n09Manifest.input_digest && n09Manifest.input_digest === "b67b39ac73862a4ac8486d4181182d306a65b59bad12f291a7ca9e712a9ee6ec", "N09 canonical digest mismatch");
assert("N09 manifest closed", n09Manifest.unknowns.length === 0 && n09Manifest.authored_by !== "invoke-design-scope-extractor", "N09 manifest is not closed and independent");
const n09Sources = new Map(n09Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N09 exact denominator count", n09Sources.size === 14, `expected 14, got ${n09Sources.size}`);
for (const [relative, expected] of n09Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N09 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n09Denominator = readJson(n09DenominatorPath);
assert("N09 denominator verdict", n09Denominator.verdict === "pass", "N09 denominator failed");
assert("N09 denominator digest", digestValue(without(n09Denominator, "receipt_digest")) === n09Denominator.receipt_digest && n09Denominator.receipt_digest === "b889d96f62001c44f75c14e85c35cd6bebbd9d35338fb8761923b9fd147feda9", "N09 denominator digest mismatch");
assert("N09 denominator complete", n09Denominator.inspected_selectors.length === 14 && n09Denominator.unbound_signal_ids.length === 0 && n09Denominator.missing_detector_inputs.length === 0, "N09 denominator incomplete");
const n09Selection = readJson(n09SelectionPath);
assert("N09 selection verdict", n09Selection.verdict === "pass" && n09Selection.evidence_state === "design-validator-pass", "N09 selection failed");
assert("N09 selection fixed point", n09Selection.fixed_point === true && n09Selection.pass_1_digest === n09Selection.pass_2_digest && n09Selection.pass_1_digest === "f86116d0c304dce941effb8d252ae12edb8e213c61738bba0fd017911b06aac2", "N09 selection is not expected fixed point");
assert("N09 selection digest", digestValue(without(n09Selection, "result_digest")) === n09Selection.result_digest && n09Selection.result_digest === "3c4ccb0f17f4cebdfe70100297632c03f58c5d00b0b020e5ef02b99627fa745e", "N09 selection digest mismatch");
assert("N09 selected outputs", JSON.stringify(n09Selection.selected_outputs) === JSON.stringify(["architecture", "validation-contracts"]), "N09 unexpected outputs");
const n09RequestPath = `${n09Root}/decisions/BMC-REL-NONNUMERIC-09-OPTION-ADMISSIBILITY-REQUEST.json`;
const n09ReceiptPath = `${n09Root}/decisions/BMC-REL-NONNUMERIC-09-OPTION-PREFILTER-RECEIPT.json`;
const n09OwnerSelectionPath = `${n09Root}/decisions/BMC-REL-NONNUMERIC-09-OWNER-SELECTION-RECEIPT.json`;
const n09Request = readJson(n09RequestPath);
const n09Receipt = readJson(n09ReceiptPath);
const n09OwnerSelection = readJson(n09OwnerSelectionPath);
assert("N09 requestDigest", digestValue(n09Request) === n09Receipt.requestDigest && n09Receipt.requestDigest === "1e2a1d5f57e74d1c72e4140ac064aec9c792966c5bc2177594fb702eb4e08861", "N09 prefilter binding mismatch");
assert("N09 gate route", n09Receipt.routeOutcome === "gate" && n09Receipt.decisionGateRequired === true && n09Receipt.directOptionId === null, "N09 did not route to gate");
const expectedN09Presented = ["BMC-REL-NONNUMERIC-09-A-PRESERVE-DIMENSION-IN-GENERATED-OWNED-BY", "BMC-REL-NONNUMERIC-09-B-AGGREGATE-DIMENSION-FREE-GENERATED-OWNED-BY", "BMC-REL-NONNUMERIC-09-C-DEFER", "BMC-REL-NONNUMERIC-09-D-STOP"];
assert("N09 presented options", JSON.stringify(n09Receipt.presentedOptionIds) === JSON.stringify(expectedN09Presented), "N09 presented option set mismatch");
const n09Actions = n09Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N09 action gates", n09Actions.length === 2 && n09Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N09 A/B owner gates invalid");
assert("N09 rejected forms", JSON.stringify(n09Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-09-W-AUTHOR-OWNED-BY", "BMC-REL-NONNUMERIC-09-X-SELECT-MATERIALIZATION", "BMC-REL-NONNUMERIC-09-Y-ADD-NEW-INVERSE-VERBS", "BMC-REL-NONNUMERIC-09-Z-DROP-CANONICAL-DIMENSIONS"]), "N09 inadmissible forms not rejected");
assert("N09 immutable selection bytes", digestFile(n09OwnerSelectionPath) === "5328ba862a55df36a3927ffb972e0659a1eb114c9351091e12636c751a76eae1", "N09 selection receipt changed");
assert("N09 selection response", n09OwnerSelection.selection.response === "A" && n09OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-09-A-PRESERVE-DIMENSION-IN-GENERATED-OWNED-BY", "N09 is not exact A");
assert("N09 selection owner and timestamp", n09OwnerSelection.selection.selected_by === "user" && n09OwnerSelection.selection.exact_response_timestamp_exposed === false && n09OwnerSelection.selection.selection_recorded_at === "2026-08-24T02:19:35+01:00" && n09OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N09 owner or timestamp semantics mismatch");
assert("N09 admissibility binding", n09OwnerSelection.admissibility_binding.request_sha256 === digestFile(n09RequestPath) && n09OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n09ReceiptPath) && n09OwnerSelection.admissibility_binding.requestDigest === n09Receipt.requestDigest && n09OwnerSelection.admissibility_binding.hazard_class === "authority" && n09OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N09 gate binding mismatch");
assert("N09 narrow effect", n09OwnerSelection.selection_effect.candidate_design_policy.includes("preserves the exact admitted D29 dimension") && n09OwnerSelection.selection_effect.preserved_separations.some((item) => item.includes("canonical owns remains")) && n09OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("storage, materialization")) && n09OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N09 scope widened");

const n10ManifestPath = `${n10Root}/DESIGN-SCOPE-MANIFEST.json`;
const n10DenominatorPath = `${n10Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n10SelectionPath = `${n10Root}/DESIGN-SELECTION-RESULT.json`;
const n10Manifest = readJson(n10ManifestPath);
assert("N10 manifest input digest", digestValue(without(n10Manifest, "input_digest")) === n10Manifest.input_digest && n10Manifest.input_digest === "b5cbce041224169f4a29c5f6b2f36c9096e9e07a09635c06c702fce30cbb5b63", "N10 canonical digest mismatch");
assert("N10 manifest closed", n10Manifest.unknowns.length === 0 && n10Manifest.authored_by !== "invoke-design-scope-extractor", "N10 manifest is not closed and independent");
const n10Sources = new Map(n10Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N10 exact denominator count", n10Sources.size === 14, `expected 14, got ${n10Sources.size}`);
for (const [relative, expected] of n10Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N10 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n10Denominator = readJson(n10DenominatorPath);
assert("N10 denominator verdict", n10Denominator.verdict === "pass", "N10 denominator failed");
assert("N10 denominator digest", digestValue(without(n10Denominator, "receipt_digest")) === n10Denominator.receipt_digest && n10Denominator.receipt_digest === "748b092a48766bca324f797f6c9cf7754ef7aa87d34c7eb7efb3bfa16e918728", "N10 denominator digest mismatch");
assert("N10 denominator complete", n10Denominator.inspected_selectors.length === 14 && n10Denominator.unbound_signal_ids.length === 0 && n10Denominator.missing_detector_inputs.length === 0, "N10 denominator incomplete");
const n10Selection = readJson(n10SelectionPath);
assert("N10 selection verdict", n10Selection.verdict === "pass" && n10Selection.evidence_state === "design-validator-pass", "N10 selection failed");
assert("N10 selection fixed point", n10Selection.fixed_point === true && n10Selection.pass_1_digest === n10Selection.pass_2_digest && n10Selection.pass_1_digest === "d3750655ce2757f713b5a8dce44d81f64702e02aeb24038c629b01d327cfde33", "N10 selection is not expected fixed point");
assert("N10 selection digest", digestValue(without(n10Selection, "result_digest")) === n10Selection.result_digest && n10Selection.result_digest === "ab64be0eb72ee0268439da48d84d05a3bd194819b8b101db891a4f91ab3ca0c4", "N10 selection digest mismatch");
assert("N10 selected outputs", JSON.stringify(n10Selection.selected_outputs) === JSON.stringify(["architecture", "validation-contracts"]), "N10 unexpected outputs");
const n10RequestPath = `${n10Root}/decisions/BMC-REL-NONNUMERIC-10-OPTION-ADMISSIBILITY-REQUEST.json`;
const n10ReceiptPath = `${n10Root}/decisions/BMC-REL-NONNUMERIC-10-OPTION-PREFILTER-RECEIPT.json`;
const n10OwnerSelectionPath = `${n10Root}/decisions/BMC-REL-NONNUMERIC-10-OWNER-SELECTION-RECEIPT.json`;
const n10Request = readJson(n10RequestPath);
const n10Receipt = readJson(n10ReceiptPath);
const n10OwnerSelection = readJson(n10OwnerSelectionPath);
assert("N10 requestDigest", digestValue(n10Request) === n10Receipt.requestDigest && n10Receipt.requestDigest === "41fd4b0e04ed7cc0b8d1ca3bd0e8c0bef1b1daaafb09f1a7b667f4f2aadd2bc9", "N10 prefilter binding mismatch");
assert("N10 gate route", n10Receipt.routeOutcome === "gate" && n10Receipt.decisionGateRequired === true && n10Receipt.directOptionId === null, "N10 did not route to gate");
const expectedN10Presented = ["BMC-REL-NONNUMERIC-10-A-COMPUTE-OWNED-BY-FROM-CANONICAL-OWNS", "BMC-REL-NONNUMERIC-10-B-MATERIALIZE-REBUILDABLE-OWNED-BY", "BMC-REL-NONNUMERIC-10-C-DEFER", "BMC-REL-NONNUMERIC-10-D-STOP"];
assert("N10 presented options", JSON.stringify(n10Receipt.presentedOptionIds) === JSON.stringify(expectedN10Presented), "N10 presented option set mismatch");
const n10Actions = n10Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N10 action gates", n10Actions.length === 2 && n10Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N10 A/B owner gates invalid");
assert("N10 B obligations conditional", n10Actions.find((candidate) => candidate.optionId.includes("-B-")).evidence.some((item) => item.includes("conditional downstream obligations")), "N10 B over-authorizes materialization obligations");
assert("N10 rejected forms", JSON.stringify(n10Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-10-W-AUTHOR-OWNED-BY", "BMC-REL-NONNUMERIC-10-X-DUAL-WRITE-CANONICAL-AND-PROJECTION", "BMC-REL-NONNUMERIC-10-Y-MATERIALIZE-WITHOUT-PROVENANCE", "BMC-REL-NONNUMERIC-10-Z-SELECT-STORAGE-STACK"]), "N10 inadmissible forms not rejected");
assert("N10 immutable selection bytes", digestFile(n10OwnerSelectionPath) === "dcd47467d65c780c7c06528b1a8ef2bb734fd0dd5c5d3b052605776ec7b98cef", "N10 selection receipt changed");
assert("N10 selection response", n10OwnerSelection.selection.response === "A" && n10OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-10-A-COMPUTE-OWNED-BY-FROM-CANONICAL-OWNS", "N10 is not exact A");
assert("N10 selection owner and timestamp", n10OwnerSelection.selection.selected_by === "user" && n10OwnerSelection.selection.exact_response_timestamp_exposed === false && n10OwnerSelection.selection.selection_recorded_at === "2026-08-24T02:36:57+01:00" && n10OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N10 owner or timestamp semantics mismatch");
assert("N10 duplicate response boundary", n10OwnerSelection.selection.confirming_response_count === 2 && n10OwnerSelection.response_boundary.n11_or_later_response_inferred === false && n10OwnerSelection.response_boundary.unseen_gate_selection_inferred === false, "duplicate A leaked beyond N10");
assert("N10 admissibility binding", n10OwnerSelection.admissibility_binding.request_sha256 === digestFile(n10RequestPath) && n10OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n10ReceiptPath) && n10OwnerSelection.admissibility_binding.requestDigest === n10Receipt.requestDigest && n10OwnerSelection.admissibility_binding.hazard_class === "authority" && n10OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N10 gate binding mismatch");
assert("N10 narrow effect", n10OwnerSelection.selection_effect.candidate_design_policy.includes("computed from current canonical owns facts when requested") && n10OwnerSelection.selection_effect.candidate_design_policy.includes("no independently retained projection state") && n10OwnerSelection.authorization_boundary.n11_or_later_owner_choice_made === false && n10OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N10 scope widened");

const n11ManifestPath = `${n11Root}/DESIGN-SCOPE-MANIFEST.json`;
const n11DenominatorPath = `${n11Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n11SelectionPath = `${n11Root}/DESIGN-SELECTION-RESULT.json`;
const n11Manifest = readJson(n11ManifestPath);
assert("N11 manifest input digest", digestValue(without(n11Manifest, "input_digest")) === n11Manifest.input_digest && n11Manifest.input_digest === "3960785c0b36a9cd6c565867c27fb777c76ab35da4e4b173976c6c1bb2c986a1", "N11 canonical digest mismatch");
assert("N11 manifest closed", n11Manifest.unknowns.length === 0 && n11Manifest.authored_by !== "invoke-design-scope-extractor", "N11 manifest is not closed and independent");
const n11Sources = new Map(n11Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N11 exact denominator count", n11Sources.size === 14, `expected 14, got ${n11Sources.size}`);
for (const [relative, expected] of n11Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N11 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n11Denominator = readJson(n11DenominatorPath);
assert("N11 denominator verdict", n11Denominator.verdict === "pass", "N11 denominator failed");
assert("N11 denominator digest", digestValue(without(n11Denominator, "receipt_digest")) === n11Denominator.receipt_digest && n11Denominator.receipt_digest === "b00bffcb94ec10c2ff768b18f1ed81e5e569d377bd30c9a9f24da13f3bfffeaa", "N11 denominator digest mismatch");
assert("N11 denominator complete", n11Denominator.inspected_selectors.length === 14 && n11Denominator.unbound_signal_ids.length === 0 && n11Denominator.missing_detector_inputs.length === 0, "N11 denominator incomplete");
const n11Selection = readJson(n11SelectionPath);
assert("N11 selection verdict", n11Selection.verdict === "pass" && n11Selection.evidence_state === "design-validator-pass", "N11 selection failed");
assert("N11 selection fixed point", n11Selection.fixed_point === true && n11Selection.pass_1_digest === n11Selection.pass_2_digest && n11Selection.pass_1_digest === "d01f95ec21390ad84aba892ccf73a3c335a90bb2f87a8889280bcfa728a35542", "N11 selection is not expected fixed point");
assert("N11 selection digest", digestValue(without(n11Selection, "result_digest")) === n11Selection.result_digest && n11Selection.result_digest === "1af381e8886a103a04ed801fd900aedf8a623a6292534da637fd0002ef42b594", "N11 selection digest mismatch");
assert("N11 selected outputs", JSON.stringify(n11Selection.selected_outputs) === JSON.stringify(["architecture", "validation-contracts"]), "N11 unexpected outputs");
const n11RequestPath = `${n11Root}/decisions/BMC-REL-NONNUMERIC-11-OPTION-ADMISSIBILITY-REQUEST.json`;
const n11ReceiptPath = `${n11Root}/decisions/BMC-REL-NONNUMERIC-11-OPTION-PREFILTER-RECEIPT.json`;
const n11OwnerSelectionPath = `${n11Root}/decisions/BMC-REL-NONNUMERIC-11-OWNER-SELECTION-RECEIPT.json`;
const n11Request = readJson(n11RequestPath);
const n11Receipt = readJson(n11ReceiptPath);
const n11OwnerSelection = readJson(n11OwnerSelectionPath);
assert("N11 requestDigest", digestValue(n11Request) === n11Receipt.requestDigest && n11Receipt.requestDigest === "80a240cf23d3beef081569838fd4fe6259a6c629d73516bb2d604a71d58adc5a", "N11 prefilter binding mismatch");
assert("N11 gate route", n11Receipt.routeOutcome === "gate" && n11Receipt.decisionGateRequired === true && n11Receipt.directOptionId === null, "N11 did not route to gate");
const expectedN11Presented = ["BMC-REL-NONNUMERIC-11-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE", "BMC-REL-NONNUMERIC-11-B-PASS-OBSERVED-SUBGRAPH-ONLY", "BMC-REL-NONNUMERIC-11-C-DEFER", "BMC-REL-NONNUMERIC-11-D-STOP"];
assert("N11 presented options", JSON.stringify(n11Receipt.presentedOptionIds) === JSON.stringify(expectedN11Presented), "N11 presented option set mismatch");
const n11Actions = n11Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N11 action gates", n11Actions.length === 2 && n11Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N11 A/B owner gates invalid");
assert("N11 rejected forms", JSON.stringify(n11Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-11-W-PASS-GLOBAL-CYCLE-FREEDOM-WITHOUT-CLOSURE", "BMC-REL-NONNUMERIC-11-X-INFER-CLOSURE-FROM-FEATURE-SCOPE-OR-TOKEN", "BMC-REL-NONNUMERIC-11-Y-SUPPRESS-OBSERVED-CYCLE-IN-OPEN-VIEW", "BMC-REL-NONNUMERIC-11-Z-GLOBALIZE-ALL-PARTIAL-VIEW-POLICY"]), "N11 inadmissible forms not rejected");
assert("N11 immutable selection bytes", digestFile(n11OwnerSelectionPath) === "4e9b30f714e92ff675b18b8e6f76130b0a6de00dcf2bd3236095bd74c39e952a", "N11 selection receipt changed");
assert("N11 selection response", n11OwnerSelection.selection.response === "A" && n11OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-11-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE", "N11 is not exact A");
assert("N11 selection owner and timestamp", n11OwnerSelection.selection.selected_by === "user" && n11OwnerSelection.selection.exact_response_timestamp_exposed === false && n11OwnerSelection.selection.selection_recorded_at === "2026-08-24T02:56:04+01:00" && n11OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N11 owner or timestamp semantics mismatch");
assert("N11 admissibility binding", n11OwnerSelection.admissibility_binding.request_sha256 === digestFile(n11RequestPath) && n11OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n11ReceiptPath) && n11OwnerSelection.admissibility_binding.requestDigest === n11Receipt.requestDigest && n11OwnerSelection.admissibility_binding.hazard_class === "authority" && n11OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N11 gate binding mismatch");
assert("N11 narrow effect", n11OwnerSelection.selection_effect.candidate_design_policy.includes("not-evaluated-incomplete-closure") && n11OwnerSelection.selection_effect.candidate_design_policy.includes("observed prohibited cycle remains invalid") && n11OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("exact closure proof shape")) && n11OwnerSelection.authorization_boundary.n12_or_later_owner_choice_made === false && n11OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N11 scope widened");

const n12ManifestPath = `${n12Root}/DESIGN-SCOPE-MANIFEST.json`;
const n12DenominatorPath = `${n12Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n12SelectionPath = `${n12Root}/DESIGN-SELECTION-RESULT.json`;
const n12Manifest = readJson(n12ManifestPath);
assert("N12 manifest input digest", digestValue(without(n12Manifest, "input_digest")) === n12Manifest.input_digest && n12Manifest.input_digest === "d06139163b5bf60dd5a087ba50efac33d82e27c8f3e3ff517a103e1ff9e22e3f", "N12 canonical digest mismatch");
assert("N12 manifest closed", n12Manifest.unknowns.length === 0 && n12Manifest.authored_by !== "invoke-design-scope-extractor", "N12 manifest is not closed and independent");
const n12Sources = new Map(n12Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N12 exact denominator count", n12Sources.size === 14, `expected 14, got ${n12Sources.size}`);
for (const [relative, expected] of n12Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N12 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n12Denominator = readJson(n12DenominatorPath);
assert("N12 denominator verdict", n12Denominator.verdict === "pass", "N12 denominator failed");
assert("N12 denominator digest", digestValue(without(n12Denominator, "receipt_digest")) === n12Denominator.receipt_digest && n12Denominator.receipt_digest === "b0c6a2641bc704e3c27dfc34cebf24e6c2087f108eab3c022ee029833b4fd741", "N12 denominator digest mismatch");
assert("N12 denominator complete", n12Denominator.inspected_selectors.length === 14 && n12Denominator.unbound_signal_ids.length === 0 && n12Denominator.missing_detector_inputs.length === 0, "N12 denominator incomplete");
const n12Selection = readJson(n12SelectionPath);
assert("N12 selection verdict", n12Selection.verdict === "pass" && n12Selection.evidence_state === "design-validator-pass", "N12 selection failed");
assert("N12 selection fixed point", n12Selection.fixed_point === true && n12Selection.pass_1_digest === n12Selection.pass_2_digest && n12Selection.pass_1_digest === "8a3f7732bf381632f5c551c6f9b40e88b424a7eeff4f38459e19d9c76c817a2a", "N12 selection is not expected fixed point");
assert("N12 selection digest", digestValue(without(n12Selection, "result_digest")) === n12Selection.result_digest && n12Selection.result_digest === "db90b9a9693f6da22e01c7041169a75a990c968cdcad4cc96e1a6323bfbf85e5", "N12 selection digest mismatch");
assert("N12 selected outputs", JSON.stringify(n12Selection.selected_outputs) === JSON.stringify(["architecture", "validation-contracts"]), "N12 unexpected outputs");
const n12RequestPath = `${n12Root}/decisions/BMC-REL-NONNUMERIC-12-OPTION-ADMISSIBILITY-REQUEST.json`;
const n12ReceiptPath = `${n12Root}/decisions/BMC-REL-NONNUMERIC-12-OPTION-PREFILTER-RECEIPT.json`;
const n12OwnerSelectionPath = `${n12Root}/decisions/BMC-REL-NONNUMERIC-12-OWNER-SELECTION-RECEIPT.json`;
const n12Request = readJson(n12RequestPath);
const n12Receipt = readJson(n12ReceiptPath);
const n12OwnerSelection = readJson(n12OwnerSelectionPath);
assert("N12 request bytes", digestFile(n12RequestPath) === "d4e61ef80c134456bc8ea5a5f63b636bb781fb4b2e761633691b3cce77e340f6", "N12 request changed");
assert("N12 receipt bytes", digestFile(n12ReceiptPath) === "9cfacf582b7fb2346c45133e008e8f2428fa5e98dccdc392705c099697ce045f", "N12 receipt changed");
assert("N12 requestDigest", digestValue(n12Request) === n12Receipt.requestDigest && n12Receipt.requestDigest === "54207db8dec5a57170602c594e7b3a507f94f0ff9e329ccff00e870633b17d13", "N12 prefilter binding mismatch");
assert("N12 gate route", n12Receipt.routeOutcome === "gate" && n12Receipt.decisionGateRequired === true && n12Receipt.directOptionId === null, "N12 did not route to gate");
const expectedN12Presented = ["BMC-REL-NONNUMERIC-12-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION", "BMC-REL-NONNUMERIC-12-B-SYMMETRIC-OUTGOING-AND-INCOMING-PLUS-POPULATION", "BMC-REL-NONNUMERIC-12-C-DEFER", "BMC-REL-NONNUMERIC-12-D-STOP"];
assert("N12 presented options", JSON.stringify(n12Receipt.presentedOptionIds) === JSON.stringify(expectedN12Presented), "N12 presented option set mismatch");
const n12Actions = n12Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N12 action gates", n12Actions.length === 2 && n12Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N12 A/B owner gates invalid");
assert("N12 rejected forms", JSON.stringify(n12Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-12-W-ADJACENCY-WITHOUT-COMPLETE-POPULATION", "BMC-REL-NONNUMERIC-12-X-INCOMING-ADJACENCY-ONLY", "BMC-REL-NONNUMERIC-12-Y-INFER-CLOSURE-FROM-FEATURE-SCOPE-OR-TOKEN", "BMC-REL-NONNUMERIC-12-Z-ADD-PER-DIMENSION-CLOSURE-METADATA"]), "N12 inadmissible forms not rejected");
assert("N12 immutable selection bytes", digestFile(n12OwnerSelectionPath) === "a4673b71528b84c778010d22c28d923ec36ea97788862b03a26085e885c3bc0d", "N12 selection receipt changed");
assert("N12 selection response", n12OwnerSelection.selection.response === "A" && n12OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-12-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION", "N12 is not exact A");
assert("N12 selection owner and timestamp", n12OwnerSelection.selection.selected_by === "user" && n12OwnerSelection.selection.exact_response_timestamp_exposed === false && n12OwnerSelection.selection.selection_recorded_at === "2026-08-24T03:15:38+01:00" && n12OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N12 owner or timestamp semantics mismatch");
assert("N12 admissibility binding", n12OwnerSelection.admissibility_binding.request_sha256 === digestFile(n12RequestPath) && n12OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n12ReceiptPath) && n12OwnerSelection.admissibility_binding.requestDigest === n12Receipt.requestDigest && n12OwnerSelection.admissibility_binding.hazard_class === "authority", "N12 gate binding mismatch");
assert("N12 narrow effect", n12OwnerSelection.selection_effect.candidate_design_policy.includes("all outgoing canonical owns adjacency") && n12OwnerSelection.selection_effect.candidate_design_policy.includes("incoming adjacency closure is not required") && n12OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("transitivity")) && n12OwnerSelection.authorization_boundary.n13_or_later_owner_choice_made === false && n12OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N12 scope widened");

const n13ManifestPath = `${n13Root}/DESIGN-SCOPE-MANIFEST.json`;
const n13DenominatorPath = `${n13Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n13SelectionPath = `${n13Root}/DESIGN-SELECTION-RESULT.json`;
const n13Manifest = readJson(n13ManifestPath);
assert("N13 manifest input digest", digestValue(without(n13Manifest, "input_digest")) === n13Manifest.input_digest && n13Manifest.input_digest === "a09e7dbee5c2a25ab5e3a054655b5658e8d82ded26eabb641c924b78816fcb23", "N13 canonical digest mismatch");
assert("N13 manifest closed", n13Manifest.unknowns.length === 0 && n13Manifest.authored_by !== "invoke-design-scope-extractor", "N13 manifest is not closed and independent");
const n13Sources = new Map(n13Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N13 exact denominator count", n13Sources.size === 14, `expected 14, got ${n13Sources.size}`);
for (const [relative, expected] of n13Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N13 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n13Denominator = readJson(n13DenominatorPath);
assert("N13 denominator verdict", n13Denominator.verdict === "pass", "N13 denominator failed");
assert("N13 denominator digest", digestValue(without(n13Denominator, "receipt_digest")) === n13Denominator.receipt_digest && n13Denominator.receipt_digest === "84e3bba3116546a834ee00154822cb1883bb3bbd85eb2ad4310fac5ab7eddf53", "N13 denominator digest mismatch");
assert("N13 denominator complete", n13Denominator.inspected_selectors.length === 14 && n13Denominator.unbound_signal_ids.length === 0 && n13Denominator.missing_detector_inputs.length === 0, "N13 denominator incomplete");
const n13Selection = readJson(n13SelectionPath);
assert("N13 selection verdict", n13Selection.verdict === "pass" && n13Selection.evidence_state === "design-validator-pass", "N13 selection failed");
assert("N13 selection fixed point", n13Selection.fixed_point === true && n13Selection.pass_1_digest === n13Selection.pass_2_digest && n13Selection.pass_1_digest === "2051bb90fc165777dbebd92c30534524f9bb675a5e2d79c7b2cdd7a7f73e68d0", "N13 selection is not expected fixed point");
assert("N13 selection digest", digestValue(without(n13Selection, "result_digest")) === n13Selection.result_digest && n13Selection.result_digest === "4782bf21cce18ccbe9989a6fa03db9e2759a7ff71d7dbf3422d3261d37d4ca5f", "N13 selection digest mismatch");
const n13RequestPath = `${n13Root}/decisions/BMC-REL-NONNUMERIC-13-OPTION-ADMISSIBILITY-REQUEST.json`;
const n13ReceiptPath = `${n13Root}/decisions/BMC-REL-NONNUMERIC-13-OPTION-PREFILTER-RECEIPT.json`;
const n13OwnerSelectionPath = `${n13Root}/decisions/BMC-REL-NONNUMERIC-13-OWNER-SELECTION-RECEIPT.json`;
const n13Request = readJson(n13RequestPath);
const n13Receipt = readJson(n13ReceiptPath);
const n13OwnerSelection = readJson(n13OwnerSelectionPath);
assert("N13 request bytes", digestFile(n13RequestPath) === "a7b3a99cc5b3d6d1d2e87246106b595615daaf31d71609efbaca0c48bcac5c0e", "N13 request changed");
assert("N13 receipt bytes", digestFile(n13ReceiptPath) === "0e14258085a288bc77592e3b01d8fa4e34fc0fbf6a08e0c46219164493633aa3", "N13 receipt changed");
assert("N13 requestDigest", digestValue(n13Request) === n13Receipt.requestDigest && n13Receipt.requestDigest === "f1f5a279d99eeb9dc0edc4d1b9ca11d4ae694e6956a6953164ff8ae16d0b026a", "N13 prefilter binding mismatch");
assert("N13 gate route", n13Receipt.routeOutcome === "gate" && n13Receipt.decisionGateRequired === true && n13Receipt.directOptionId === null, "N13 did not route to gate");
const expectedN13Presented = ["BMC-REL-NONNUMERIC-13-A-UNIFORM-PATH-CONSEQUENCE-POLICY-ACROSS-DIMENSIONS", "BMC-REL-NONNUMERIC-13-B-DIMENSION-SPECIFIC-PATH-CONSEQUENCE-POLICY", "BMC-REL-NONNUMERIC-13-C-DEFER", "BMC-REL-NONNUMERIC-13-D-STOP"];
assert("N13 presented options", JSON.stringify(n13Receipt.presentedOptionIds) === JSON.stringify(expectedN13Presented), "N13 presented option set mismatch");
const n13Actions = n13Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N13 action gates", n13Actions.length === 2 && n13Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N13 A/B owner gates invalid");
assert("N13 rejected forms", JSON.stringify(n13Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-13-W-REJECT-TRANSITIVE-CONSEQUENCE-NOW", "BMC-REL-NONNUMERIC-13-X-DERIVE-SAME-DIMENSION-REACHABILITY-NOW", "BMC-REL-NONNUMERIC-13-Y-INCLUDE-MIXED-DIMENSION-PATHS", "BMC-REL-NONNUMERIC-13-Z-INFER-UNIFORMITY-FROM-N05-OR-OWNS"]), "N13 inadmissible forms not rejected");
assert("N13 immutable selection bytes", digestFile(n13OwnerSelectionPath) === "00d6547ea5db6efe13c5ddcdc963e23a24a984cbeda3fa4d3f3f342d4064600d", "N13 selection receipt changed");
assert("N13 selection response", n13OwnerSelection.selection.response === "B" && n13OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-13-B-DIMENSION-SPECIFIC-PATH-CONSEQUENCE-POLICY", "N13 is not exact B");
assert("N13 selection owner and timestamp", n13OwnerSelection.selection.selected_by === "user" && n13OwnerSelection.selection.exact_response_timestamp_exposed === false && n13OwnerSelection.selection.selection_recorded_at === "2026-08-24T03:34:53+01:00" && n13OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N13 owner or timestamp semantics mismatch");
assert("N13 admissibility binding", n13OwnerSelection.admissibility_binding.request_sha256 === digestFile(n13RequestPath) && n13OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n13ReceiptPath) && n13OwnerSelection.admissibility_binding.requestDigest === n13Receipt.requestDigest && n13OwnerSelection.admissibility_binding.hazard_class === "authority" && n13OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N13 gate binding mismatch");
assert("N13 narrow effect", n13OwnerSelection.selection_effect.candidate_design_policy.includes("independently per admitted D29 dimension") && n13OwnerSelection.selection_effect.does_not_select.some((item) => item.includes("which admitted D29 dimension")) && n13OwnerSelection.authorization_boundary.first_dimension_selected === false && n13OwnerSelection.authorization_boundary.n14_or_later_owner_choice_made === false && n13OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N13 scope widened");
assert("N13 registry binding", n13OwnerSelection.registry_binding.sha256 === "91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4" && JSON.stringify(n13OwnerSelection.registry_binding.current_admitted_ids) === JSON.stringify(["lifecycle", "custody", "write-responsibility"]) && n13OwnerSelection.registry_binding.ordering_semantics === "serialization-only-no-precedence", "N13 registry binding is not exact");
const definitionsText = fs.readFileSync(repoAbsolute("projects/domainspec-v2/definitions/DEFINITIONS.md"), "utf8");
assert("D29 denies registry precedence", definitionsText.includes("The registry order is serialization only and carries no precedence."), "D29 ordering contract changed");
assert("D23 chain consequence and D29 direct boundary", definitionsText.includes("relationship chain") && definitionsText.includes("responsibility for the target Entity's admission as an identity-bearing domain concept") && definitionsText.includes("do not infer mandatory ownership,\nnumeric bounds, self-edge policy, cycle policy, transitivity, closure"), "D23/D29 lifecycle path boundary changed");

const n14SequencingPath = `${n14Root}/decisions/BMC-REL-NONNUMERIC-14-DIMENSION-SEQUENCING-RECEIPT.json`;
const n14Sequencing = readJson(n14SequencingPath);
assert("N14 immutable sequencing bytes", digestFile(n14SequencingPath) === "9ea91447e9379ab55d87e7a4983937e81f69e0b653e52e612a7410a98c242d26", "N14 sequencing receipt changed");
assert("N14 exact lifecycle sequencing", n14Sequencing.clarification.exact_input === "lifecycle" && n14Sequencing.clarification.selected_dimension_id === "lifecycle" && n14Sequencing.clarification.provided_by === "user", "N14 sequencing input mismatch");
assert("N14 sequencing timestamp semantics", n14Sequencing.clarification.exact_response_timestamp_exposed === false && n14Sequencing.clarification.selection_recorded_at === "2026-08-24T03:52:01+01:00" && n14Sequencing.clarification.recording_time_note.includes("not a transport-provided response timestamp"), "N14 sequencing timestamp overstated");
assert("N14 sequencing narrow effect", n14Sequencing.effect.does_not_select.some((item) => item.includes("direct-only")) && n14Sequencing.effect.does_not_select.some((item) => item.includes("derived lifecycle")) && n14Sequencing.authority_boundary.n14_owner_choice_made === false && n14Sequencing.authority_boundary.repository_authority_effect === "none", "N14 sequencing inferred behavior");

const n14ManifestPath = `${n14Root}/DESIGN-SCOPE-MANIFEST.json`;
const n14DenominatorPath = `${n14Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n14SelectionPath = `${n14Root}/DESIGN-SELECTION-RESULT.json`;
const n14Manifest = readJson(n14ManifestPath);
assert("N14 manifest input digest", digestValue(without(n14Manifest, "input_digest")) === n14Manifest.input_digest && n14Manifest.input_digest === "c196a2dee5f20ef0cb786042b93d909f55fd2cd9250af27d8d68f5bcab874eda", "N14 canonical digest mismatch");
assert("N14 manifest closed", n14Manifest.unknowns.length === 0 && n14Manifest.authored_by !== "invoke-design-scope-extractor", "N14 manifest is not closed and independent");
const n14Sources = new Map(n14Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N14 exact denominator count", n14Sources.size === 15, `expected 15, got ${n14Sources.size}`);
for (const [relative, expected] of n14Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N14 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
assert("N14 cumulative closeout is transitive only", !n14Sources.has("projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/DESIGN-CLOSEOUT-RECEIPT.json") && n14Sequencing.bindings.n13_closeout_sha256 === "651a8b376bbed917c51c64f87c5fdbcccb382886853fde9273fd3eff5fefe0e6", "N14 denominator creates a closeout cycle or loses the N13 binding");
const n14Denominator = readJson(n14DenominatorPath);
assert("N14 denominator verdict", n14Denominator.verdict === "pass", "N14 denominator failed");
assert("N14 denominator digest", digestValue(without(n14Denominator, "receipt_digest")) === n14Denominator.receipt_digest && n14Denominator.receipt_digest === "def4b6a91c339e1b1c935874d15a2c1246b25e402508dc5f3b5f0f27964ee714", "N14 denominator digest mismatch");
assert("N14 denominator complete", n14Denominator.inspected_selectors.length === 15 && n14Denominator.unbound_signal_ids.length === 0 && n14Denominator.missing_detector_inputs.length === 0, "N14 denominator incomplete");
const n14Selection = readJson(n14SelectionPath);
assert("N14 selection verdict", n14Selection.verdict === "pass" && n14Selection.evidence_state === "design-validator-pass", "N14 selection failed");
assert("N14 selection fixed point", n14Selection.fixed_point === true && n14Selection.pass_1_digest === n14Selection.pass_2_digest && n14Selection.pass_1_digest === "fdd89fd1368f676c253329dd9074c3527b2979168445fe8415aa175732823077", "N14 selection is not expected fixed point");
assert("N14 selection digest", digestValue(without(n14Selection, "result_digest")) === n14Selection.result_digest && n14Selection.result_digest === "0b2b6e593cb5186cfedbe24c27138c262b867b39dd3fbeeb1f61e31a314adcf6", "N14 selection digest mismatch");
const n14RequestPath = `${n14Root}/decisions/BMC-REL-NONNUMERIC-14-OPTION-ADMISSIBILITY-REQUEST.json`;
const n14ReceiptPath = `${n14Root}/decisions/BMC-REL-NONNUMERIC-14-OPTION-PREFILTER-RECEIPT.json`;
const n14OwnerSelectionPath = `${n14Root}/decisions/BMC-REL-NONNUMERIC-14-OWNER-SELECTION-RECEIPT.json`;
const n14Request = readJson(n14RequestPath);
const n14Receipt = readJson(n14ReceiptPath);
const n14OwnerSelection = readJson(n14OwnerSelectionPath);
assert("N14 request bytes", digestFile(n14RequestPath) === "f9b12bf1f111cf4ad9bf79269679ac563460e112826a555553495a8d5784a5a1", "N14 request changed");
assert("N14 receipt bytes", digestFile(n14ReceiptPath) === "059332cd277ed7f03d9fb570daad8c10709eb9cc122c5e4977034306e6d8edb3", "N14 receipt changed");
assert("N14 requestDigest", digestValue(n14Request) === n14Receipt.requestDigest && n14Receipt.requestDigest === "0c8f65d256407408462b3ef587e5cb8602c39f5be6e9b57f7a0c9382de43d4bf", "N14 prefilter binding mismatch");
assert("N14 gate route", n14Receipt.routeOutcome === "gate" && n14Receipt.decisionGateRequired === true && n14Receipt.directOptionId === null, "N14 did not route to gate");
const expectedN14Presented = ["BMC-REL-NONNUMERIC-14-A-DIRECT-ONLY-LIFECYCLE-OWNERSHIP-CONSEQUENCE", "BMC-REL-NONNUMERIC-14-B-DERIVE-LIFECYCLE-OWNERSHIP-REACHABILITY", "BMC-REL-NONNUMERIC-14-C-DEFER", "BMC-REL-NONNUMERIC-14-D-STOP"];
assert("N14 presented options", JSON.stringify(n14Receipt.presentedOptionIds) === JSON.stringify(expectedN14Presented), "N14 presented option set mismatch");
const n14Actions = n14Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N14 action gates", n14Actions.length === 2 && n14Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N14 A/B owner gates invalid");
assert("N14 rejected forms", JSON.stringify(n14Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-14-W-AUTHOR-DERIVED-CANONICAL-OWNS-EDGES", "BMC-REL-NONNUMERIC-14-X-INCLUDE-CUSTODY-WRITE-OR-MIXED-DIMENSION-PATHS", "BMC-REL-NONNUMERIC-14-Y-REQUIRE-LIFECYCLE-OWNERSHIP-PATHS", "BMC-REL-NONNUMERIC-14-Z-SELECT-REPRESENTATION-CLOSURE-OR-RUNTIME"]), "N14 inadmissible forms not rejected");
assert("N14 immutable owner selection", digestFile(n14OwnerSelectionPath) === "53e241ef0eea9ddb06d745439571635ab8a3e315df0cdc34d0c7e1c9d0e3ea83", "N14 owner selection receipt changed");
assert("N14 exact A selection", n14OwnerSelection.selection.response === "A" && n14OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-14-A-DIRECT-ONLY-LIFECYCLE-OWNERSHIP-CONSEQUENCE" && n14OwnerSelection.selection.selected_by === "user", "N14 selection is not exact A/user");
assert("N14 recording timestamp semantics", n14OwnerSelection.selection.exact_response_timestamp_exposed === false && n14OwnerSelection.selection.selection_recorded_at === "2026-08-24T04:15:27+01:00" && n14OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N14 timestamp overstated");
assert("N14 admissibility binding", n14OwnerSelection.admissibility_binding.request_sha256 === digestFile(n14RequestPath) && n14OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n14ReceiptPath) && n14OwnerSelection.admissibility_binding.requestDigest === n14Receipt.requestDigest && n14OwnerSelection.admissibility_binding.hazard_class === "authority" && n14OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N14 gate binding mismatch");
assert("N14 narrow direct-only effect", n14OwnerSelection.selection_effect.candidate_design_policy.includes("authored direct lifecycle owns facts") && n14OwnerSelection.selection_effect.candidate_design_policy.includes("no upstream lifecycle responsibility") && n14OwnerSelection.authorization_boundary.next_dimension_selected === false && n14OwnerSelection.authorization_boundary.n15_or_later_owner_choice_made === false, "N14 selection scope widened");

const decisionLog = readText("DESIGN-DECISION-LOG.md");
assert("N01 lifecycle resolved", decisionLog.includes("## Resolved N01") && decisionLog.includes("BMC-REL-NONNUMERIC-01-A-REJECT-DUPLICATE-AUTHORED-CREATES"), "N01 lifecycle stale");
assert("N02 lifecycle resolved", decisionLog.includes("## Resolved N02") && decisionLog.includes("BMC-REL-NONNUMERIC-02-A-ORDERED-STEP-IDS-SOLE-AUTHOR"), "N02 lifecycle stale");
assert("N03 lifecycle resolved", decisionLog.includes("## Resolved N03") && decisionLog.includes("BMC-REL-NONNUMERIC-03-A-REJECT-DUPLICATE-AUTHORED-ORCHESTRATES"), "N03 lifecycle stale");
assert("N04 lifecycle resolved", decisionLog.includes("## Resolved N04") && decisionLog.includes("BMC-REL-NONNUMERIC-04-A-REJECT-OWNS-SELF-EDGE-PER-DIMENSION"), "N04 lifecycle stale");
assert("N05 lifecycle resolved", decisionLog.includes("## Resolved N05") && decisionLog.includes("BMC-REL-NONNUMERIC-05-A-UNIFORM-CYCLE-POLICY-ACROSS-DIMENSIONS"), "N05 lifecycle stale");
assert("N06 lifecycle resolved", decisionLog.includes("## Resolved N06") && decisionLog.includes("BMC-REL-NONNUMERIC-06-A-REJECT-UNIFORM-SAME-DIMENSION-LONGER-CYCLES"), "N06 lifecycle stale");
assert("N07 lifecycle resolved", decisionLog.includes("## Resolved N07") && decisionLog.includes("BMC-REL-NONNUMERIC-07-A-ALLOW-MIXED-DIMENSION-CLOSED-PATHS"), "N07 lifecycle stale");
assert("N08 lifecycle resolved", decisionLog.includes("## Resolved N08") && decisionLog.includes("BMC-REL-NONNUMERIC-08-A-REJECT-DUPLICATE-AUTHORED-OWNS"), "N08 lifecycle stale");
assert("N09 lifecycle resolved", decisionLog.includes("## Resolved N09") && decisionLog.includes("BMC-REL-NONNUMERIC-09-A-PRESERVE-DIMENSION-IN-GENERATED-OWNED-BY"), "N09 lifecycle stale");
assert("N10 lifecycle resolved", decisionLog.includes("## Resolved N10") && decisionLog.includes("BMC-REL-NONNUMERIC-10-A-COMPUTE-OWNED-BY-FROM-CANONICAL-OWNS"), "N10 lifecycle stale");
assert("N11 lifecycle resolved", decisionLog.includes("## Resolved N11") && decisionLog.includes("BMC-REL-NONNUMERIC-11-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE"), "N11 lifecycle stale");
assert("N12 lifecycle resolved", decisionLog.includes("## Resolved N12") && decisionLog.includes("BMC-REL-NONNUMERIC-12-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION"), "N12 lifecycle stale");
assert("N13 lifecycle resolved", decisionLog.includes("## Resolved N13") && decisionLog.includes("BMC-REL-NONNUMERIC-13-B-DIMENSION-SPECIFIC-PATH-CONSEQUENCE-POLICY"), "N13 lifecycle stale");
assert("N14 sequencing lifecycle", decisionLog.includes("## Resolved Dimension Sequencing Clarification") && decisionLog.includes("Exact input / selected dimension: `lifecycle` / `lifecycle`"), "N14 sequencing lifecycle stale");
assert("N14 lifecycle resolved", decisionLog.includes("## Resolved N14") && decisionLog.includes("BMC-REL-NONNUMERIC-14-A-DIRECT-ONLY-LIFECYCLE-OWNERSHIP-CONSEQUENCE"), "N14 lifecycle stale");
assert("N15 custody sequencing", decisionLog.includes("## Resolved Next-Dimension Sequencing Clarification") && decisionLog.includes("Exact input / selected dimension: `custody` / `custody`"), "N15 custody sequencing stale");
assert("N15 lifecycle resolved", decisionLog.includes("## Resolved N15") && decisionLog.includes("BMC-REL-NONNUMERIC-15-A-DIRECT-ONLY-CUSTODY-OWNERSHIP-CONSEQUENCE"), "N15 lifecycle stale");
assert("N16 lifecycle resolved", decisionLog.includes("## Resolved N16") && decisionLog.includes("BMC-REL-NONNUMERIC-16-A-DIRECT-ONLY-WRITE-RESPONSIBILITY-CONSEQUENCE"), "N16 lifecycle stale");
assert("N17 lifecycle resolved", decisionLog.includes("## Resolved N17") && decisionLog.includes("BMC-REL-NONNUMERIC-17-A-DIRECT-FACTS-ONLY-FOR-MIXED-DIMENSION-PATHS"), "N17 lifecycle stale");
assert("N18 lifecycle resolved", decisionLog.includes("## Resolved N18") && decisionLog.includes("BMC-REL-NONNUMERIC-18-A-NO-DERIVED-SELF-REACHABILITY-FROM-MIXED-CLOSED-PATHS"), "N18 lifecycle stale");
assert("N19 lifecycle resolved", decisionLog.includes("## Resolved N19") && decisionLog.includes("BMC-REL-NONNUMERIC-19-A-UNIFORM-SELF-EDGE-POLICY-ACROSS-MEMBERSHIP-KINDS"), "N19 lifecycle stale");
assert("N20 lifecycle resolved", decisionLog.includes("## Resolved N20") && decisionLog.includes("BMC-REL-NONNUMERIC-20-A-REJECT-UNIFORM-BELONGS-TO-SELF-EDGES"), "N20 lifecycle stale");
assert("N21 lifecycle resolved", decisionLog.includes("## Resolved N21") && decisionLog.includes("BMC-REL-NONNUMERIC-21-A-UNIFORM-LONGER-CYCLE-POLICY-ACROSS-MEMBERSHIP-KINDS"), "N21 lifecycle stale");
assert("N22 lifecycle resolved", decisionLog.includes("## Resolved N22") && decisionLog.includes("BMC-REL-NONNUMERIC-22-A-REJECT-UNIFORM-SAME-KIND-LONGER-CYCLES"), "N22 lifecycle stale");
assert("N23 lifecycle resolved", decisionLog.includes("## Resolved N23") && decisionLog.includes("BMC-REL-NONNUMERIC-23-A-ALLOW-MIXED-KIND-CLOSED-PATHS"), "N23 lifecycle stale");
assert("N24 lifecycle resolved", decisionLog.includes("## Resolved N24") && decisionLog.includes("BMC-REL-NONNUMERIC-24-A-REJECT-DUPLICATE-AUTHORED-BELONGS-TO"), "N24 lifecycle stale");
assert("N25 lifecycle resolved", decisionLog.includes("## Resolved N25") && decisionLog.includes("BMC-REL-NONNUMERIC-25-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE"), "N25 lifecycle stale");
assert("N26 lifecycle resolved", decisionLog.includes("## Resolved N26") && decisionLog.includes("BMC-REL-NONNUMERIC-26-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION"), "N26 lifecycle stale");
assert("N27 lifecycle resolved", decisionLog.includes("## Resolved N27") && decisionLog.includes("BMC-REL-NONNUMERIC-27-B-KIND-SPECIFIC-PATH-CONSEQUENCE-POLICY"), "N27 lifecycle stale");
assert("first-kind sequencing resolved", decisionLog.includes("## Resolved First Membership-Kind Sequencing Clarification") && decisionLog.includes("Exact input / selected membership kind: `classification` / `classification`") && decisionLog.includes("BMC-REL-NONNUMERIC-28-KIND-SEQUENCING-RECEIPT.json"), "first-kind sequencing lifecycle stale");
assert("resolved N31 and produces sequencing", decisionLog.includes("## Resolved N31") && decisionLog.includes("BMC-REL-NONNUMERIC-31-A-NO-DERIVED-SELF-REACHABILITY-FROM-MIXED-KIND-CLOSED-PATHS") && decisionLog.includes("## Resolved Event-Provenance Verb Sequencing Clarification") && decisionLog.includes("Exact input / selected verb: `produces` / `produces`") && decisionLog.includes("BMC-REL-NONNUMERIC-32-VERB-SEQUENCING-RECEIPT.json"), "N31/produces sequencing lifecycle stale");
assert("resolved N32 and N33", decisionLog.includes("## Resolved N32") && decisionLog.includes("BMC-REL-NONNUMERIC-32-A-REJECT-DUPLICATE-AUTHORED-PRODUCES") && decisionLog.includes("## Resolved N33") && decisionLog.includes("BMC-REL-NONNUMERIC-33-A-REJECT-DUPLICATE-AUTHORED-EMITS") && decisionLog.includes("BMC-REL-NONNUMERIC-33-OWNER-SELECTION-RECEIPT.json"), "N32/N33 lifecycle stale");
assert("resolved N34 sequencing clarification", decisionLog.includes("## Resolved N34 Subject Sequencing Clarification") && decisionLog.includes("`emits + occurrence semantics`") && decisionLog.includes("`emits` / `occurrence_semantics`") && decisionLog.includes("Decision effect: `none`") && decisionLog.includes("Authority effect: `none`"), "N34 sequencing lifecycle stale");
assert("resolved N34 and historical sequencing clarification", decisionLog.includes("## Resolved N34") && decisionLog.includes("BMC-REL-NONNUMERIC-34-A-RETAIN-CONCEPT-LEVEL-AUTHORED-EMITS-SEMANTICS") && decisionLog.includes("BMC-REL-NONNUMERIC-34-OWNER-SELECTION-RECEIPT.json") && decisionLog.includes("## Current Post-N34 Owner Sequencing Clarification") && decisionLog.includes("BMC-REL-NONNUMERIC-POST-N34-SUBJECT-SEQUENCING-CLARIFICATION"), "N34 closeout or post-N34 clarification history stale");
assert("resolved N35 and current sequencing clarification", decisionLog.includes("## Resolved N35") && decisionLog.includes("BMC-REL-NONNUMERIC-35-A-ORDERING-NOT-APPLICABLE-TO-AUTHORED-EMITS-FACTS") && decisionLog.includes("BMC-REL-NONNUMERIC-35-OWNER-SELECTION-RECEIPT.json") && decisionLog.includes("## Current Post-N35 Owner Sequencing Clarification") && decisionLog.includes("BMC-REL-NONNUMERIC-POST-N35-SUBJECT-SEQUENCING-CLARIFICATION") && decisionLog.includes("Recommendation: `null`") && decisionLog.includes("Status: `blocked-at-owner-clarification`"), "N35 closeout or post-N35 clarification lifecycle stale");
const currentResult = readText("DESIGN-RESULT.md");
assert("result N35 closed and clarification current", currentResult.includes("N35 owner receipt SHA-256") && currentResult.includes("N35 gate formed / owner choice made: `true` / `true`") && currentResult.includes("N36 gate formed: `false`") && currentResult.includes("Selection: `null`") && currentResult.includes("Next route: `owner-sequencing-clarification`") && currentResult.includes("Authority effect: `none`"), "post-N35 result lifecycle stale or widened");
const n14Architecture = readText(`${n14Root}/ARCHITECTURE-BUNDLE.md`);
assert("N14 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n14Architecture.includes(heading)), "N14 six-view bundle incomplete");
assert("N14 architecture null selection", n14Architecture.includes("Selection: `null`") && n14Architecture.includes("`authority_effect: none`"), "N14 architecture implies a decision");
assert("N14 recommendation and boundary", n14Architecture.includes("Recommendation: A") && n14Architecture.includes("non-authoritative") && n14Architecture.includes("Neither route creates a") && n14Architecture.includes("custody") && n14Architecture.includes("representation"), "N14 architecture boundary incomplete");
const n14Examples = readText(`${n14Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N14 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n14Examples.includes(heading)), "N14 example rung missing");
assert("N14 examples decision effect none", n14Examples.includes("`decision_effect: none`") && n14Examples.includes("## Coverage") && n14Examples.includes("hypothetical"), "N14 examples imply selection or hide hypotheticals");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N14 example coverage ${label}`, n14Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n14Context = readText(`${n14Root}/DESIGN-CONTEXT.md`);
assert("N14 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n14Context.includes(technique)), "N14 dispatch trace incomplete");
assert("N14 Distill pass", readText(`${n14Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N14 Distill did not pass");
const n14Handoff = readJson(`${n14Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N14 strict handoff", n14Handoff.status === "blocked-at-owner-decision" && n14Handoff.execution_allowed === false && n14Handoff.selected_option === null && n14Handoff.sequenced_dimension === "lifecycle" && n14Handoff.authority_effect === "none", "N14 handoff widened authority");

assert("D29 custody boundary", definitionsText.includes("responsibility for stewardship, possession, placement, or operational keeping") && definitionsText.includes("`custody` permits a distinct custodian") && definitionsText.includes("do not infer mandatory ownership,\nnumeric bounds, self-edge policy, cycle policy, transitivity, closure"), "D29 custody path boundary changed");
const n15SequencingPath = `${n15Root}/decisions/BMC-REL-NONNUMERIC-15-DIMENSION-SEQUENCING-RECEIPT.json`;
const n15Sequencing = readJson(n15SequencingPath);
assert("N15 immutable sequencing bytes", digestFile(n15SequencingPath) === "c849d5e311dffd63116731f14d5fdc192eccc4c984e2ffbf04ac25bc21cb03dd", "N15 sequencing receipt changed");
assert("N15 exact custody sequencing", n15Sequencing.clarification.exact_input === "custody" && n15Sequencing.clarification.selected_dimension_id === "custody" && n15Sequencing.clarification.provided_by === "user", "N15 sequencing input mismatch");
assert("N15 sequencing timestamp semantics", n15Sequencing.clarification.exact_response_timestamp_exposed === false && n15Sequencing.clarification.selection_recorded_at === "2026-08-24T04:59:48+01:00" && n15Sequencing.clarification.recording_time_note.includes("not a transport-provided response timestamp"), "N15 sequencing timestamp overstated");
assert("N15 sequencing narrow effect", n15Sequencing.effect.does_not_select.some((item) => item.includes("direct-only custody")) && n15Sequencing.effect.does_not_select.some((item) => item.includes("derived custody")) && n15Sequencing.effect.does_not_select.some((item) => item.includes("write-responsibility")) && n15Sequencing.authority_boundary.n15_owner_choice_made === false && n15Sequencing.authority_boundary.repository_authority_effect === "none", "N15 sequencing inferred behavior");
assert("N15 sequencing prior bindings", n15Sequencing.bindings.n14_selection_receipt_sha256 === digestFile(n14OwnerSelectionPath) && n15Sequencing.bindings.n14_closeout_sha256 === "1ba7696cf166be84c4c87c5ee00e9cef7c62c71e89cf5f6f1c9652bbf4ab2e79" && n15Sequencing.bindings.n13_selection_receipt_sha256 === digestFile(n13OwnerSelectionPath), "N15 sequencing prior evidence mismatch");

const n15ManifestPath = `${n15Root}/DESIGN-SCOPE-MANIFEST.json`;
const n15DenominatorPath = `${n15Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n15SelectionPath = `${n15Root}/DESIGN-SELECTION-RESULT.json`;
const n15Manifest = readJson(n15ManifestPath);
assert("N15 manifest bytes", digestFile(n15ManifestPath) === "48acd9377acfde3242621811d5376c73c307e36ee7b9a0236b36ce49c6d79b7c", "N15 manifest changed");
assert("N15 manifest input digest", digestValue(without(n15Manifest, "input_digest")) === n15Manifest.input_digest && n15Manifest.input_digest === "9d1f57c81151571b479f4c5276a3eefb8dee27ff8b3f36833c20f2f89a457b6a", "N15 canonical digest mismatch");
assert("N15 manifest closed", n15Manifest.unknowns.length === 0 && n15Manifest.authored_by !== "invoke-design-scope-extractor", "N15 manifest is not closed and independent");
const n15Sources = new Map(n15Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N15 exact denominator count", n15Sources.size === 7, `expected 7, got ${n15Sources.size}`);
for (const [relative, expected] of n15Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N15 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
assert("N15 minimal denominator rationale", readText(`${n15Root}/DESIGN-CONTEXT.md`).includes("seven direct exact sources") && readText(`${n15Root}/DESIGN-CONTEXT.md`).includes("Repeating\nN04-N12 directly would add no N15 claim"), "N15 denominator reduction unexplained");
const n15Denominator = readJson(n15DenominatorPath);
assert("N15 denominator bytes", digestFile(n15DenominatorPath) === "2a86f6c7cacaab2099fce65b95c887961efb33aa22fd746965330b432421f236", "N15 denominator changed");
assert("N15 denominator verdict", n15Denominator.verdict === "pass" && n15Denominator.receipt_digest === "06983fa78a760038f3cb2e133f69fd67346f22f775f6cea13e5105c7b262f16a" && n15Denominator.inspected_selectors.length === 7 && n15Denominator.unbound_signal_ids.length === 0 && n15Denominator.missing_detector_inputs.length === 0, "N15 denominator incomplete");
const n15Selection = readJson(n15SelectionPath);
assert("N15 selection bytes", digestFile(n15SelectionPath) === "be9421d4b85ee345ea5a9fd1ae87eddc2f09ce06e4b923b915dc52034859f1ff", "N15 selection changed");
assert("N15 selection fixed point", n15Selection.verdict === "pass" && n15Selection.evidence_state === "design-validator-pass" && n15Selection.fixed_point === true && n15Selection.pass_1_digest === n15Selection.pass_2_digest && n15Selection.pass_1_digest === "45458214ff8fc59ec3de103d01156a9d07044c84d101b50c8a9f041a8122ad5e" && n15Selection.result_digest === "7afdd35611a970ed4983bee9206d6af2d1e249c83a5a355d2f6a9049140f8e79", "N15 selection fixed point mismatch");
const n15RequestPath = `${n15Root}/decisions/BMC-REL-NONNUMERIC-15-OPTION-ADMISSIBILITY-REQUEST.json`;
const n15ReceiptPath = `${n15Root}/decisions/BMC-REL-NONNUMERIC-15-OPTION-PREFILTER-RECEIPT.json`;
const n15Request = readJson(n15RequestPath);
const n15Receipt = readJson(n15ReceiptPath);
assert("N15 request bytes", digestFile(n15RequestPath) === "b7f5afdc36977fc2794a76863f3f5c2360f9d6e215a518e1eb175df15b3d1e26", "N15 request changed");
assert("N15 receipt bytes", digestFile(n15ReceiptPath) === "23e111ce56541a93b69f77058cdb337cde2e3390edb6d904751b20732925426f", "N15 receipt changed");
assert("N15 requestDigest", digestValue(n15Request) === n15Receipt.requestDigest && n15Receipt.requestDigest === "8a60b9974bcf4726c4301b9fea6003f8e45649771ec0ac593d1e823e26f19625", "N15 prefilter binding mismatch");
const expectedN15Presented = ["BMC-REL-NONNUMERIC-15-A-DIRECT-ONLY-CUSTODY-OWNERSHIP-CONSEQUENCE", "BMC-REL-NONNUMERIC-15-B-DERIVE-CUSTODY-OWNERSHIP-REACHABILITY", "BMC-REL-NONNUMERIC-15-C-DEFER", "BMC-REL-NONNUMERIC-15-D-STOP"];
assert("N15 gate route and presented options", n15Receipt.routeOutcome === "gate" && n15Receipt.decisionGateRequired === true && n15Receipt.directOptionId === null && JSON.stringify(n15Receipt.presentedOptionIds) === JSON.stringify(expectedN15Presented), "N15 gate route mismatch");
const n15Actions = n15Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N15 action gates", n15Actions.length === 2 && n15Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N15 A/B owner gates invalid");
assert("N15 rejected forms", JSON.stringify(n15Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-15-W-AUTHOR-DERIVED-CANONICAL-OWNS-EDGES", "BMC-REL-NONNUMERIC-15-X-INCLUDE-LIFECYCLE-WRITE-OR-MIXED-DIMENSION-PATHS", "BMC-REL-NONNUMERIC-15-Y-REQUIRE-CUSTODY-OWNERSHIP-PATHS", "BMC-REL-NONNUMERIC-15-Z-SELECT-NAMING-PROVENANCE-REPRESENTATION-CLOSURE-OR-RUNTIME"]), "N15 inadmissible forms not rejected");
const n15Architecture = readText(`${n15Root}/ARCHITECTURE-BUNDLE.md`);
assert("N15 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n15Architecture.includes(heading)), "N15 six-view bundle incomplete");
assert("N15 architecture null selection", n15Architecture.includes("Selection: `null`") && n15Architecture.includes("`authority_effect: none`") && n15Architecture.includes("Recommendation: A"), "N15 architecture implies a choice or lacks recommendation");
const n15Examples = readText(`${n15Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N15 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n15Examples.includes(heading)) && n15Examples.includes("`decision_effect: none`") && n15Examples.includes("hypothetical"), "N15 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N15 example coverage ${label}`, n15Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n15Context = readText(`${n15Root}/DESIGN-CONTEXT.md`);
assert("N15 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n15Context.includes(technique)), "N15 dispatch trace incomplete");
assert("N15 Distill pass", readText(`${n15Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N15 Distill did not pass");
const n15Handoff = readJson(`${n15Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N15 strict handoff", n15Handoff.status === "blocked-at-owner-decision" && n15Handoff.execution_allowed === false && n15Handoff.selected_option === null && n15Handoff.sequenced_dimension === "custody" && n15Handoff.authority_effect === "none", "N15 handoff widened authority");

const n15OwnerSelectionPath = `${n15Root}/decisions/BMC-REL-NONNUMERIC-15-OWNER-SELECTION-RECEIPT.json`;
const n15OwnerSelection = readJson(n15OwnerSelectionPath);
assert("N15 immutable owner selection", digestFile(n15OwnerSelectionPath) === "3fb27d68d7cd15b4503837bc7cfbcf1548565dca58a5135b468affdae4600679", "N15 owner selection receipt changed");
assert("N15 exact A selection", n15OwnerSelection.selection.response === "A" && n15OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-15-A-DIRECT-ONLY-CUSTODY-OWNERSHIP-CONSEQUENCE" && n15OwnerSelection.selection.selected_by === "user", "N15 selection is not exact A/user");
assert("N15 recording timestamp semantics", n15OwnerSelection.selection.exact_response_timestamp_exposed === false && n15OwnerSelection.selection.selection_recorded_at === "2026-08-24T05:28:45+01:00" && n15OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N15 timestamp overstated");
assert("N15 admissibility binding", n15OwnerSelection.admissibility_binding.request_sha256 === digestFile(n15RequestPath) && n15OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n15ReceiptPath) && n15OwnerSelection.admissibility_binding.requestDigest === n15Receipt.requestDigest && n15OwnerSelection.admissibility_binding.hazard_class === "authority" && n15OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N15 gate binding mismatch");
assert("N15 narrow direct-only effect", n15OwnerSelection.selection_effect.candidate_design_policy.includes("authored direct custody owns facts") && n15OwnerSelection.selection_effect.candidate_design_policy.includes("no upstream custody responsibility") && n15OwnerSelection.registry_binding.remaining_unselected_dimension_ids.length === 1 && n15OwnerSelection.registry_binding.remaining_unselected_dimension_ids[0] === "write-responsibility" && n15OwnerSelection.authorization_boundary.n16_or_later_owner_choice_made === false, "N15 selection scope widened");

assert("D29 write-responsibility boundary", definitionsText.includes("responsibility and authority for changing the target Entity's business state") && definitionsText.includes("runtime writers, Operations, permissions, and calls do not become\ncanonical `owns` edges") && definitionsText.includes("do not infer mandatory ownership,\nnumeric bounds, self-edge policy, cycle policy, transitivity, closure"), "D29 write-responsibility path boundary changed");
const n16ManifestPath = `${n16Root}/DESIGN-SCOPE-MANIFEST.json`;
const n16DenominatorPath = `${n16Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n16SelectionPath = `${n16Root}/DESIGN-SELECTION-RESULT.json`;
const n16Manifest = readJson(n16ManifestPath);
assert("N16 manifest bytes", digestFile(n16ManifestPath) === "847f3b0cfa8d77782a3fcee7ec029df9235fc0111b7d8ede9b73b95ce9d4dd85", "N16 manifest changed");
assert("N16 manifest input digest", digestValue(without(n16Manifest, "input_digest")) === n16Manifest.input_digest && n16Manifest.input_digest === "e881b35141e28483669fc5ddf7dfa317940189ec218e25a6fb7b689f980ac4de", "N16 canonical digest mismatch");
assert("N16 manifest closed", n16Manifest.unknowns.length === 0 && n16Manifest.authored_by !== "invoke-design-scope-extractor", "N16 manifest is not closed and independent");
const n16Sources = new Map(n16Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N16 exact denominator count", n16Sources.size === 7, `expected 7, got ${n16Sources.size}`);
for (const [relative, expected] of n16Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N16 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
assert("N16 denominator rationale", readText(`${n16Root}/DESIGN-CONTEXT.md`).includes("seven direct exact sources") && readText(`${n16Root}/DESIGN-CONTEXT.md`).includes("set difference") && readText(`${n16Root}/DESIGN-CONTEXT.md`).includes("not by the registry's serialization-only order"), "N16 denominator or sole-remaining derivation unexplained");
const n16Denominator = readJson(n16DenominatorPath);
assert("N16 denominator bytes", digestFile(n16DenominatorPath) === "44ac3a3cd9b832c6b8b6ea6d0c667e901bc6260c23954462893f2a6fada56384", "N16 denominator changed");
assert("N16 denominator verdict", n16Denominator.verdict === "pass" && n16Denominator.receipt_digest === "5a50809688c0f90daee094f7dd23d684c34f82d4e1d820decec068ee58019a6a" && n16Denominator.inspected_selectors.length === 7 && n16Denominator.unbound_signal_ids.length === 0 && n16Denominator.missing_detector_inputs.length === 0, "N16 denominator incomplete");
const n16Selection = readJson(n16SelectionPath);
assert("N16 selection bytes", digestFile(n16SelectionPath) === "4669de23558a40d289bf0e1601aff2fa95e49a1c010ee8a9539c2a867cb5a90e", "N16 selection changed");
assert("N16 selection fixed point", n16Selection.verdict === "pass" && n16Selection.evidence_state === "design-validator-pass" && n16Selection.fixed_point === true && n16Selection.pass_1_digest === n16Selection.pass_2_digest && n16Selection.pass_1_digest === "63cb95fc8216034a3330bd6d2874592a560f219d1dcf41acd79a41463046ebb0" && n16Selection.result_digest === "83e0c0a06cca2bf85adc329136b4a477e819522a6c1709af9fb2427e76a5846e", "N16 selection fixed point mismatch");
const n16RequestPath = `${n16Root}/decisions/BMC-REL-NONNUMERIC-16-OPTION-ADMISSIBILITY-REQUEST.json`;
const n16ReceiptPath = `${n16Root}/decisions/BMC-REL-NONNUMERIC-16-OPTION-PREFILTER-RECEIPT.json`;
const n16Request = readJson(n16RequestPath);
const n16Receipt = readJson(n16ReceiptPath);
assert("N16 request bytes", digestFile(n16RequestPath) === "b2aab6ac44ce2d32e8c172033b88aeb6937b3a6a7a619d5ee31612363b0d7836", "N16 request changed");
assert("N16 receipt bytes", digestFile(n16ReceiptPath) === "faa4dfe945d450f6a5ae2f61ee1c87fc3228adb0054dc79818aba17baf209be2", "N16 receipt changed");
assert("N16 requestDigest", digestValue(n16Request) === n16Receipt.requestDigest && n16Receipt.requestDigest === "154f46a7d07715afff70f8aa67e26806c5174013dbab9b996478da56044dcd0e", "N16 prefilter binding mismatch");
const expectedN16Presented = ["BMC-REL-NONNUMERIC-16-A-DIRECT-ONLY-WRITE-RESPONSIBILITY-CONSEQUENCE", "BMC-REL-NONNUMERIC-16-B-DERIVE-WRITE-RESPONSIBILITY-REACHABILITY", "BMC-REL-NONNUMERIC-16-C-DEFER", "BMC-REL-NONNUMERIC-16-D-STOP"];
assert("N16 gate route and presented options", n16Receipt.routeOutcome === "gate" && n16Receipt.decisionGateRequired === true && n16Receipt.directOptionId === null && JSON.stringify(n16Receipt.presentedOptionIds) === JSON.stringify(expectedN16Presented), "N16 gate route mismatch");
const n16Actions = n16Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N16 action gates", n16Actions.length === 2 && n16Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N16 A/B owner gates invalid");
assert("N16 rejected forms", JSON.stringify(n16Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-16-W-AUTHOR-DERIVED-CANONICAL-OWNS-EDGES", "BMC-REL-NONNUMERIC-16-X-INCLUDE-LIFECYCLE-CUSTODY-OR-MIXED-DIMENSION-PATHS", "BMC-REL-NONNUMERIC-16-Y-PROMOTE-RUNTIME-WRITERS-OPERATIONS-PERMISSIONS-OR-CALLS", "BMC-REL-NONNUMERIC-16-Z-REQUIRE-OWNERSHIP-OR-SELECT-REPRESENTATION-CLOSURE-RUNTIME-NUMERIC"]), "N16 inadmissible forms not rejected");
const n16Architecture = readText(`${n16Root}/ARCHITECTURE-BUNDLE.md`);
assert("N16 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n16Architecture.includes(heading)), "N16 six-view bundle incomplete");
assert("N16 architecture null selection", n16Architecture.includes("Selection: `null`") && n16Architecture.includes("`authority_effect: none`") && n16Architecture.includes("Recommendation: A") && n16Architecture.includes("RuntimeActorExclusion"), "N16 architecture implies a choice or lacks boundary");
const n16Examples = readText(`${n16Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N16 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n16Examples.includes(heading)) && n16Examples.includes("`decision_effect: none`") && n16Examples.includes("hypothetical"), "N16 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N16 example coverage ${label}`, n16Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n16Context = readText(`${n16Root}/DESIGN-CONTEXT.md`);
assert("N16 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n16Context.includes(technique)), "N16 dispatch trace incomplete");
assert("N16 Distill pass", readText(`${n16Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N16 Distill did not pass");
const n16Handoff = readJson(`${n16Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N16 strict handoff", n16Handoff.status === "blocked-at-owner-decision" && n16Handoff.execution_allowed === false && n16Handoff.selected_option === null && n16Handoff.dimension === "write-responsibility" && n16Handoff.authority_effect === "none", "N16 handoff widened authority");

const n16OwnerSelectionPath = `${n16Root}/decisions/BMC-REL-NONNUMERIC-16-OWNER-SELECTION-RECEIPT.json`;
const n16OwnerSelection = readJson(n16OwnerSelectionPath);
assert("N16 immutable owner selection", digestFile(n16OwnerSelectionPath) === "770c7e25769aafb7a5c663416064f396165a1fc509cd359645f48a14d1b69ef5", "N16 owner selection receipt changed");
assert("N16 exact A selection", n16OwnerSelection.selection.response === "A" && n16OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-16-A-DIRECT-ONLY-WRITE-RESPONSIBILITY-CONSEQUENCE" && n16OwnerSelection.selection.selected_by === "user", "N16 selection is not exact A/user");
assert("N16 recording timestamp semantics", n16OwnerSelection.selection.exact_response_timestamp_exposed === false && n16OwnerSelection.selection.selection_recorded_at === "2026-08-24T13:13:51+01:00" && n16OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N16 timestamp overstated");
assert("N16 admissibility binding", n16OwnerSelection.admissibility_binding.request_sha256 === digestFile(n16RequestPath) && n16OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n16ReceiptPath) && n16OwnerSelection.admissibility_binding.requestDigest === n16Receipt.requestDigest && n16OwnerSelection.admissibility_binding.hazard_class === "authority" && n16OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N16 gate binding mismatch");
assert("N16 narrow direct-only effect", n16OwnerSelection.selection_effect.candidate_design_policy.includes("authored direct write-responsibility owns facts") && n16OwnerSelection.selection_effect.candidate_design_policy.includes("no upstream write-responsibility responsibility") && n16OwnerSelection.selection_effect.preserved_separations.some((item) => item.includes("runtime writers")) && n16OwnerSelection.registry_binding.remaining_unselected_dimension_ids.length === 0 && n16OwnerSelection.authorization_boundary.n17_or_later_owner_choice_made === false, "N16 selection scope widened");

const n17ManifestPath = `${n17Root}/DESIGN-SCOPE-MANIFEST.json`;
const n17DenominatorPath = `${n17Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n17SelectionPath = `${n17Root}/DESIGN-SELECTION-RESULT.json`;
const n17Manifest = readJson(n17ManifestPath);
assert("N17 manifest bytes", digestFile(n17ManifestPath) === "d265d72bc3669809085b0e11dd1daeba7c3e9cb7c1b042172c64669d6702d7ec", "N17 manifest changed");
assert("N17 manifest input digest", digestValue(without(n17Manifest, "input_digest")) === n17Manifest.input_digest && n17Manifest.input_digest === "83104623ea7951e0e4b9b27ea750c50e45afc3bdf1674bae57ca6f37c3423556", "N17 canonical digest mismatch");
assert("N17 manifest closed", n17Manifest.unknowns.length === 0 && n17Manifest.authored_by !== "invoke-design-scope-extractor", "N17 manifest is not closed and independent");
const n17Sources = new Map(n17Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N17 exact denominator count", n17Sources.size === 9, `expected 9, got ${n17Sources.size}`);
for (const [relative, expected] of n17Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N17 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n17Context = readText(`${n17Root}/DESIGN-CONTEXT.md`);
assert("N17 frontier derivation", n17Context.includes("N07 exact A permits") && n17Context.includes("N14 through N16") && n17Context.includes("distinct endpoints") && n17Context.includes("not registry\nprecedence"), "N17 mixed-path frontier or trace boundary unexplained");
const n17Denominator = readJson(n17DenominatorPath);
assert("N17 denominator bytes", digestFile(n17DenominatorPath) === "5f8c5cf56636cbf6f172bb89363ed5d032db68a67f49a51e595f2634757a6754", "N17 denominator changed");
assert("N17 denominator verdict", n17Denominator.verdict === "pass" && n17Denominator.receipt_digest === "11746cabd7670f7d75798cb48c721d70d28db288d4626cb6acbeb067b0f2e279" && n17Denominator.inspected_selectors.length === 9 && n17Denominator.unbound_signal_ids.length === 0 && n17Denominator.missing_detector_inputs.length === 0, "N17 denominator incomplete");
const n17Selection = readJson(n17SelectionPath);
assert("N17 selection bytes", digestFile(n17SelectionPath) === "c943da0e9db1dc1465d1eeec6e3600a260f8ed0fdb3cf0272cd8f31336e289fc", "N17 selection changed");
assert("N17 selection fixed point", n17Selection.verdict === "pass" && n17Selection.evidence_state === "design-validator-pass" && n17Selection.fixed_point === true && n17Selection.pass_1_digest === n17Selection.pass_2_digest && n17Selection.pass_1_digest === "2b5e51bdccbc8958e4ac17b5479b5054573b46aa4b81e49a5c2861ca3c7fe1fb" && n17Selection.result_digest === "1e3021b8c1bbd1765b75adf541ce390413896970aba591f93017995d620bce68", "N17 selection fixed point mismatch");
const n17RequestPath = `${n17Root}/decisions/BMC-REL-NONNUMERIC-17-OPTION-ADMISSIBILITY-REQUEST.json`;
const n17ReceiptPath = `${n17Root}/decisions/BMC-REL-NONNUMERIC-17-OPTION-PREFILTER-RECEIPT.json`;
const n17Request = readJson(n17RequestPath);
const n17Receipt = readJson(n17ReceiptPath);
assert("N17 request bytes", digestFile(n17RequestPath) === "38be5ea90b0c1cb79d2d83dcb7491c0be4acb72835cc051852a56f76bde31d07", "N17 request changed");
assert("N17 receipt bytes", digestFile(n17ReceiptPath) === "f60c201122ac363a2782815362c85e94ef8e6f90c95dcd75f94c1e797398c858", "N17 receipt changed");
assert("N17 requestDigest", digestValue(n17Request) === n17Receipt.requestDigest && n17Receipt.requestDigest === "31dc01762e236fee367779ae656d6f4eb446c05ee43cc0df3e53312d4a3a4aee", "N17 prefilter binding mismatch");
const expectedN17Presented = ["BMC-REL-NONNUMERIC-17-A-DIRECT-FACTS-ONLY-FOR-MIXED-DIMENSION-PATHS", "BMC-REL-NONNUMERIC-17-B-DERIVE-DIMENSION-TRACE-PRESERVING-MIXED-PATH-REACHABILITY", "BMC-REL-NONNUMERIC-17-C-DEFER", "BMC-REL-NONNUMERIC-17-D-STOP"];
assert("N17 gate route and presented options", n17Receipt.routeOutcome === "gate" && n17Receipt.decisionGateRequired === true && n17Receipt.directOptionId === null && JSON.stringify(n17Receipt.presentedOptionIds) === JSON.stringify(expectedN17Presented), "N17 gate route mismatch");
const n17Actions = n17Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N17 action gates", n17Actions.length === 2 && n17Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N17 A/B owner gates invalid");
assert("N17 rejected forms", JSON.stringify(n17Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-17-W-DERIVE-DIMENSION-FREE-MIXED-RESPONSIBILITY", "BMC-REL-NONNUMERIC-17-X-INCLUDE-CLOSED-PATH-SELF-REACHABILITY", "BMC-REL-NONNUMERIC-17-Y-AUTHOR-DERIVED-CANONICAL-OWNS-EDGES", "BMC-REL-NONNUMERIC-17-Z-REOPEN-SAME-DIMENSION-OR-SELECT-REPRESENTATION-RUNTIME-NUMERIC"]), "N17 inadmissible forms not rejected");
const n17Architecture = readText(`${n17Root}/ARCHITECTURE-BUNDLE.md`);
assert("N17 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n17Architecture.includes(heading)), "N17 six-view bundle incomplete");
assert("N17 architecture null selection", n17Architecture.includes("Selection: `null`") && n17Architecture.includes("`authority_effect: none`") && n17Architecture.includes("Recommendation: A") && n17Architecture.includes("DimensionTraceGuard") && n17Architecture.includes("distinct endpoints"), "N17 architecture implies a choice or lacks boundary");
const n17Examples = readText(`${n17Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N17 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n17Examples.includes(heading)) && n17Examples.includes("`decision_effect: none`") && n17Examples.includes("hypothetical"), "N17 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N17 example coverage ${label}`, n17Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N17 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n17Context.includes(technique)), "N17 dispatch trace incomplete");
assert("N17 Distill pass", readText(`${n17Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N17 Distill did not pass");
const n17Handoff = readJson(`${n17Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N17 strict handoff", n17Handoff.status === "blocked-at-owner-decision" && n17Handoff.execution_allowed === false && n17Handoff.selected_option === null && n17Handoff.path_scope.includes("distinct endpoints") && n17Handoff.authority_effect === "none", "N17 handoff widened authority");

const n17OwnerSelectionPath = `${n17Root}/decisions/BMC-REL-NONNUMERIC-17-OWNER-SELECTION-RECEIPT.json`;
const n17OwnerSelection = readJson(n17OwnerSelectionPath);
assert("N17 immutable owner selection", digestFile(n17OwnerSelectionPath) === "0cb9f90529d691f29b57fc29dc66de8642fe96c87e65d21204c0db2a550b016a", "N17 owner selection receipt changed");
assert("N17 exact A selection", n17OwnerSelection.selection.response === "A" && n17OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-17-A-DIRECT-FACTS-ONLY-FOR-MIXED-DIMENSION-PATHS" && n17OwnerSelection.selection.selected_by === "user", "N17 selection is not exact A/user");
assert("N17 recording timestamp semantics", n17OwnerSelection.selection.exact_response_timestamp_exposed === false && n17OwnerSelection.selection.selection_recorded_at === "2026-08-24T13:47:54+01:00" && n17OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N17 timestamp overstated");
assert("N17 admissibility binding", n17OwnerSelection.admissibility_binding.request_sha256 === digestFile(n17RequestPath) && n17OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n17ReceiptPath) && n17OwnerSelection.admissibility_binding.requestDigest === n17Receipt.requestDigest && n17OwnerSelection.admissibility_binding.hazard_class === "authority" && n17OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N17 gate binding mismatch");
assert("N17 narrow direct-only effect", n17OwnerSelection.selection_effect.candidate_design_policy.includes("distinct endpoints") && n17OwnerSelection.selection_effect.candidate_design_policy.includes("no endpoint-to-endpoint mixed-path reachability") && n17OwnerSelection.scope_binding.endpoint_relation === "distinct" && n17OwnerSelection.scope_binding.derived_endpoint_reachability === false && n17OwnerSelection.authorization_boundary.n18_or_later_owner_choice_made === false && n17OwnerSelection.authorization_boundary.mixed_closed_path_self_reachability_selected === false, "N17 selection scope widened");

const n18ManifestPath = `${n18Root}/DESIGN-SCOPE-MANIFEST.json`;
const n18DenominatorPath = `${n18Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n18SelectionPath = `${n18Root}/DESIGN-SELECTION-RESULT.json`;
const n18Manifest = readJson(n18ManifestPath);
assert("N18 manifest bytes", digestFile(n18ManifestPath) === "297482ea74592cfe4074c84e59d7278c3dd1e21c5389e3a9d32c09a38e06b446", "N18 manifest changed");
assert("N18 manifest input digest", digestValue(without(n18Manifest, "input_digest")) === n18Manifest.input_digest && n18Manifest.input_digest === "a055686d2cb64d7dddedf03a2d852612aac179bbb68b5322b90cf2ab62017046", "N18 canonical digest mismatch");
assert("N18 manifest closed", n18Manifest.unknowns.length === 0 && n18Manifest.authored_by !== "invoke-design-scope-extractor", "N18 manifest is not closed and independent");
const n18Sources = new Map(n18Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N18 exact denominator count", n18Sources.size === 8, `expected 8, got ${n18Sources.size}`);
for (const [relative, expected] of n18Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N18 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n18Context = readText(`${n18Root}/DESIGN-CONTEXT.md`);
assert("N18 frontier derivation", n18Context.includes("N07 exact A permits") && n18Context.includes("N04 exact A") && n18Context.includes("N17 exact A") && n18Context.includes("equal endpoints"), "N18 mixed closed-path frontier unexplained");
const n18Denominator = readJson(n18DenominatorPath);
assert("N18 denominator bytes", digestFile(n18DenominatorPath) === "521dd99322f4487aa612333fcfd71836978bed79f4e9a110fa1c3a48dc57da10", "N18 denominator changed");
assert("N18 denominator verdict", n18Denominator.verdict === "pass" && n18Denominator.receipt_digest === "e67c982fd630d1fc7ebb171a6b202b727c764280b4f21f9f41a5d786c7694c04" && n18Denominator.inspected_selectors.length === 8 && n18Denominator.unbound_signal_ids.length === 0 && n18Denominator.missing_detector_inputs.length === 0, "N18 denominator incomplete");
const n18Selection = readJson(n18SelectionPath);
assert("N18 selection bytes", digestFile(n18SelectionPath) === "e7fa6b8fde51088b5764e23dba0aaa3dc9dc87b25e864bcafd012f096f19ed16", "N18 selection changed");
assert("N18 selection fixed point", n18Selection.verdict === "pass" && n18Selection.evidence_state === "design-validator-pass" && n18Selection.fixed_point === true && n18Selection.pass_1_digest === n18Selection.pass_2_digest && n18Selection.pass_1_digest === "8055ced5658f5e9df9e2ec90eccc83469af826edcaf6087db76c8a90f12d84ff" && n18Selection.result_digest === "dce5abf2278207318d00ee0526fbfc0f02d06852f611921fe12188fa0cc3031b", "N18 selection fixed point mismatch");
const n18RequestPath = `${n18Root}/decisions/BMC-REL-NONNUMERIC-18-OPTION-ADMISSIBILITY-REQUEST.json`;
const n18ReceiptPath = `${n18Root}/decisions/BMC-REL-NONNUMERIC-18-OPTION-PREFILTER-RECEIPT.json`;
const n18Request = readJson(n18RequestPath);
const n18Receipt = readJson(n18ReceiptPath);
assert("N18 request bytes", digestFile(n18RequestPath) === "cf5ce5dec81db2750ace37b9ebaa12ed8d7373ecbedc64ab8200de1d62c18842", "N18 request changed");
assert("N18 receipt bytes", digestFile(n18ReceiptPath) === "8825279b312a12d805f93d4e1a28a31179e70a27d2820b43c80b5eab10266afc", "N18 receipt changed");
assert("N18 requestDigest", digestValue(n18Request) === n18Receipt.requestDigest && n18Receipt.requestDigest === "79f71576807df2777ae3e89c0bd7a3f1802f9103eacc50aff37b5eb9e1c0141a", "N18 prefilter binding mismatch");
const expectedN18Presented = ["BMC-REL-NONNUMERIC-18-A-NO-DERIVED-SELF-REACHABILITY-FROM-MIXED-CLOSED-PATHS", "BMC-REL-NONNUMERIC-18-B-DERIVE-TRACE-PRESERVING-SELF-REACHABILITY-FROM-MIXED-CLOSED-PATHS", "BMC-REL-NONNUMERIC-18-C-DEFER", "BMC-REL-NONNUMERIC-18-D-STOP"];
assert("N18 gate route and presented options", n18Receipt.routeOutcome === "gate" && n18Receipt.decisionGateRequired === true && n18Receipt.directOptionId === null && JSON.stringify(n18Receipt.presentedOptionIds) === JSON.stringify(expectedN18Presented), "N18 gate route mismatch");
const n18Actions = n18Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N18 action gates", n18Actions.length === 2 && n18Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N18 A/B owner gates invalid");
assert("N18 rejected forms", JSON.stringify(n18Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-18-W-AUTHOR-DIMENSION-FREE-OR-CANONICAL-SELF-OWNERSHIP", "BMC-REL-NONNUMERIC-18-X-REOPEN-N04-N06-N07-OR-N17-TOPOLOGY-AND-PATH-POLICY", "BMC-REL-NONNUMERIC-18-Y-SELECT-NAMING-PROVENANCE-MATERIALIZATION-REPRESENTATION-COMPLETENESS-OR-STORAGE", "BMC-REL-NONNUMERIC-18-Z-INCLUDE-MANDATORY-OWNERSHIP-RUNTIME-NUMERIC-OR-OTHER-RELATIONS"]), "N18 inadmissible forms not rejected");
const n18Architecture = readText(`${n18Root}/ARCHITECTURE-BUNDLE.md`);
assert("N18 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n18Architecture.includes(heading)), "N18 six-view bundle incomplete");
assert("N18 architecture null selection", n18Architecture.includes("Selection: `null`") && n18Architecture.includes("`authority_effect: none`") && n18Architecture.includes("Recommendation: A") && n18Architecture.includes("DimensionTraceGuard") && n18Architecture.includes("equal endpoints") && n18Architecture.includes("canonical self-ownership"), "N18 architecture implies a choice or lacks boundary");
const n18Examples = readText(`${n18Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N18 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n18Examples.includes(heading)) && n18Examples.includes("`decision_effect: none`") && n18Examples.includes("hypothetical"), "N18 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N18 example coverage ${label}`, n18Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N18 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n18Context.includes(technique)), "N18 dispatch trace incomplete");
assert("N18 Distill pass", readText(`${n18Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N18 Distill did not pass");
const n18Handoff = readJson(`${n18Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N18 strict handoff", n18Handoff.status === "blocked-at-owner-decision" && n18Handoff.execution_allowed === false && n18Handoff.selected_option === null && n18Handoff.path_scope.includes("equal endpoints") && n18Handoff.authority_effect === "none", "N18 handoff widened authority");

const n18OwnerSelectionPath = `${n18Root}/decisions/BMC-REL-NONNUMERIC-18-OWNER-SELECTION-RECEIPT.json`;
const n18OwnerSelection = readJson(n18OwnerSelectionPath);
assert("N18 immutable owner selection", digestFile(n18OwnerSelectionPath) === "a6c7bc5a34a9dd71bba58353bf7875159992d33ff9a58aa325df47806f45edfe", "N18 owner selection receipt changed");
assert("N18 exact A selection", n18OwnerSelection.selection.response === "A" && n18OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-18-A-NO-DERIVED-SELF-REACHABILITY-FROM-MIXED-CLOSED-PATHS" && n18OwnerSelection.selection.selected_by === "user", "N18 selection is not exact A/user");
assert("N18 recording timestamp semantics", n18OwnerSelection.selection.exact_response_timestamp_exposed === false && n18OwnerSelection.selection.selection_recorded_at === "2026-08-24T14:22:20+01:00" && n18OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N18 timestamp overstated");
assert("N18 admissibility binding", n18OwnerSelection.admissibility_binding.request_sha256 === digestFile(n18RequestPath) && n18OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n18ReceiptPath) && n18OwnerSelection.admissibility_binding.requestDigest === n18Receipt.requestDigest && n18OwnerSelection.admissibility_binding.hazard_class === "authority" && n18OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N18 gate binding mismatch");
assert("N18 narrow no-derived effect", n18OwnerSelection.selection_effect.candidate_design_policy.includes("derive no self-reachability consequence") && n18OwnerSelection.scope_binding.endpoint_relation === "equal" && n18OwnerSelection.scope_binding.derived_self_reachability === false && n18OwnerSelection.authorization_boundary.n19_or_later_owner_choice_made === false && n18OwnerSelection.authorization_boundary.belongs_to_policy_selected === false, "N18 selection scope widened");

const n19ManifestPath = `${n19Root}/DESIGN-SCOPE-MANIFEST.json`;
const n19DenominatorPath = `${n19Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n19SelectionPath = `${n19Root}/DESIGN-SELECTION-RESULT.json`;
const n19Manifest = readJson(n19ManifestPath);
assert("N19 manifest bytes", digestFile(n19ManifestPath) === "35051f1f4e26341187b3f39ec12ab3c8a771a2d8a08d754cb4d6339fa6b79584", "N19 manifest changed");
assert("N19 manifest input digest", digestValue(without(n19Manifest, "input_digest")) === n19Manifest.input_digest && n19Manifest.input_digest === "6157fff83d07b66197518e3168148b88c4b55e20b670681668314ac88d70a6c9", "N19 canonical digest mismatch");
assert("N19 manifest closed", n19Manifest.unknowns.length === 0 && n19Manifest.authored_by !== "invoke-design-scope-extractor", "N19 manifest is not closed and independent");
const n19Sources = new Map(n19Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N19 exact denominator count", n19Sources.size === 7, `expected 7, got ${n19Sources.size}`);
for (const [relative, expected] of n19Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N19 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n19Context = readText(`${n19Root}/DESIGN-CONTEXT.md`);
assert("N19 frontier derivation", n19Context.includes("N18 A") && n19Context.includes("D07 `belongs-to`") && n19Context.includes("D30") && n19Context.includes("governance shape"), "N19 belongs-to self-edge governance frontier unexplained");
const n19Denominator = readJson(n19DenominatorPath);
assert("N19 denominator bytes", digestFile(n19DenominatorPath) === "f263b5b5a33ed19c9d319db113ff9444c708aec2985659c69cde234faee8a474", "N19 denominator changed");
assert("N19 denominator verdict", n19Denominator.verdict === "pass" && n19Denominator.receipt_digest === "743c6a1ae87af6fa3b818c9fc30cb1f7b39eaa7189313d24bdb394467131eba4" && n19Denominator.inspected_selectors.length === 7 && n19Denominator.unbound_signal_ids.length === 0 && n19Denominator.missing_detector_inputs.length === 0, "N19 denominator incomplete");
const n19Selection = readJson(n19SelectionPath);
assert("N19 selection bytes", digestFile(n19SelectionPath) === "8b26cd0abcdb493a21091960fc705ed8ad285c97af815c31c831a182ca268d82", "N19 selection changed");
assert("N19 selection fixed point", n19Selection.verdict === "pass" && n19Selection.evidence_state === "design-validator-pass" && n19Selection.fixed_point === true && n19Selection.pass_1_digest === n19Selection.pass_2_digest && n19Selection.pass_1_digest === "7b8d591b95e123436aeaf989abb97f872218bce53be97633a60c1988778c9a72" && n19Selection.result_digest === "cccb3eda7d70d25210de13c7a8329d666c1bac6f25ae3efe8b0cbff04e4a87ea", "N19 selection fixed point mismatch");
const n19RequestPath = `${n19Root}/decisions/BMC-REL-NONNUMERIC-19-OPTION-ADMISSIBILITY-REQUEST.json`;
const n19ReceiptPath = `${n19Root}/decisions/BMC-REL-NONNUMERIC-19-OPTION-PREFILTER-RECEIPT.json`;
const n19Request = readJson(n19RequestPath);
const n19Receipt = readJson(n19ReceiptPath);
assert("N19 request bytes", digestFile(n19RequestPath) === "bf1651075d09d4b1a496a63d7433821e9f991a41f7ad95aadc6cc341d7fa7c79", "N19 request changed");
assert("N19 receipt bytes", digestFile(n19ReceiptPath) === "c2392306a41c76011cad377d35368d074a7a276423d3df34d68a71d94afd5e9a", "N19 receipt changed");
assert("N19 requestDigest", digestValue(n19Request) === n19Receipt.requestDigest && n19Receipt.requestDigest === "2c37c79eba141cd0121a39ffed63afa26bb7b037f0c22c663f893e4174a579f3", "N19 prefilter binding mismatch");
const expectedN19Presented = ["BMC-REL-NONNUMERIC-19-A-UNIFORM-SELF-EDGE-POLICY-ACROSS-MEMBERSHIP-KINDS", "BMC-REL-NONNUMERIC-19-B-KIND-SPECIFIC-SELF-EDGE-POLICY", "BMC-REL-NONNUMERIC-19-C-DEFER", "BMC-REL-NONNUMERIC-19-D-STOP"];
assert("N19 gate route and presented options", n19Receipt.routeOutcome === "gate" && n19Receipt.decisionGateRequired === true && n19Receipt.directOptionId === null && JSON.stringify(n19Receipt.presentedOptionIds) === JSON.stringify(expectedN19Presented), "N19 gate route mismatch");
const n19Actions = n19Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N19 action gates", n19Actions.length === 2 && n19Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N19 A/B owner gates invalid");
assert("N19 rejected forms", JSON.stringify(n19Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-19-W-REJECT-ALL-BELONGS-TO-SELF-EDGES-NOW", "BMC-REL-NONNUMERIC-19-X-ALLOW-ALL-BELONGS-TO-SELF-EDGES-NOW", "BMC-REL-NONNUMERIC-19-Y-INFER-UNIFORMITY-FROM-BELONGS-TO-VERB-OR-MANY-TO-ONE", "BMC-REL-NONNUMERIC-19-Z-INCLUDE-LONGER-CYCLES-DUPLICATES-MANDATORY-REPRESENTATION-RUNTIME-NUMERIC-OR-OWNS"]), "N19 inadmissible forms not rejected");
const n19Architecture = readText(`${n19Root}/ARCHITECTURE-BUNDLE.md`);
assert("N19 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n19Architecture.includes(heading)), "N19 six-view bundle incomplete");
assert("N19 architecture null selection", n19Architecture.includes("Selection: `null`") && n19Architecture.includes("`authority_effect: none`") && n19Architecture.includes("Recommended because D30") && n19Architecture.includes("Neither option rejects, allows, or requires"), "N19 architecture implies a choice or lacks governance boundary");
const n19Examples = readText(`${n19Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N19 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n19Examples.includes(heading)) && n19Examples.includes("`decision_effect: none`") && n19Examples.includes("hypothetical"), "N19 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N19 example coverage ${label}`, n19Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N19 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n19Context.includes(technique)), "N19 dispatch trace incomplete");
assert("N19 Distill pass", readText(`${n19Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N19 Distill did not pass");
const n19Handoff = readJson(`${n19Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N19 strict handoff", n19Handoff.status === "runnable-to-n19-owner-decision" && n19Handoff.selected_source_count === 7 && n19Handoff.blockers.includes("BMC-REL-NONNUMERIC-19-BELONGS-TO-SELF-EDGE-POLICY-GOVERNANCE owner selection") && n19Handoff.authority_effect === "none", "N19 handoff widened authority");

const n19OwnerSelectionPath = `${n19Root}/decisions/BMC-REL-NONNUMERIC-19-OWNER-SELECTION-RECEIPT.json`;
const n19OwnerSelection = readJson(n19OwnerSelectionPath);
assert("N19 immutable owner selection", digestFile(n19OwnerSelectionPath) === "b6b4bd998bb52a6009b248a6a5d271359f3f4fd8a025e3264df820296b50c73b", "N19 owner selection receipt changed");
assert("N19 exact A selection", n19OwnerSelection.selection.response === "A" && n19OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-19-A-UNIFORM-SELF-EDGE-POLICY-ACROSS-MEMBERSHIP-KINDS" && n19OwnerSelection.selection.selected_by === "user", "N19 selection is not exact A/user");
assert("N19 recording timestamp semantics", n19OwnerSelection.selection.exact_response_timestamp_exposed === false && n19OwnerSelection.selection.selection_recorded_at === "2026-08-24T15:05:13+01:00" && n19OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N19 timestamp overstated");
assert("N19 admissibility binding", n19OwnerSelection.admissibility_binding.request_sha256 === digestFile(n19RequestPath) && n19OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n19ReceiptPath) && n19OwnerSelection.admissibility_binding.requestDigest === n19Receipt.requestDigest && n19OwnerSelection.admissibility_binding.hazard_class === "authority" && n19OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N19 gate binding mismatch");
assert("N19 narrow uniform governance effect", n19OwnerSelection.selection_effect.candidate_design_policy.includes("one uniform future direct self-edge behavior policy") && n19OwnerSelection.scope_binding.governance_shape === "uniform-future-behavior" && n19OwnerSelection.scope_binding.behavior_selected === false && n19OwnerSelection.authorization_boundary.n20_or_later_owner_choice_made === false && n19OwnerSelection.authorization_boundary.belongs_to_self_edge_behavior_selected === false, "N19 selection scope widened");

const n20ManifestPath = `${n20Root}/DESIGN-SCOPE-MANIFEST.json`;
const n20DenominatorPath = `${n20Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n20SelectionPath = `${n20Root}/DESIGN-SELECTION-RESULT.json`;
const n20Manifest = readJson(n20ManifestPath);
assert("N20 manifest bytes", digestFile(n20ManifestPath) === "065ec761ec76c391344513c90ad1807fb4b752cfbb59f6b65d99ec50f49467e1", "N20 manifest changed");
assert("N20 manifest input digest", digestValue(without(n20Manifest, "input_digest")) === n20Manifest.input_digest && n20Manifest.input_digest === "443af807ec79e37fb73da77c9840b1ab1d00334a8b17d1982420719a680e736d", "N20 canonical digest mismatch");
assert("N20 manifest closed", n20Manifest.unknowns.length === 0 && n20Manifest.authored_by !== "invoke-design-scope-extractor", "N20 manifest is not closed and independent");
const n20Sources = new Map(n20Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N20 exact denominator count", n20Sources.size === 6, `expected 6, got ${n20Sources.size}`);
for (const [relative, expected] of n20Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N20 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n20Context = readText(`${n20Root}/DESIGN-CONTEXT.md`);
assert("N20 frontier derivation", n20Context.includes("N19 A") && n20Context.includes("another entity") && n20Context.includes("D30") && n20Context.includes("Both reject and allow"), "N20 behavior frontier unexplained");
const n20Denominator = readJson(n20DenominatorPath);
assert("N20 denominator bytes", digestFile(n20DenominatorPath) === "319642b2e541cce9ef8e41602267c500fdb9eb4487887f48f64b7352c066756b", "N20 denominator changed");
assert("N20 denominator verdict", n20Denominator.verdict === "pass" && n20Denominator.receipt_digest === "56722a5d636be968c60491ad63b152fe0ced4a812d0236e4b7c63afc6d944a21" && n20Denominator.inspected_selectors.length === 6 && n20Denominator.unbound_signal_ids.length === 0 && n20Denominator.missing_detector_inputs.length === 0, "N20 denominator incomplete");
const n20Selection = readJson(n20SelectionPath);
assert("N20 selection bytes", digestFile(n20SelectionPath) === "cc423dccb847c4fcca203b634beeea5fc07112aae192e6e96625ad141c22c542", "N20 selection changed");
assert("N20 selection fixed point", n20Selection.verdict === "pass" && n20Selection.evidence_state === "design-validator-pass" && n20Selection.fixed_point === true && n20Selection.pass_1_digest === n20Selection.pass_2_digest && n20Selection.pass_1_digest === "d581b9a70939b17750bfb5231b0f3750a403be71762d511b274023936bc4c826" && n20Selection.result_digest === "78953a15d5b5db05ef88a4be4c1cd28d8405fb3fe1b44aca1f16362c1eb783e0", "N20 selection fixed point mismatch");
const n20RequestPath = `${n20Root}/decisions/BMC-REL-NONNUMERIC-20-OPTION-ADMISSIBILITY-REQUEST.json`;
const n20ReceiptPath = `${n20Root}/decisions/BMC-REL-NONNUMERIC-20-OPTION-PREFILTER-RECEIPT.json`;
const n20Request = readJson(n20RequestPath);
const n20Receipt = readJson(n20ReceiptPath);
assert("N20 request bytes", digestFile(n20RequestPath) === "825e2cb84db34871aa5aef62e63dda703802aa785aaddf36bed9e28665667baf", "N20 request changed");
assert("N20 receipt bytes", digestFile(n20ReceiptPath) === "2ee58a0092a83dec0dfc9f3f5c100614ceab01a332727fe1d2ad9906cea16682", "N20 receipt changed");
assert("N20 requestDigest", digestValue(n20Request) === n20Receipt.requestDigest && n20Receipt.requestDigest === "ba09c6ff867594cc15830636ac7b614f0d8089c5990c58f720bb50c937218f5c", "N20 prefilter binding mismatch");
const expectedN20Presented = ["BMC-REL-NONNUMERIC-20-A-REJECT-UNIFORM-BELONGS-TO-SELF-EDGES", "BMC-REL-NONNUMERIC-20-B-ALLOW-UNIFORM-BELONGS-TO-SELF-EDGES", "BMC-REL-NONNUMERIC-20-C-DEFER", "BMC-REL-NONNUMERIC-20-D-STOP"];
assert("N20 gate route and presented options", n20Receipt.routeOutcome === "gate" && n20Receipt.decisionGateRequired === true && n20Receipt.directOptionId === null && JSON.stringify(n20Receipt.presentedOptionIds) === JSON.stringify(expectedN20Presented), "N20 gate route mismatch");
const n20Actions = n20Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N20 action gates", n20Actions.length === 2 && n20Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N20 A/B owner gates invalid");
assert("N20 rejected forms", JSON.stringify(n20Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-20-W-KIND-SPECIFIC-SELF-EDGE-BEHAVIOR", "BMC-REL-NONNUMERIC-20-X-REQUIRE-SELF-EDGE-OR-REPLACEMENT-PARENT", "BMC-REL-NONNUMERIC-20-Y-INFER-BEHAVIOR-FROM-MANY-TO-ONE-OR-ENDPOINT-TYPE", "BMC-REL-NONNUMERIC-20-Z-INCLUDE-LONGER-CYCLES-DUPLICATES-CLOSURE-REPRESENTATION-RUNTIME-NUMERIC-OR-OTHER-RELATIONS"]), "N20 inadmissible forms not rejected");
const n20Architecture = readText(`${n20Root}/ARCHITECTURE-BUNDLE.md`);
assert("N20 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n20Architecture.includes(heading)), "N20 six-view bundle incomplete");
assert("N20 architecture null selection", n20Architecture.includes("Selection: `null`") && n20Architecture.includes("`authority_effect: none`") && n20Architecture.includes("Recommended because") && n20Architecture.includes("another entity") && n20Architecture.includes("valid but optional"), "N20 architecture implies a choice or lacks behavior boundary");
const n20Examples = readText(`${n20Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N20 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n20Examples.includes(heading)) && n20Examples.includes("`decision_effect: none`") && n20Examples.includes("hypothetical"), "N20 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N20 example coverage ${label}`, n20Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N20 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n20Context.includes(technique)), "N20 dispatch trace incomplete");
assert("N20 Distill pass", readText(`${n20Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N20 Distill did not pass");
const n20Handoff = readJson(`${n20Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N20 strict handoff", n20Handoff.status === "runnable-to-n20-owner-decision" && n20Handoff.selected_source_count === 6 && n20Handoff.blockers.includes("BMC-REL-NONNUMERIC-20-BELONGS-TO-UNIFORM-SELF-EDGE-BEHAVIOR owner selection") && n20Handoff.authority_effect === "none", "N20 handoff widened authority");

const n20OwnerSelectionPath = `${n20Root}/decisions/BMC-REL-NONNUMERIC-20-OWNER-SELECTION-RECEIPT.json`;
const n20OwnerSelection = readJson(n20OwnerSelectionPath);
assert("N20 immutable owner selection", digestFile(n20OwnerSelectionPath) === "41758e2a5f0c2e1f6bee2177b63a39a333d9e5105a18df85d6da6f9270a4246d", "N20 owner selection receipt changed");
assert("N20 exact A selection", n20OwnerSelection.selection.response === "A" && n20OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-20-A-REJECT-UNIFORM-BELONGS-TO-SELF-EDGES" && n20OwnerSelection.selection.selected_by === "user", "N20 selection is not exact A/user");
assert("N20 recording timestamp semantics", n20OwnerSelection.selection.exact_response_timestamp_exposed === false && n20OwnerSelection.selection.selection_recorded_at === "2026-08-24T16:13:30+01:00" && n20OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N20 timestamp overstated");
assert("N20 admissibility binding", n20OwnerSelection.admissibility_binding.request_sha256 === digestFile(n20RequestPath) && n20OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n20ReceiptPath) && n20OwnerSelection.admissibility_binding.requestDigest === n20Receipt.requestDigest && n20OwnerSelection.admissibility_binding.hazard_class === "authority" && n20OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N20 gate binding mismatch");
assert("N20 narrow self-edge rejection", n20OwnerSelection.selection_effect.candidate_design_policy.includes("Reject every direct canonical belongs-to_k(e,e) self-edge uniformly") && n20OwnerSelection.scope_binding.repair_requirement === "remove-invalid-self-edge" && n20OwnerSelection.scope_binding.replacement_parent_required === false && n20OwnerSelection.scope_binding.membership_optional === true && n20OwnerSelection.authorization_boundary.longer_cycle_governance_selected === false && n20OwnerSelection.authorization_boundary.longer_cycle_behavior_selected === false, "N20 selection scope widened");

const n21ManifestPath = `${n21Root}/DESIGN-SCOPE-MANIFEST.json`;
const n21DenominatorPath = `${n21Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n21SelectionPath = `${n21Root}/DESIGN-SELECTION-RESULT.json`;
const n21Manifest = readJson(n21ManifestPath);
assert("N21 manifest bytes", digestFile(n21ManifestPath) === "91e9858fdbc0016444e878bc214c68e335cff7ed0d2585d7bfcabf1fecd93e41", "N21 manifest changed");
assert("N21 manifest input digest", digestValue(without(n21Manifest, "input_digest")) === n21Manifest.input_digest && n21Manifest.input_digest === "51fd764fce539856576670d5d338f094689f63b05a6d3715acf214340a587072", "N21 canonical digest mismatch");
assert("N21 manifest closed", n21Manifest.unknowns.length === 0 && n21Manifest.authored_by !== "invoke-design-scope-extractor", "N21 manifest is not closed and independent");
const n21Sources = new Map(n21Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N21 exact denominator count", n21Sources.size === 6, `expected 6, got ${n21Sources.size}`);
for (const [relative, expected] of n21Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N21 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n21Context = readText(`${n21Root}/DESIGN-CONTEXT.md`);
assert("N21 frontier derivation", n21Context.includes("N20 A") && n21Context.includes("two or more distinct") && n21Context.includes("D30") && n21Context.includes("No source chooses"), "N21 governance frontier unexplained");
const n21Denominator = readJson(n21DenominatorPath);
assert("N21 denominator bytes", digestFile(n21DenominatorPath) === "b8d04d3399e8ce850f18282b077658537791754ef2d341a2d24519ed7c3c88b1", "N21 denominator changed");
assert("N21 denominator verdict", n21Denominator.verdict === "pass" && n21Denominator.receipt_digest === "e499c81c88f22e84ae0fe7e2e0ba781ef644749a35d075362ecd39bf7429ceef" && n21Denominator.inspected_selectors.length === 6 && n21Denominator.unbound_signal_ids.length === 0 && n21Denominator.missing_detector_inputs.length === 0, "N21 denominator incomplete");
const n21Selection = readJson(n21SelectionPath);
assert("N21 selection bytes", digestFile(n21SelectionPath) === "a9e3b9f33fe794485e5cd1a07c5958a8d072e2387102791d1ec7c738cf5d239f", "N21 selection changed");
assert("N21 selection fixed point", n21Selection.verdict === "pass" && n21Selection.evidence_state === "design-validator-pass" && n21Selection.fixed_point === true && n21Selection.pass_1_digest === n21Selection.pass_2_digest && n21Selection.pass_1_digest === "c1b63a60864857ca33b1995417492f3b8a66c2fba34f3983143931ff8bd7f08f" && n21Selection.result_digest === "968f7897c2248e35bce5571b971fc6ce205100bbf9194c33264d58b252189695", "N21 selection fixed point mismatch");
const n21RequestPath = `${n21Root}/decisions/BMC-REL-NONNUMERIC-21-OPTION-ADMISSIBILITY-REQUEST.json`;
const n21ReceiptPath = `${n21Root}/decisions/BMC-REL-NONNUMERIC-21-OPTION-PREFILTER-RECEIPT.json`;
const n21Request = readJson(n21RequestPath);
const n21Receipt = readJson(n21ReceiptPath);
assert("N21 request bytes", digestFile(n21RequestPath) === "ee43d788879343e80602feb3d751d3561cca1a0362b87980d9a262cd6db937c7", "N21 request changed");
assert("N21 receipt bytes", digestFile(n21ReceiptPath) === "833b60a39f23917a4e1760aebaa56ed72dae448cec510dc34b0d328c399778be", "N21 receipt changed");
assert("N21 requestDigest", digestValue(n21Request) === n21Receipt.requestDigest && n21Receipt.requestDigest === "fb26d848eee88f9f1c28b0fd540a1e7dc795ba0faf53f0c9e6ef0b94e5b1fb05", "N21 prefilter binding mismatch");
const expectedN21Presented = ["BMC-REL-NONNUMERIC-21-A-UNIFORM-LONGER-CYCLE-POLICY-ACROSS-MEMBERSHIP-KINDS", "BMC-REL-NONNUMERIC-21-B-KIND-SPECIFIC-LONGER-CYCLE-POLICY", "BMC-REL-NONNUMERIC-21-C-DEFER", "BMC-REL-NONNUMERIC-21-D-STOP"];
assert("N21 gate route and presented options", n21Receipt.routeOutcome === "gate" && n21Receipt.decisionGateRequired === true && n21Receipt.directOptionId === null && JSON.stringify(n21Receipt.presentedOptionIds) === JSON.stringify(expectedN21Presented), "N21 gate route mismatch");
const n21Actions = n21Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N21 action gates", n21Actions.length === 2 && n21Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N21 A/B owner gates invalid");
assert("N21 rejected forms", JSON.stringify(n21Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-21-W-SELECT-REJECT-OR-ALLOW-NOW", "BMC-REL-NONNUMERIC-21-X-CARRY-N19-OR-N20-FORWARD", "BMC-REL-NONNUMERIC-21-Y-INFER-FROM-MANY-TO-ONE-OR-KIND-TOKEN", "BMC-REL-NONNUMERIC-21-Z-BUNDLE-MIXED-KIND-PATHS-CLOSURE-DUPLICATES-REPRESENTATION-RUNTIME-NUMERIC-OR-OTHER-RELATIONS"]), "N21 inadmissible forms not rejected");
const n21Architecture = readText(`${n21Root}/ARCHITECTURE-BUNDLE.md`);
assert("N21 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n21Architecture.includes(heading)), "N21 six-view bundle incomplete");
assert("N21 architecture null selection", n21Architecture.includes("Selected option: `null`") && n21Architecture.includes("Decision effect: `none`") && n21Architecture.includes("Recommendation: **A**") && n21Architecture.includes("Neither action says whether any cycle is valid"), "N21 architecture implies a choice or lacks governance boundary");
const n21Examples = readText(`${n21Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N21 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n21Examples.includes(heading)) && n21Examples.includes("Decision effect: `none`") && n21Examples.includes("hypothetical"), "N21 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N21 example coverage ${label}`, n21Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N21 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n21Context.includes(technique)), "N21 dispatch trace incomplete");
assert("N21 Distill pass", readText(`${n21Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N21 Distill did not pass");
const n21Handoff = readJson(`${n21Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N21 strict handoff", n21Handoff.status === "runnable-to-n21-owner-decision" && n21Handoff.selected_source_count === 6 && n21Handoff.blockers.includes("BMC-REL-NONNUMERIC-21-BELONGS-TO-LONGER-CYCLE-POLICY-GOVERNANCE owner selection") && n21Handoff.authority_effect === "none", "N21 handoff widened authority");
const n21OwnerSelectionPath = `${n21Root}/decisions/BMC-REL-NONNUMERIC-21-OWNER-SELECTION-RECEIPT.json`;
const n21OwnerSelection = readJson(n21OwnerSelectionPath);
assert("N21 immutable owner selection", digestFile(n21OwnerSelectionPath) === "a2ca5bc96c5ee31fd07754ddbbefd09173b2e9d52c5a138decd9a82058a8897a", "N21 owner selection receipt changed");
assert("N21 exact A selection", n21OwnerSelection.selection.response === "A" && n21OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-21-A-UNIFORM-LONGER-CYCLE-POLICY-ACROSS-MEMBERSHIP-KINDS" && n21OwnerSelection.selection.selected_by === "user", "N21 selection is not exact A/user");
assert("N21 recording timestamp semantics", n21OwnerSelection.selection.exact_response_timestamp_exposed === false && n21OwnerSelection.selection.selection_recorded_at === "2026-08-24T16:42:53+01:00" && n21OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N21 timestamp overstated");
assert("N21 admissibility binding", n21OwnerSelection.admissibility_binding.request_sha256 === digestFile(n21RequestPath) && n21OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n21ReceiptPath) && n21OwnerSelection.admissibility_binding.requestDigest === n21Receipt.requestDigest && n21OwnerSelection.admissibility_binding.hazard_class === "authority" && n21OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N21 gate binding mismatch");
assert("N21 narrow governance effect", n21OwnerSelection.selection_effect.candidate_design_policy.includes("uniformly across every current and later admitted D30 membership kind") && n21OwnerSelection.scope_binding.behavior_selected === false && n21OwnerSelection.authorization_boundary.longer_cycle_governance_selected === true && n21OwnerSelection.authorization_boundary.longer_cycle_behavior_selected === false, "N21 selection scope widened");

const n22ManifestPath = `${n22Root}/DESIGN-SCOPE-MANIFEST.json`;
const n22DenominatorPath = `${n22Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n22SelectionPath = `${n22Root}/DESIGN-SELECTION-RESULT.json`;
const n22Manifest = readJson(n22ManifestPath);
assert("N22 manifest bytes", digestFile(n22ManifestPath) === "44459653649146d6719dd63af4011af60da669861f9714617431631709d812a0", "N22 manifest changed");
assert("N22 manifest input digest", digestValue(without(n22Manifest, "input_digest")) === n22Manifest.input_digest && n22Manifest.input_digest === "dd463f1e45b112d95389f757f0d4d16604e51f8a9cecac8325d33f94341d4b21", "N22 canonical digest mismatch");
assert("N22 manifest closed", n22Manifest.unknowns.length === 0 && n22Manifest.authored_by !== "invoke-design-scope-extractor", "N22 manifest is not closed and independent");
const n22Sources = new Map(n22Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N22 exact denominator count", n22Sources.size === 6, `expected 6, got ${n22Sources.size}`);
for (const [relative, expected] of n22Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N22 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n22Context = readText(`${n22Root}/DESIGN-CONTEXT.md`);
assert("N22 frontier derivation", n22Context.includes("N21 A") && n22Context.includes("at least two distinct") && n22Context.includes("D30") && n22Context.includes("No source chooses N22"), "N22 behavior frontier unexplained");
const n22Denominator = readJson(n22DenominatorPath);
assert("N22 denominator bytes", digestFile(n22DenominatorPath) === "605ceda547c6d0f83499e143882990f9c55bde0115ede578e46a5971e9ee10ea", "N22 denominator changed");
assert("N22 denominator verdict", n22Denominator.verdict === "pass" && n22Denominator.receipt_digest === "80b997d086c27fe9ca3af417f24af00ed40071192c33b251b2f2de3241cc422c" && n22Denominator.inspected_selectors.length === 6 && n22Denominator.unbound_signal_ids.length === 0 && n22Denominator.missing_detector_inputs.length === 0, "N22 denominator incomplete");
const n22Selection = readJson(n22SelectionPath);
assert("N22 selection bytes", digestFile(n22SelectionPath) === "74da2725c1d1af7096b5db52ff984c2814c6f7a0529c3163f2f04f261f9831eb", "N22 selection changed");
assert("N22 selection fixed point", n22Selection.verdict === "pass" && n22Selection.evidence_state === "design-validator-pass" && n22Selection.fixed_point === true && n22Selection.pass_1_digest === n22Selection.pass_2_digest && n22Selection.pass_1_digest === "c6d129ab0869d3182c88466617f74e81497e411856fea5b3b91297d1b13034c8" && n22Selection.result_digest === "fb22b28aba95efcbe3394124969add518bdc826dd53c1473a67e2ca65571ab63", "N22 selection fixed point mismatch");
const n22RequestPath = `${n22Root}/decisions/BMC-REL-NONNUMERIC-22-OPTION-ADMISSIBILITY-REQUEST.json`;
const n22ReceiptPath = `${n22Root}/decisions/BMC-REL-NONNUMERIC-22-OPTION-PREFILTER-RECEIPT.json`;
const n22Request = readJson(n22RequestPath);
const n22Receipt = readJson(n22ReceiptPath);
assert("N22 request bytes", digestFile(n22RequestPath) === "b089e70139f0005e5df618eee16293c1d7b95d64d7a1f9f387a62f98eca376bf", "N22 request changed");
assert("N22 receipt bytes", digestFile(n22ReceiptPath) === "1cb9f9c6362008be677c0489568e15e1c3ef971e561a7993d9e6a1a824abe4c5", "N22 receipt changed");
assert("N22 requestDigest", digestValue(n22Request) === n22Receipt.requestDigest && n22Receipt.requestDigest === "5226daec977a02d093507aa1448e1e8b1fa0e3638233ab8b9c6812658dd80d21", "N22 prefilter binding mismatch");
const expectedN22Presented = ["BMC-REL-NONNUMERIC-22-A-REJECT-UNIFORM-SAME-KIND-LONGER-CYCLES", "BMC-REL-NONNUMERIC-22-B-ALLOW-UNIFORM-SAME-KIND-LONGER-CYCLES", "BMC-REL-NONNUMERIC-22-C-DEFER", "BMC-REL-NONNUMERIC-22-D-STOP"];
assert("N22 gate route and presented options", n22Receipt.routeOutcome === "gate" && n22Receipt.decisionGateRequired === true && n22Receipt.directOptionId === null && JSON.stringify(n22Receipt.presentedOptionIds) === JSON.stringify(expectedN22Presented), "N22 gate route mismatch");
const n22Actions = n22Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N22 action gates", n22Actions.length === 2 && n22Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N22 A/B owner gates invalid");
assert("N22 rejected forms", JSON.stringify(n22Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-22-W-REOPEN-DIRECT-SELF-EDGES", "BMC-REL-NONNUMERIC-22-X-CONDITIONAL-OR-KIND-TOKEN-EXCEPTIONS", "BMC-REL-NONNUMERIC-22-Y-INCLUDE-MIXED-KIND-CYCLES-OR-DERIVED-REACHABILITY", "BMC-REL-NONNUMERIC-22-Z-BUNDLE-CLOSURE-COMPLETENESS-DUPLICATES-REPRESENTATION-RUNTIME-NUMERIC-OR-OTHER-RELATIONS"]), "N22 inadmissible forms not rejected");
const n22Architecture = readText(`${n22Root}/ARCHITECTURE-BUNDLE.md`);
assert("N22 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n22Architecture.includes(heading)), "N22 six-view bundle incomplete");
assert("N22 architecture null selection", n22Architecture.includes("Selected option: `null`") && n22Architecture.includes("Decision effect: `none`") && n22Architecture.includes("Recommendation: **A**") && n22Architecture.includes("B remains fully admissible"), "N22 architecture implies a choice or lacks behavior boundary");
const n22Examples = readText(`${n22Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N22 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n22Examples.includes(heading)) && n22Examples.includes("Decision effect: `none`") && n22Examples.includes("hypothetical"), "N22 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N22 example coverage ${label}`, n22Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N22 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n22Context.includes(technique)), "N22 dispatch trace incomplete");
assert("N22 Distill pass", readText(`${n22Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N22 Distill did not pass");
const n22Handoff = readJson(`${n22Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N22 strict handoff", n22Handoff.status === "runnable-to-n22-owner-decision" && n22Handoff.selected_source_count === 6 && n22Handoff.blockers.includes("BMC-REL-NONNUMERIC-22-BELONGS-TO-UNIFORM-LONGER-CYCLE-BEHAVIOR owner selection") && n22Handoff.authority_effect === "none", "N22 handoff widened authority");

const n22OwnerSelectionPath = `${n22Root}/decisions/BMC-REL-NONNUMERIC-22-OWNER-SELECTION-RECEIPT.json`;
const n22OwnerSelection = readJson(n22OwnerSelectionPath);
assert("N22 immutable owner selection", digestFile(n22OwnerSelectionPath) === "a4449ea0ac0462d6f4eeb502fc9ef80a448e59c3710f92158fe94a6d345dc351", "N22 owner selection receipt changed");
assert("N22 exact A selection", n22OwnerSelection.selection.response === "A" && n22OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-22-A-REJECT-UNIFORM-SAME-KIND-LONGER-CYCLES" && n22OwnerSelection.selection.selected_by === "user", "N22 selection is not exact A/user");
assert("N22 recording timestamp semantics", n22OwnerSelection.selection.exact_response_timestamp_exposed === false && n22OwnerSelection.selection.selection_recorded_at === "2026-08-24T17:47:55+01:00" && n22OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N22 timestamp overstated");
assert("N22 admissibility binding", n22OwnerSelection.admissibility_binding.request_sha256 === digestFile(n22RequestPath) && n22OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n22ReceiptPath) && n22OwnerSelection.admissibility_binding.requestDigest === n22Receipt.requestDigest && n22OwnerSelection.admissibility_binding.hazard_class === "authority" && n22OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N22 gate binding mismatch");
assert("N22 narrow rejection effect", n22OwnerSelection.selection_effect.candidate_design_policy.includes("Reject every directed same-kind canonical belongs-to closed path") && n22OwnerSelection.scope_binding.path_kind_scope.includes("one exact admitted D30 membership kind") && n22OwnerSelection.scope_binding.path_length === ">=2" && n22OwnerSelection.scope_binding.distinct_entity_count === ">=2" && n22OwnerSelection.authorization_boundary.same_kind_longer_cycles_rejected === true && n22OwnerSelection.authorization_boundary.mixed_kind_closed_path_behavior_selected === false && n22OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N22 selection scope widened");

const n23ManifestPath = `${n23Root}/DESIGN-SCOPE-MANIFEST.json`;
const n23DenominatorPath = `${n23Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n23SelectionPath = `${n23Root}/DESIGN-SELECTION-RESULT.json`;
const n23Manifest = readJson(n23ManifestPath);
assert("N23 manifest bytes", digestFile(n23ManifestPath) === "1a0f916679aac4f656e6f2207b60963be06253a190ef4f2a0c518dd72426baae", "N23 manifest changed");
assert("N23 manifest input digest", digestValue(without(n23Manifest, "input_digest")) === n23Manifest.input_digest && n23Manifest.input_digest === "a3ab2da0bd59f21b7aa689694b813021a7205bbad0dbd7a8bda36678da5c5424", "N23 canonical digest mismatch");
assert("N23 manifest closed", n23Manifest.unknowns.length === 0 && n23Manifest.authored_by !== "invoke-design-scope-extractor", "N23 manifest is not closed and independent");
const n23Sources = new Map(n23Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N23 exact denominator count", n23Sources.size === 8, `expected 8, got ${n23Sources.size}`);
for (const [relative, expected] of n23Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N23 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n23Context = readText(`${n23Root}/DESIGN-CONTEXT.md`);
assert("N23 frontier derivation", n23Context.includes("N22 A") && n23Context.includes("pairwise non-overlapping") && n23Context.includes("different parents") && n23Context.includes("Partial-view/closure evaluation is downstream") && n23Context.includes("No source chooses N23"), "N23 mixed-kind frontier unexplained");
const n23Denominator = readJson(n23DenominatorPath);
assert("N23 denominator bytes", digestFile(n23DenominatorPath) === "c5bdfc09bef6d07ea5d68b708934969f3c5b27f3153e2f516fec563c2f8ddef0", "N23 denominator changed");
assert("N23 denominator verdict", n23Denominator.verdict === "pass" && n23Denominator.receipt_digest === "d0e788bb5f1131db9c8bc15b184ddccbd85ae3098ad64ad8c99222c37fa8069c" && n23Denominator.inspected_selectors.length === 8 && n23Denominator.unbound_signal_ids.length === 0 && n23Denominator.missing_detector_inputs.length === 0, "N23 denominator incomplete");
const n23Selection = readJson(n23SelectionPath);
assert("N23 selection bytes", digestFile(n23SelectionPath) === "b86fd528b7b5c21d3f11381349c23bb8561fde61f09ee781824548cb433b8321", "N23 selection changed");
assert("N23 selection fixed point", n23Selection.verdict === "pass" && n23Selection.evidence_state === "design-validator-pass" && n23Selection.fixed_point === true && n23Selection.pass_1_digest === n23Selection.pass_2_digest && n23Selection.pass_1_digest === "8666755d69b9d3f9492e3e98fb00b3c9631fcd2cdce58d005446c6c53d0bb771" && n23Selection.result_digest === "31aae5e42bb648f1e6e5bb6873a6736ce41977b19aa96d5d3469e7f1cd7b8254", "N23 selection fixed point mismatch");
const n23RequestPath = `${n23Root}/decisions/BMC-REL-NONNUMERIC-23-OPTION-ADMISSIBILITY-REQUEST.json`;
const n23ReceiptPath = `${n23Root}/decisions/BMC-REL-NONNUMERIC-23-OPTION-PREFILTER-RECEIPT.json`;
const n23Request = readJson(n23RequestPath);
const n23Receipt = readJson(n23ReceiptPath);
assert("N23 request bytes", digestFile(n23RequestPath) === "96482b465cf0e8e696a89a71c8dc29600ad3fc3983f53e32a4020b9eba2d70cc", "N23 request changed");
assert("N23 receipt bytes", digestFile(n23ReceiptPath) === "f20edaa712a6dbb466aea7145c4fa2494210f2b71cd9aad2e0e8b3030db41cdb", "N23 receipt changed");
assert("N23 requestDigest", digestValue(n23Request) === n23Receipt.requestDigest && n23Receipt.requestDigest === "6bb6ba6efaccfe861c522e8d00d11473e462932cbfc7f63d5dabde0f0ca024b2", "N23 prefilter binding mismatch");
const expectedN23Presented = ["BMC-REL-NONNUMERIC-23-A-ALLOW-MIXED-KIND-CLOSED-PATHS", "BMC-REL-NONNUMERIC-23-B-REJECT-MIXED-KIND-CLOSED-PATHS-GLOBALLY", "BMC-REL-NONNUMERIC-23-C-DEFER", "BMC-REL-NONNUMERIC-23-D-STOP"];
assert("N23 gate route and presented options", n23Receipt.routeOutcome === "gate" && n23Receipt.decisionGateRequired === true && n23Receipt.directOptionId === null && JSON.stringify(n23Receipt.presentedOptionIds) === JSON.stringify(expectedN23Presented), "N23 gate route mismatch");
const n23Actions = n23Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N23 action gates", n23Actions.length === 2 && n23Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N23 A/B owner gates invalid");
assert("N23 rejected forms", JSON.stringify(n23Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-23-W-REOPEN-SELF-OR-SAME-KIND-CYCLES", "BMC-REL-NONNUMERIC-23-X-PER-KIND-SEQUENCE-EXCEPTIONS", "BMC-REL-NONNUMERIC-23-Y-DERIVE-REACHABILITY-OR-COLLAPSE-KINDS", "BMC-REL-NONNUMERIC-23-Z-BUNDLE-CLOSURE-COMPLETENESS-PARTIAL-VIEW-DUPLICATES-REPRESENTATION-RUNTIME-NUMERIC-OR-OTHER-RELATIONS"]), "N23 inadmissible forms not rejected");
const n23Architecture = readText(`${n23Root}/ARCHITECTURE-BUNDLE.md`);
assert("N23 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n23Architecture.includes(heading)), "N23 six-view bundle incomplete");
assert("N23 architecture null selection", n23Architecture.includes("Selected option: `null`") && n23Architecture.includes("Decision effect: `none`") && n23Architecture.includes("Recommendation: **A**") && n23Architecture.includes("B fully admissible"), "N23 architecture implies a choice or lacks mixed-kind boundary");
const n23Examples = readText(`${n23Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N23 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n23Examples.includes(heading)) && n23Examples.includes("Decision effect: `none`") && n23Examples.includes("hypothetical"), "N23 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N23 example coverage ${label}`, n23Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N23 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n23Context.includes(technique)), "N23 dispatch trace incomplete");
assert("N23 Distill pass", readText(`${n23Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N23 Distill did not pass");
const n23Handoff = readJson(`${n23Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N23 strict handoff", n23Handoff.status === "runnable-to-n23-owner-decision" && n23Handoff.selected_source_count === 8 && n23Handoff.blockers.includes("BMC-REL-NONNUMERIC-23-BELONGS-TO-MIXED-KIND-CLOSED-PATH-BEHAVIOR owner selection") && n23Handoff.authority_effect === "none" && n23Handoff.deterministic_bindings.requestDigest === n23Receipt.requestDigest, "N23 handoff widened authority or lacks bindings");

const n23OwnerSelectionPath = `${n23Root}/decisions/BMC-REL-NONNUMERIC-23-OWNER-SELECTION-RECEIPT.json`;
const n23OwnerSelection = readJson(n23OwnerSelectionPath);
assert("N23 immutable owner selection", digestFile(n23OwnerSelectionPath) === "f77535e98dcc9f7453a55498270732c256220ae5ef7331ec7cf2ad8a91c1c95e", "N23 owner selection receipt changed");
assert("N23 exact A selection", n23OwnerSelection.selection.response === "A" && n23OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-23-A-ALLOW-MIXED-KIND-CLOSED-PATHS" && n23OwnerSelection.selection.selected_by === "user", "N23 selection is not exact A/user");
assert("N23 recording timestamp semantics", n23OwnerSelection.selection.exact_response_timestamp_exposed === false && n23OwnerSelection.selection.selection_recorded_at === "2026-08-24T18:20:38+01:00" && n23OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N23 timestamp overstated");
assert("N23 admissibility binding", n23OwnerSelection.admissibility_binding.request_sha256 === digestFile(n23RequestPath) && n23OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n23ReceiptPath) && n23OwnerSelection.admissibility_binding.requestDigest === n23Receipt.requestDigest && n23OwnerSelection.admissibility_binding.hazard_class === "authority" && n23OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N23 gate binding mismatch");
assert("N23 narrow direct-facts effect", n23OwnerSelection.selection_effect.candidate_design_policy.includes("independent exact kind-bearing direct facts") && n23OwnerSelection.scope_binding.distinct_membership_kind_count === ">=2" && n23OwnerSelection.scope_binding.derived_endpoint_consequence === "none" && n23OwnerSelection.authorization_boundary.mixed_kind_closed_paths_allowed_as_direct_facts === true && n23OwnerSelection.authorization_boundary.kind_collapse_or_derived_reachability_selected === false && n23OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N23 selection scope widened");

const n24ManifestPath = `${n24Root}/DESIGN-SCOPE-MANIFEST.json`;
const n24DenominatorPath = `${n24Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n24SelectionPath = `${n24Root}/DESIGN-SELECTION-RESULT.json`;
const n24Manifest = readJson(n24ManifestPath);
assert("N24 manifest bytes", digestFile(n24ManifestPath) === "3703c4fd9e64f8f678cfaa6f345b2c85d9c788e2ed3a21f7ddbd9a6bd4abe7ac", "N24 manifest changed");
assert("N24 manifest input digest", digestValue(without(n24Manifest, "input_digest")) === n24Manifest.input_digest && n24Manifest.input_digest === "5ecbe7d3a40bc34863160d9424979ff6f2cfda30376e87b714c1bbaba7b04f0a", "N24 canonical digest mismatch");
assert("N24 manifest closed", n24Manifest.unknowns.length === 0 && n24Manifest.authored_by !== "invoke-design-scope-extractor", "N24 manifest is not closed and independent");
const n24Sources = new Map(n24Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N24 exact denominator count", n24Sources.size === 9, `expected 9, got ${n24Sources.size}`);
for (const [relative, expected] of n24Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N24 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n24Context = readText(`${n24Root}/DESIGN-CONTEXT.md`);
assert("N24 frontier derivation", n24Context.includes("D02") && n24Context.includes("partial-view") && n24Context.includes("inverse") && n24Context.includes("different kinds") && n24Context.includes("competing-parent"), "N24 duplicate frontier unexplained");
const n24Denominator = readJson(n24DenominatorPath);
assert("N24 denominator bytes", digestFile(n24DenominatorPath) === "8968f25f153a2e133fc1a2b257e8d802d1caa283ca427eabd46ff0cfa206da02", "N24 denominator changed");
assert("N24 denominator verdict", n24Denominator.verdict === "pass" && n24Denominator.receipt_digest === "3de384d1185495011ccf54368563acede72039219e34ca56249cbdf6d1bf0d78" && n24Denominator.inspected_selectors.length === 9 && n24Denominator.unbound_signal_ids.length === 0 && n24Denominator.missing_detector_inputs.length === 0, "N24 denominator incomplete");
const n24Selection = readJson(n24SelectionPath);
assert("N24 selection bytes", digestFile(n24SelectionPath) === "ae783e0512f56128c3c2a17152ade210a44d4452dc9bcff03196c844cff38836", "N24 selection changed");
assert("N24 selection fixed point", n24Selection.verdict === "pass" && n24Selection.evidence_state === "design-validator-pass" && n24Selection.fixed_point === true && n24Selection.pass_1_digest === n24Selection.pass_2_digest && n24Selection.pass_1_digest === "02246cf1355a8a728cb390d90afd61403a6857625804f0331efacce4e8bf2efd" && n24Selection.result_digest === "cdee833630626de1cec5a0815bb6252474b33335eb18447d62d6ea8df1e04acc", "N24 selection fixed point mismatch");
const n24RequestPath = `${n24Root}/decisions/BMC-REL-NONNUMERIC-24-OPTION-ADMISSIBILITY-REQUEST.json`;
const n24ReceiptPath = `${n24Root}/decisions/BMC-REL-NONNUMERIC-24-OPTION-PREFILTER-RECEIPT.json`;
const n24Request = readJson(n24RequestPath);
const n24Receipt = readJson(n24ReceiptPath);
assert("N24 request bytes", digestFile(n24RequestPath) === "4bf1acb829cf75a89b9c0c59b7410059fb28947c33448fa19bbf47023450990c", "N24 request changed");
assert("N24 receipt bytes", digestFile(n24ReceiptPath) === "2ae07b247b1b9a31eec68912184feb837d42dc71658395a27264cc5cb55bc0ee", "N24 receipt changed");
assert("N24 requestDigest", digestValue(n24Request) === n24Receipt.requestDigest && n24Receipt.requestDigest === "709d3a7f9da1a17d507a791a33c7728f3261cb4a4166d7883b4fc36a8221ead8", "N24 prefilter binding mismatch");
const expectedN24Presented = ["BMC-REL-NONNUMERIC-24-A-REJECT-DUPLICATE-AUTHORED-BELONGS-TO", "BMC-REL-NONNUMERIC-24-B-COALESCE-EXACT-DUPLICATE-AUTHORED-BELONGS-TO", "BMC-REL-NONNUMERIC-24-C-DEFER", "BMC-REL-NONNUMERIC-24-D-STOP"];
assert("N24 gate route and presented options", n24Receipt.routeOutcome === "gate" && n24Receipt.decisionGateRequired === true && n24Receipt.directOptionId === null && JSON.stringify(n24Receipt.presentedOptionIds) === JSON.stringify(expectedN24Presented), "N24 gate route mismatch");
const n24Actions = n24Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N24 action gates", n24Actions.length === 2 && n24Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N24 A/B owner gates invalid");
const n24B = n24Actions.find((candidate) => candidate.optionId.includes("-B-"));
assert("N24 B provenance remains conditional", n24B.evidence.some((item) => item.includes("must close separately before admission or implementation")), "N24 B implies authorized merge provenance");
assert("N24 rejected forms", JSON.stringify(n24Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-24-W-GLOBALIZE-PRIOR-DUPLICATE-POLICIES", "BMC-REL-NONNUMERIC-24-X-SILENT-COALESCE-WITHOUT-PROVENANCE", "BMC-REL-NONNUMERIC-24-Y-TREAT-DIFFERENT-KINDS-OR-PARENTS-AS-DUPLICATES", "BMC-REL-NONNUMERIC-24-Z-BUNDLE-TOPOLOGY-CLOSURE-INVERSE-REPRESENTATION-RUNTIME-NUMERIC-OR-OTHER-RELATIONS"]), "N24 inadmissible forms not rejected");
const n24Architecture = readText(`${n24Root}/ARCHITECTURE-BUNDLE.md`);
assert("N24 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n24Architecture.includes(heading)), "N24 six-view bundle incomplete");
assert("N24 architecture null selection", n24Architecture.includes("Selected option: `null`") && n24Architecture.includes("Decision effect: `none`") && n24Architecture.includes("Recommendation: **A**") && n24Architecture.includes("B remains admissible only"), "N24 architecture implies a choice or lacks duplicate boundary");
const n24Examples = readText(`${n24Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N24 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n24Examples.includes(heading)) && n24Examples.includes("Decision effect: `none`") && n24Examples.includes("hypothetical"), "N24 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N24 example coverage ${label}`, n24Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N24 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n24Context.includes(technique)), "N24 dispatch trace incomplete");
assert("N24 Distill pass", readText(`${n24Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N24 Distill did not pass");
const n24Handoff = readJson(`${n24Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N24 strict handoff", n24Handoff.status === "runnable-to-n24-owner-decision" && n24Handoff.selected_source_count === 9 && n24Handoff.blockers.includes("BMC-REL-NONNUMERIC-24-BELONGS-TO-DUPLICATE-AUTHORSHIP owner selection") && n24Handoff.authority_effect === "none" && n24Handoff.deterministic_bindings.requestDigest === n24Receipt.requestDigest, "N24 handoff widened authority or lacks bindings");

const n24OwnerSelectionPath = `${n24Root}/decisions/BMC-REL-NONNUMERIC-24-OWNER-SELECTION-RECEIPT.json`;
const n24OwnerSelection = readJson(n24OwnerSelectionPath);
assert("N24 immutable owner selection", digestFile(n24OwnerSelectionPath) === "122627151e4422df370506bfd20502c345c5a668425626b1e22c5947c5bdc580", "N24 owner selection receipt changed");
assert("N24 exact A selection", n24OwnerSelection.selection.response === "A" && n24OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-24-A-REJECT-DUPLICATE-AUTHORED-BELONGS-TO" && n24OwnerSelection.selection.selected_by === "user", "N24 selection is not exact A/user");
assert("N24 recording timestamp semantics", n24OwnerSelection.selection.exact_response_timestamp_exposed === false && n24OwnerSelection.selection.selection_recorded_at === "2026-08-24T18:57:30+01:00" && n24OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N24 timestamp overstated");
assert("N24 admissibility binding", n24OwnerSelection.admissibility_binding.request_sha256 === digestFile(n24RequestPath) && n24OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n24ReceiptPath) && n24OwnerSelection.admissibility_binding.requestDigest === n24Receipt.requestDigest && n24OwnerSelection.admissibility_binding.hazard_class === "authority" && n24OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N24 gate binding mismatch");
assert("N24 narrow duplicate rejection", n24OwnerSelection.selection_effect.candidate_design_policy.includes("Reject a repeated authored canonical belongs-to proposition") && n24OwnerSelection.scope_binding.identity_fields.length === 5 && n24OwnerSelection.scope_binding.distinct_source_handles_required === true && n24OwnerSelection.authorization_boundary.exact_duplicate_authorship_rejected === true && n24OwnerSelection.authorization_boundary.different_kinds_classified_as_duplicates === false && n24OwnerSelection.authorization_boundary.competing_parents_collapsed === false && n24OwnerSelection.authorization_boundary.closure_or_partial_view_selected === false && n24OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N24 selection scope widened");

const n25ManifestPath = `${n25Root}/DESIGN-SCOPE-MANIFEST.json`;
const n25DenominatorPath = `${n25Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n25SelectionPath = `${n25Root}/DESIGN-SELECTION-RESULT.json`;
const n25Manifest = readJson(n25ManifestPath);
assert("N25 manifest bytes", digestFile(n25ManifestPath) === "d4e47a72ad030f8aef2a2bbf7a254df522308a2a51d9d9e05aa1394c7c9d6886", "N25 manifest changed");
assert("N25 manifest input digest", digestValue(without(n25Manifest, "input_digest")) === n25Manifest.input_digest && n25Manifest.input_digest === "840ae0b0a1e84126a6c523d566dd8f0e917a086da28b372281bcdb9f3f1cf338", "N25 canonical digest mismatch");
assert("N25 manifest closed", n25Manifest.unknowns.length === 0 && n25Manifest.authored_by !== "invoke-design-scope-extractor", "N25 manifest is not closed and independent");
const n25Sources = new Map(n25Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N25 exact denominator count", n25Sources.size === 10, `expected 10, got ${n25Sources.size}`);
for (const [relative, expected] of n25Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N25 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n25Context = readText(`${n25Root}/DESIGN-CONTEXT.md`);
assert("N25 frontier derivation", n25Context.includes("N24 A") && n25Context.includes("N20/N22") && n25Context.includes("N23 A") && n25Context.includes("inverse kind `none`") && n25Context.includes("No source chooses N25"), "N25 partial-view frontier unexplained");
const n25Denominator = readJson(n25DenominatorPath);
assert("N25 denominator bytes", digestFile(n25DenominatorPath) === "ea6dac8e8c4c8b2840e3fe1a5c529a25056fae7c1b010612e3d51dc4ec5f4a8b", "N25 denominator changed");
assert("N25 denominator verdict", n25Denominator.verdict === "pass" && n25Denominator.receipt_digest === "85f741073e5067768bf2d25d7bea8ceff1af4dc4fe17f60d34cc071d92130906" && n25Denominator.inspected_selectors.length === 10 && n25Denominator.unbound_signal_ids.length === 0 && n25Denominator.missing_detector_inputs.length === 0, "N25 denominator incomplete");
const n25Selection = readJson(n25SelectionPath);
assert("N25 selection bytes", digestFile(n25SelectionPath) === "737f0de0a555d1af7e7a44f01ee054211115322f46a058fa19b74d095bc30872", "N25 selection changed");
assert("N25 selection fixed point", n25Selection.verdict === "pass" && n25Selection.evidence_state === "design-validator-pass" && n25Selection.fixed_point === true && n25Selection.pass_1_digest === n25Selection.pass_2_digest && n25Selection.pass_1_digest === "1bb094417364ba8cc4208d58a191d97d8c3e8502af97195d2d0e2265445150d9" && n25Selection.result_digest === "7b2ea73bf4d21f927189b895cff80e3f98f69e0538b1e7667c68b1304bf7a893", "N25 selection fixed point mismatch");
const n25RequestPath = `${n25Root}/decisions/BMC-REL-NONNUMERIC-25-OPTION-ADMISSIBILITY-REQUEST.json`;
const n25ReceiptPath = `${n25Root}/decisions/BMC-REL-NONNUMERIC-25-OPTION-PREFILTER-RECEIPT.json`;
const n25Request = readJson(n25RequestPath);
const n25Receipt = readJson(n25ReceiptPath);
assert("N25 request bytes", digestFile(n25RequestPath) === "3da8d26d91f0e15cc3aec3b524e313880cec0869acd0986015e87a855e468f23", "N25 request changed");
assert("N25 receipt bytes", digestFile(n25ReceiptPath) === "47ed9278c94582dc12c813aeee34bbac6b4d387e5930c481c25c3c2eb1b54762", "N25 receipt changed");
assert("N25 requestDigest", digestValue(n25Request) === n25Receipt.requestDigest && n25Receipt.requestDigest === "2cb162b93b51dce8414dbde0b6b0a7257b41089b0a6874c12d94b49cf9c7e77d", "N25 prefilter binding mismatch");
const expectedN25Presented = ["BMC-REL-NONNUMERIC-25-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE", "BMC-REL-NONNUMERIC-25-B-PASS-OBSERVED-SUBGRAPH-ONLY", "BMC-REL-NONNUMERIC-25-C-DEFER", "BMC-REL-NONNUMERIC-25-D-STOP"];
assert("N25 gate route and presented options", n25Receipt.routeOutcome === "gate" && n25Receipt.decisionGateRequired === true && n25Receipt.directOptionId === null && JSON.stringify(n25Receipt.presentedOptionIds) === JSON.stringify(expectedN25Presented), "N25 gate route mismatch");
const n25Actions = n25Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N25 action gates", n25Actions.length === 2 && n25Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N25 A/B owner gates invalid");
assert("N25 rejected forms", JSON.stringify(n25Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-25-W-TREAT-OPEN-VIEW-AS-GLOBAL-CYCLE-FREE", "BMC-REL-NONNUMERIC-25-X-MAKE-OBSERVED-CYCLES-NOT-EVALUATED", "BMC-REL-NONNUMERIC-25-Y-SELECT-CLOSURE-PROOF-SHAPE-NOW", "BMC-REL-NONNUMERIC-25-Z-BUNDLE-MINIMA-REACHABILITY-DUPLICATES-INVERSE-REPRESENTATION-RUNTIME-NUMERIC-OR-CANONICAL-MUTATION"]), "N25 inadmissible forms not rejected");
const n25Architecture = readText(`${n25Root}/ARCHITECTURE-BUNDLE.md`);
assert("N25 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n25Architecture.includes(heading)), "N25 six-view bundle incomplete");
assert("N25 architecture null selection", n25Architecture.includes("Selected option: `null`") && n25Architecture.includes("Decision effect: `none`") && n25Architecture.includes("Recommendation: **A**") && n25Architecture.includes("explicit non-global ceiling"), "N25 architecture implies a choice or lacks claim ceiling");
const n25Examples = readText(`${n25Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N25 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n25Examples.includes(heading)) && n25Examples.includes("Decision effect: `none`") && n25Examples.includes("hypothetical"), "N25 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N25 example coverage ${label}`, n25Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N25 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n25Context.includes(technique)), "N25 dispatch trace incomplete");
assert("N25 Distill pass", readText(`${n25Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N25 Distill did not pass");
const n25Handoff = readJson(`${n25Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N25 strict handoff", n25Handoff.status === "runnable-to-n25-owner-decision" && n25Handoff.selected_source_count === 10 && n25Handoff.blockers.includes("BMC-REL-NONNUMERIC-25-BELONGS-TO-SAME-KIND-CYCLE-PARTIAL-VIEW-VERDICT owner selection") && n25Handoff.authority_effect === "none" && n25Handoff.deterministic_bindings.requestDigest === n25Receipt.requestDigest, "N25 handoff widened authority or lacks bindings");

const n25OwnerSelectionPath = `${n25Root}/decisions/BMC-REL-NONNUMERIC-25-OWNER-SELECTION-RECEIPT.json`;
const n25OwnerSelection = readJson(n25OwnerSelectionPath);
assert("N25 immutable owner selection", digestFile(n25OwnerSelectionPath) === "69ddff6f44d559d34dfcad6055d0063a2f1b1b2563e2fe4cb3b8ca02ba3edbe2", "N25 owner selection receipt changed");
assert("N25 exact A selection", n25OwnerSelection.selection.response === "A" && n25OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-25-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE" && n25OwnerSelection.selection.selected_by === "user", "N25 selection is not exact A/user");
assert("N25 recording timestamp semantics", n25OwnerSelection.selection.exact_response_timestamp_exposed === false && n25OwnerSelection.selection.selection_recorded_at === "2026-08-24T19:29:18+01:00" && n25OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N25 timestamp overstated");
assert("N25 admissibility binding", n25OwnerSelection.admissibility_binding.request_sha256 === digestFile(n25RequestPath) && n25OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n25ReceiptPath) && n25OwnerSelection.admissibility_binding.requestDigest === n25Receipt.requestDigest && n25OwnerSelection.admissibility_binding.hazard_class === "authority" && n25OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N25 gate binding mismatch");
assert("N25 narrow not-evaluated effect", n25OwnerSelection.selection_effect.candidate_design_policy.includes("not-evaluated-incomplete-closure") && n25OwnerSelection.scope_binding.whole_boundary_cycle_freedom_claim_allowed_without_relevant_closure === false && n25OwnerSelection.authorization_boundary.partial_view_verdict_selected === true && n25OwnerSelection.authorization_boundary.closure_proof_shape_selected === false && n25OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N25 selection scope widened");

const n26ManifestPath = `${n26Root}/DESIGN-SCOPE-MANIFEST.json`;
const n26DenominatorPath = `${n26Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n26SelectionPath = `${n26Root}/DESIGN-SELECTION-RESULT.json`;
const n26Manifest = readJson(n26ManifestPath);
assert("N26 manifest bytes", digestFile(n26ManifestPath) === "fc6c9f2efbfde446d1e12e7dfd66d925fc8464ff64cdcb6bc03f4b800352ea09", "N26 manifest changed");
assert("N26 manifest input digest", digestValue(without(n26Manifest, "input_digest")) === n26Manifest.input_digest && n26Manifest.input_digest === "f4db01edab0fe81fe66c6a3685e96e8032089c037bfe2805d8925945d3cbb6a0", "N26 canonical digest mismatch");
assert("N26 manifest closed", n26Manifest.unknowns.length === 0 && n26Manifest.authored_by !== "invoke-design-scope-extractor", "N26 manifest is not closed and independent");
const n26Sources = new Map(n26Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N26 exact denominator count", n26Sources.size === 10, `expected 10, got ${n26Sources.size}`);
for (const [relative, expected] of n26Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N26 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n26Context = readText(`${n26Root}/DESIGN-CONTEXT.md`);
assert("N26 frontier derivation", n26Context.includes("N25 A") && n26Context.includes("outgoing") && n26Context.includes("incoming") && n26Context.includes("one exact admitted D30") && n26Context.includes("No source chooses N26"), "N26 closure-proof frontier unexplained");
const n26Denominator = readJson(n26DenominatorPath);
assert("N26 denominator bytes", digestFile(n26DenominatorPath) === "efb3f51e83976220ba077178883278e03041a38f816ff0e3f94cc2b587c09408", "N26 denominator changed");
assert("N26 denominator verdict", n26Denominator.verdict === "pass" && n26Denominator.receipt_digest === "d350dbc33f4d8c5fb474096882c68e4f914a01afa38a9c34701f5c5e70a009d0" && n26Denominator.inspected_selectors.length === 10 && n26Denominator.unbound_signal_ids.length === 0 && n26Denominator.missing_detector_inputs.length === 0, "N26 denominator incomplete");
const n26Selection = readJson(n26SelectionPath);
assert("N26 selection bytes", digestFile(n26SelectionPath) === "0b39bf9e657b2552e1a0d03629fa7ac4ce72b61528d3d71aca52b06ee3ed0b3e", "N26 selection changed");
assert("N26 selection fixed point", n26Selection.verdict === "pass" && n26Selection.evidence_state === "design-validator-pass" && n26Selection.fixed_point === true && n26Selection.pass_1_digest === n26Selection.pass_2_digest && n26Selection.pass_1_digest === "8152b9b280773940fdfd344d817460b12aa0b9568fcee755a50f1806bf10e908" && n26Selection.result_digest === "05dbdc352b462568bb248cf2ad0224e485d3f862d1773a6ac998d3cd4b65b394", "N26 selection fixed point mismatch");
const n26RequestPath = `${n26Root}/decisions/BMC-REL-NONNUMERIC-26-OPTION-ADMISSIBILITY-REQUEST.json`;
const n26ReceiptPath = `${n26Root}/decisions/BMC-REL-NONNUMERIC-26-OPTION-PREFILTER-RECEIPT.json`;
const n26Request = readJson(n26RequestPath);
const n26Receipt = readJson(n26ReceiptPath);
assert("N26 request bytes", digestFile(n26RequestPath) === "b4fb22b0a9d13a9b570377ef39e9e1411394217bda6ec4cb0ba7d98d79296e05", "N26 request changed");
assert("N26 receipt bytes", digestFile(n26ReceiptPath) === "cfa0b611f08c1245a90c5863b99e2b64176c8e1ff12e3e0175200fd24e020341", "N26 receipt changed");
assert("N26 requestDigest", digestValue(n26Request) === n26Receipt.requestDigest && n26Receipt.requestDigest === "2587bbfef952a3c1d532855040a1725c43bb0f487ecf39a29a6bcad2a814c0f1", "N26 prefilter binding mismatch");
const expectedN26Presented = ["BMC-REL-NONNUMERIC-26-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION", "BMC-REL-NONNUMERIC-26-B-BIDIRECTIONAL-ADJACENCY-PLUS-ENTITY-POPULATION", "BMC-REL-NONNUMERIC-26-C-DEFER", "BMC-REL-NONNUMERIC-26-D-STOP"];
assert("N26 gate route and presented options", n26Receipt.routeOutcome === "gate" && n26Receipt.decisionGateRequired === true && n26Receipt.directOptionId === null && JSON.stringify(n26Receipt.presentedOptionIds) === JSON.stringify(expectedN26Presented), "N26 gate route mismatch");
const n26Actions = n26Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N26 action gates", n26Actions.length === 2 && n26Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N26 A/B owner gates invalid");
assert("N26 rejected forms", JSON.stringify(n26Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-26-W-INFER-CLOSURE-FROM-FEATURE-SCOPE", "BMC-REL-NONNUMERIC-26-X-POOL-ALL-MEMBERSHIP-KINDS", "BMC-REL-NONNUMERIC-26-Y-SELECT-CLOSURE-METADATA-REPRESENTATION", "BMC-REL-NONNUMERIC-26-Z-BUNDLE-MINIMA-MANDATORY-MEMBERSHIP-TOPOLOGY-REACHABILITY-DUPLICATES-INVERSE-RUNTIME-NUMERIC-OR-CANONICAL-MUTATION"]), "N26 inadmissible forms not rejected");
const n26Architecture = readText(`${n26Root}/ARCHITECTURE-BUNDLE.md`);
assert("N26 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n26Architecture.includes(heading)), "N26 six-view bundle incomplete");
assert("N26 architecture null selection", n26Architecture.includes("Selected option: `null`") && n26Architecture.includes("Decision effect: `none`") && n26Architecture.includes("Recommendation: **A**") && n26Architecture.includes("stronger contract"), "N26 architecture implies a choice or lacks proof tradeoff");
const n26Examples = readText(`${n26Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N26 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n26Examples.includes(heading)) && n26Examples.includes("Decision effect: `none`") && n26Examples.includes("hypothetical"), "N26 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N26 example coverage ${label}`, n26Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N26 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n26Context.includes(technique)), "N26 dispatch trace incomplete");
assert("N26 Distill pass", readText(`${n26Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N26 Distill did not pass");
const n26Handoff = readJson(`${n26Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N26 strict handoff", n26Handoff.status === "runnable-to-n26-owner-decision" && n26Handoff.selected_source_count === 10 && n26Handoff.blockers.includes("BMC-REL-NONNUMERIC-26-BELONGS-TO-SAME-KIND-CYCLE-CLOSURE-PROOF-SHAPE owner selection") && n26Handoff.authority_effect === "none" && n26Handoff.deterministic_bindings.requestDigest === n26Receipt.requestDigest, "N26 handoff widened authority or lacks bindings");
const n26OwnerSelectionPath = `${n26Root}/decisions/BMC-REL-NONNUMERIC-26-OWNER-SELECTION-RECEIPT.json`;
const n26OwnerSelection = readJson(n26OwnerSelectionPath);
assert("N26 immutable owner selection", digestFile(n26OwnerSelectionPath) === "fb035a6127b7257f7f63b4c88fd3aeb94d759784c2efbefecd8c7daee01f14e3", "N26 owner selection receipt changed");
assert("N26 exact A selection", n26OwnerSelection.selection.response === "A" && n26OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-26-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION" && n26OwnerSelection.selection.selected_by === "user", "N26 selection is not exact A/user");
assert("N26 recording timestamp semantics", n26OwnerSelection.selection.exact_response_timestamp_exposed === false && n26OwnerSelection.selection.selection_recorded_at === "2026-08-24T20:07:12+01:00" && n26OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N26 timestamp overstated");
assert("N26 admissibility binding", n26OwnerSelection.admissibility_binding.request_sha256 === digestFile(n26RequestPath) && n26OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n26ReceiptPath) && n26OwnerSelection.admissibility_binding.requestDigest === n26Receipt.requestDigest && n26OwnerSelection.admissibility_binding.hazard_class === "authority" && n26OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N26 gate binding mismatch");
assert("N26 narrow proof effect", n26OwnerSelection.selection_effect.candidate_design_policy.includes("complete outgoing exact-kind canonical belongs-to adjacency") && n26OwnerSelection.scope_binding.incoming_adjacency_required === false && n26OwnerSelection.authorization_boundary.closure_proof_shape_selected === true && n26OwnerSelection.authorization_boundary.path_consequence_governance_or_behavior_selected === false && n26OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N26 selection scope widened");

const n27ManifestPath = `${n27Root}/DESIGN-SCOPE-MANIFEST.json`;
const n27DenominatorPath = `${n27Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n27SelectionPath = `${n27Root}/DESIGN-SELECTION-RESULT.json`;
const n27Manifest = readJson(n27ManifestPath);
assert("N27 manifest bytes", digestFile(n27ManifestPath) === "63d01dbf32bb62ddf2a128a9b29014bf329840679908b90f1b813e3bbf413e02", "N27 manifest changed");
assert("N27 manifest input digest", digestValue(without(n27Manifest, "input_digest")) === n27Manifest.input_digest && n27Manifest.input_digest === "54b31a4666b1cd9473e9903ee6a6e6f08a6af1f668ed4130d5584a96e8c3ca22", "N27 canonical digest mismatch");
assert("N27 manifest closed", n27Manifest.unknowns.length === 0 && n27Manifest.authored_by !== "invoke-design-scope-extractor", "N27 manifest is not closed and independent");
const n27Sources = new Map(n27Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N27 exact denominator count", n27Sources.size === 9, `expected 9, got ${n27Sources.size}`);
for (const [relative, expected] of n27Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N27 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n27Context = readText(`${n27Root}/DESIGN-CONTEXT.md`);
assert("N27 frontier derivation", n27Context.includes("N26 A") && n27Context.includes("pairwise non-overlapping") && n27Context.includes("withholds transitivity") && n27Context.includes("inverse kind") && n27Context.includes("N13 is analogy only"), "N27 governance frontier unexplained");
const n27Denominator = readJson(n27DenominatorPath);
assert("N27 denominator bytes", digestFile(n27DenominatorPath) === "cd6493d9c6862f9fbc4c89a5aa1649dfc2ca5a2b59003fe8cd50eed30d457c26", "N27 denominator changed");
assert("N27 denominator verdict", n27Denominator.verdict === "pass" && n27Denominator.receipt_digest === "953812a4af9f4e30c25cee8eefc1c54b07f6c46b9bc0addb6f490de7972ebdda" && n27Denominator.inspected_selectors.length === 9 && n27Denominator.unbound_signal_ids.length === 0 && n27Denominator.missing_detector_inputs.length === 0, "N27 denominator incomplete");
const n27Selection = readJson(n27SelectionPath);
assert("N27 selection bytes", digestFile(n27SelectionPath) === "436c3c4dce493a198d11eac74e4cef629b2dd08c596745b21557d43283e25a4d", "N27 selection changed");
assert("N27 selection fixed point", n27Selection.verdict === "pass" && n27Selection.evidence_state === "design-validator-pass" && n27Selection.fixed_point === true && n27Selection.pass_1_digest === n27Selection.pass_2_digest && n27Selection.pass_1_digest === "363fc81e725f2c393a00f71ed32b01c5e2b67433faf8e448cc119f201ede25c8" && n27Selection.result_digest === "c74c3b98916af7c5cc530f53aa6272078b35c902b5e38ad128ae50ea4e0809df", "N27 selection fixed point mismatch");
const n27RequestPath = `${n27Root}/decisions/BMC-REL-NONNUMERIC-27-OPTION-ADMISSIBILITY-REQUEST.json`;
const n27ReceiptPath = `${n27Root}/decisions/BMC-REL-NONNUMERIC-27-OPTION-PREFILTER-RECEIPT.json`;
const n27OwnerSelectionPath = `${n27Root}/decisions/BMC-REL-NONNUMERIC-27-OWNER-SELECTION-RECEIPT.json`;
const n27Request = readJson(n27RequestPath);
const n27Receipt = readJson(n27ReceiptPath);
const n27OwnerSelection = readJson(n27OwnerSelectionPath);
assert("N27 request bytes", digestFile(n27RequestPath) === "3151f5024f0860faf600f4d530e1c3807452f5010501a078bcf57665c9b4736f", "N27 request changed");
assert("N27 receipt bytes", digestFile(n27ReceiptPath) === "f50fbb7f4063dd6a2b4aef7dd54b678751d557c9e989b2059fdac078791845fe", "N27 receipt changed");
assert("N27 requestDigest", digestValue(n27Request) === n27Receipt.requestDigest && n27Receipt.requestDigest === "b14f4984305278cedd95af4500cdf31db370a0df919d1c383a8b22d9ea20a099", "N27 prefilter binding mismatch");
const expectedN27Presented = ["BMC-REL-NONNUMERIC-27-A-UNIFORM-PATH-CONSEQUENCE-POLICY-ACROSS-MEMBERSHIP-KINDS", "BMC-REL-NONNUMERIC-27-B-KIND-SPECIFIC-PATH-CONSEQUENCE-POLICY", "BMC-REL-NONNUMERIC-27-C-DEFER", "BMC-REL-NONNUMERIC-27-D-STOP"];
assert("N27 gate route and presented options", n27Receipt.routeOutcome === "gate" && n27Receipt.decisionGateRequired === true && n27Receipt.directOptionId === null && JSON.stringify(n27Receipt.presentedOptionIds) === JSON.stringify(expectedN27Presented), "N27 gate route mismatch");
const n27Actions = n27Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N27 action gates", n27Actions.length === 2 && n27Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N27 A/B owner gates invalid");
assert("N27 rejected forms", JSON.stringify(n27Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-27-W-SELECT-DIRECT-ONLY-OR-DERIVED-BEHAVIOR-NOW", "BMC-REL-NONNUMERIC-27-X-INFER-GOVERNANCE-FROM-KIND-TOKENS-REGISTRY-ORDER-OR-N13", "BMC-REL-NONNUMERIC-27-Y-COLLAPSE-KINDS-OR-BUNDLE-MIXED-KIND-PATHS", "BMC-REL-NONNUMERIC-27-Z-BUNDLE-NEW-EDGES-NAMING-PROVENANCE-MATERIALIZATION-REPRESENTATION-CLOSURE-MANDATORY-MEMBERSHIP-RUNTIME-NUMERIC-OR-CANONICAL-MUTATION"]), "N27 inadmissible forms not rejected");
assert("N27 owner selection exact B", n27OwnerSelection.decision_id === n27Receipt.decisionId && n27OwnerSelection.selection.response === "B" && n27OwnerSelection.selection.selected_option_id === "BMC-REL-NONNUMERIC-27-B-KIND-SPECIFIC-PATH-CONSEQUENCE-POLICY" && n27OwnerSelection.selection.selected_by === "user", "N27 owner selection mismatch");
assert("N27 recording timestamp semantics", n27OwnerSelection.selection.exact_response_timestamp_exposed === false && n27OwnerSelection.selection.selection_recorded_at === "2026-08-24T20:39:11+01:00" && n27OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N27 timestamp overstated");
assert("N27 admissibility binding", n27OwnerSelection.admissibility_binding.request_sha256 === digestFile(n27RequestPath) && n27OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n27ReceiptPath) && n27OwnerSelection.admissibility_binding.requestDigest === n27Receipt.requestDigest && n27OwnerSelection.admissibility_binding.selected_option_admitted === true && n27OwnerSelection.admissibility_binding.selected_option_presented === true && n27OwnerSelection.admissibility_binding.hazard_class === "authority" && n27OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N27 gate binding mismatch");
assert("N27 narrow kind-specific effect", n27OwnerSelection.selection_effect.candidate_design_policy.includes("independently per exact active D30 membership kind") && n27OwnerSelection.selection_effect.does_not_select.includes("direct-only or derived-reachability behavior for any membership kind") && n27OwnerSelection.authorization_boundary.first_membership_kind_selected === false && n27OwnerSelection.authorization_boundary.path_consequence_behavior_selected === false && n27OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N27 selection scope widened");
assert("N27 registry no-precedence binding", n27OwnerSelection.registry_binding.sha256 === digestBytes(fs.readFileSync(repoAbsolute("projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json"))) && JSON.stringify(n27OwnerSelection.registry_binding.current_active_ids) === JSON.stringify(["classification", "home-assignment"]) && n27OwnerSelection.registry_binding.ordering_semantics === "serialization-only-no-precedence-authority", "N27 registry sequencing inferred");
assert("historical N27 keeps sequencing separate", !fs.readdirSync(absolute(`${n27Root}/decisions`)).some((name) => name.includes("SEQUENCING-RECEIPT")), "N27 historical gate was mutated with later sequencing evidence");
const n27Architecture = readText(`${n27Root}/ARCHITECTURE-BUNDLE.md`);
assert("N27 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n27Architecture.includes(heading)), "N27 six-view bundle incomplete");
assert("N27 architecture null selection", n27Architecture.includes("Selected option: `null`") && n27Architecture.includes("Decision effect: `none`") && n27Architecture.includes("Recommendation: **B**") && n27Architecture.includes("pairwise non-overlapping"), "N27 architecture implies a choice or lacks governance tradeoff");
const n27Examples = readText(`${n27Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N27 complexity ladder", ["## Low", "## Medium", "## Complex"].every((heading) => n27Examples.includes(heading)) && n27Examples.includes("Decision effect: `none`") && n27Examples.includes("hypothetical"), "N27 examples incomplete");
for (const label of ["- A:", "- B:", "- C:", "- D:"]) assert(`N27 example coverage ${label}`, n27Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
assert("N27 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n27Context.includes(technique)), "N27 dispatch trace incomplete");
assert("N27 Distill pass", readText(`${n27Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Verdict: `pass`"), "N27 Distill did not pass");
const n27Handoff = readJson(`${n27Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N27 strict clarification handoff", n27Handoff.status === "blocked-at-first-membership-kind-sequencing-clarification" && n27Handoff.selected_source_count === 9 && n27Handoff.next_clarification.id === "BMC-REL-CLARIFICATION-N27-FIRST-MEMBERSHIP-KIND-SEQUENCING" && JSON.stringify(n27Handoff.next_clarification.options) === JSON.stringify(["classification", "home-assignment"]) && n27Handoff.next_clarification.recommendation === null && n27Handoff.next_clarification.receipt_created === false && n27Handoff.authority_effect === "none" && n27Handoff.deterministic_bindings.requestDigest === n27Receipt.requestDigest && n27Handoff.deterministic_bindings.selected_option_id === n27OwnerSelection.selection.selected_option_id, "N27 clarification handoff widened authority or lacks bindings");

const n28SequencingPath = `${n28Root}/decisions/BMC-REL-NONNUMERIC-28-KIND-SEQUENCING-RECEIPT.json`;
const n28Sequencing = readJson(n28SequencingPath);
assert("N28 immutable classification sequencing", digestFile(n28SequencingPath) === "15e021855e6b9bfde2c68a33018653ae3552f610964c067f5b0e55b932987b3b", "N28 sequencing receipt changed");
assert("N28 exact classification sequencing", n28Sequencing.clarification.exact_input === "classification" && n28Sequencing.clarification.selected_membership_kind_id === "classification" && n28Sequencing.clarification.provided_by === "user", "N28 sequencing input mismatch");
assert("N28 sequencing timestamp semantics", n28Sequencing.clarification.exact_response_timestamp_exposed === false && n28Sequencing.clarification.selection_recorded_at === "2026-08-24T21:04:26+01:00" && n28Sequencing.clarification.recording_time_note.includes("not a transport-provided response timestamp"), "N28 sequencing timestamp overstated");
assert("N28 sequencing prior bindings", n28Sequencing.bindings.n27_selection_receipt_sha256 === digestFile(n27OwnerSelectionPath) && n28Sequencing.bindings.n27_closeout_sha256 === "c7534ef1608bffe9038df5315160cb5e5c5799268fa330810078d6f8342fc64d" && n28Sequencing.bindings.membership_registry_sha256 === "854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c", "N28 sequencing evidence mismatch");
assert("N28 sequencing narrow effect", n28Sequencing.effect.does_not_select.some((item) => item.includes("direct-only classification")) && n28Sequencing.effect.does_not_select.some((item) => item.includes("derived classification")) && n28Sequencing.effect.does_not_select.some((item) => item.includes("home-assignment")) && n28Sequencing.authority_boundary.n28_owner_choice_made === false && n28Sequencing.authority_boundary.repository_authority_effect === "none", "N28 sequencing inferred behavior");

const n28ManifestPath = `${n28Root}/DESIGN-SCOPE-MANIFEST.json`;
const n28DenominatorPath = `${n28Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n28SelectionPath = `${n28Root}/DESIGN-SELECTION-RESULT.json`;
const n28Manifest = readJson(n28ManifestPath);
assert("N28 manifest bytes", digestFile(n28ManifestPath) === "c7d9a7d930742eb8fb3ee8f0216527ce7899f6171a9042b83350a73f07d5dda3", "N28 manifest changed");
assert("N28 manifest input digest", digestValue(without(n28Manifest, "input_digest")) === n28Manifest.input_digest && n28Manifest.input_digest === "413d601e815db9a9de61891465a709a47496d3dcf914636659e7111ce129b922", "N28 canonical digest mismatch");
assert("N28 manifest closed", n28Manifest.unknowns.length === 0 && n28Manifest.authored_by !== "invoke-design-scope-extractor", "N28 manifest is not closed and independent");
const n28Sources = new Map(n28Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N28 exact denominator count", n28Sources.size === 6, `expected 6, got ${n28Sources.size}`);
for (const [relative, expected] of n28Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N28 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n28Denominator = readJson(n28DenominatorPath);
assert("N28 denominator bytes", digestFile(n28DenominatorPath) === "6e5dcb8c53faa3f60d03b2a249267ea76e9acc53cd33e0458c828b009c56a861", "N28 denominator changed");
assert("N28 denominator verdict", n28Denominator.verdict === "pass" && n28Denominator.receipt_digest === "59785a0d80f9fb30f4afbb605e0c61609c4d44b75b7da3b600c077f26484ea4b" && n28Denominator.inspected_selectors.length === 6 && n28Denominator.unbound_signal_ids.length === 0 && n28Denominator.missing_detector_inputs.length === 0, "N28 denominator incomplete");
const n28Selection = readJson(n28SelectionPath);
assert("N28 selection bytes", digestFile(n28SelectionPath) === "3b984b24080905338395ed73ac739e6ebceb401f5035a3f563ed203e9228646f", "N28 selection changed");
assert("N28 selection fixed point", n28Selection.verdict === "pass" && n28Selection.evidence_state === "design-validator-pass" && n28Selection.fixed_point === true && n28Selection.pass_1_digest === n28Selection.pass_2_digest && n28Selection.pass_1_digest === "9a657a1b2fa9b23a8cf0f577be704229b3af49363f452e3ed05ec603f7aebe3f" && n28Selection.result_digest === "df00217f4956eaf193aeab9a1837f11941525fc23cdf417a9771987dbc63645f", "N28 selection fixed point mismatch");
const n28RequestPath = `${n28Root}/decisions/BMC-REL-NONNUMERIC-28-OPTION-ADMISSIBILITY-REQUEST.json`;
const n28ReceiptPath = `${n28Root}/decisions/BMC-REL-NONNUMERIC-28-OPTION-PREFILTER-RECEIPT.json`;
const n28Request = readJson(n28RequestPath);
const n28Receipt = readJson(n28ReceiptPath);
assert("N28 request bytes", digestFile(n28RequestPath) === "04d065cece68215e424efe72a98bd67ecd470d19a5b323bf9c0d3b1a72a55cfd", "N28 request changed");
assert("N28 receipt bytes", digestFile(n28ReceiptPath) === "12c15aa084ee8e9baf07bf56bdbdb7f0a5ce335314f5f9e7f5cba1854a5f4000", "N28 receipt changed");
assert("N28 requestDigest", digestValue(n28Request) === n28Receipt.requestDigest && n28Receipt.requestDigest === "b59ecb963ccbf3a1bbf9a1dcaec9fa3a8dfc720e6d6c0e1c618f6f160a71eeb5", "N28 prefilter binding mismatch");
const expectedN28Presented = ["BMC-REL-NONNUMERIC-28-A-DIRECT-ONLY-CLASSIFICATION-CONSEQUENCE", "BMC-REL-NONNUMERIC-28-B-DERIVE-CLASSIFICATION-REACHABILITY", "BMC-REL-NONNUMERIC-28-C-DEFER", "BMC-REL-NONNUMERIC-28-D-STOP"];
assert("N28 gate route and presented options", n28Receipt.routeOutcome === "gate" && n28Receipt.decisionGateRequired === true && n28Receipt.directOptionId === null && JSON.stringify(n28Receipt.presentedOptionIds) === JSON.stringify(expectedN28Presented), "N28 gate route mismatch");
const n28Actions = n28Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N28 action gates", n28Actions.length === 2 && n28Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N28 A/B owner gates invalid");
assert("N28 rejected overreach", JSON.stringify(n28Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-28-W-AUTHOR-DERIVED-CANONICAL-BELONGS-TO-EDGES", "BMC-REL-NONNUMERIC-28-X-INCLUDE-HOME-ASSIGNMENT-OR-MIXED-KIND-PATHS", "BMC-REL-NONNUMERIC-28-Y-REQUIRE-CLASSIFICATION-MEMBERSHIP", "BMC-REL-NONNUMERIC-28-Z-SELECT-REPRESENTATION-CLOSURE-OR-RUNTIME"]), "N28 inadmissible forms not rejected");
const n28Architecture = readText(`${n28Root}/ARCHITECTURE-BUNDLE.md`);
assert("N28 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n28Architecture.includes(heading)), "N28 six-view bundle incomplete");
assert("N28 architecture null selection", n28Architecture.includes("Selection: `null`") && n28Architecture.includes("`authority_effect: none`") && n28Architecture.includes("Recommendation: A") && n28Architecture.includes("non-authoritative"), "N28 architecture implies choice or lacks tradeoff");
const n28Examples = readText(`${n28Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N28 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n28Examples.includes(heading)) && n28Examples.includes("`decision_effect: none`") && n28Examples.includes("hypothetical"), "N28 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N28 example coverage ${label}`, n28Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n28Context = readText(`${n28Root}/DESIGN-CONTEXT.md`);
assert("N28 frontier derivation", n28Context.includes("N27 B") && n28Context.includes("classification") && n28Context.includes("D30") && n28Context.includes("D23") && n28Context.includes("six direct exact sources"), "N28 frontier unexplained");
assert("N28 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n28Context.includes(technique)), "N28 dispatch trace incomplete");
assert("N28 Distill pass", readText(`${n28Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N28 Distill did not pass");
const n28Handoff = readJson(`${n28Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N28 strict handoff", n28Handoff.status === "blocked-at-owner-decision" && n28Handoff.execution_allowed === false && n28Handoff.selected_option === null && n28Handoff.sequenced_membership_kind === "classification" && n28Handoff.current_decision === n28Receipt.decisionId && n28Handoff.authority_effect === "none", "N28 handoff widened authority");

const n28OwnerSelectionPath = `${n28Root}/decisions/BMC-REL-NONNUMERIC-28-OWNER-SELECTION-RECEIPT.json`;
const n28OwnerSelection = readJson(n28OwnerSelectionPath);
assert("N28 owner receipt immutable binding", digestFile(n28OwnerSelectionPath) === "b92eda583faaad3c579616a5826c4f41e5d4e48407796d41cddc98fe2ee44536" && n28OwnerSelection.decision_id === n28Receipt.decisionId && n28OwnerSelection.selection.response === "A" && n28OwnerSelection.selection.selected_option_id === expectedN28Presented[0] && n28OwnerSelection.selection.selected_by === "user", "N28 owner receipt mismatch");
assert("N28 owner recording semantics", n28OwnerSelection.selection.exact_response_timestamp_exposed === false && n28OwnerSelection.selection.selection_recorded_at === "2026-08-25T00:17:42+01:00" && n28OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N28 selection timestamp overstated");
assert("N28 owner admissibility binding", n28OwnerSelection.admissibility_binding.request_sha256 === digestFile(n28RequestPath) && n28OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n28ReceiptPath) && n28OwnerSelection.admissibility_binding.requestDigest === n28Receipt.requestDigest && n28OwnerSelection.admissibility_binding.selected_option_admitted === true && n28OwnerSelection.admissibility_binding.selected_option_presented === true && n28OwnerSelection.admissibility_binding.hazard_class === "authority" && n28OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N28 gate binding mismatch");
assert("N28 direct-only classification effect", n28OwnerSelection.selection_effect.candidate_design_policy.includes("classification consequences remain on the authored direct classification facts") && n28OwnerSelection.scope_binding.derived_reachability === false && n28OwnerSelection.authorization_boundary.home_assignment_path_behavior_selected === false && n28OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N28 selection scope widened");
assert("N28 sole remaining kind derivation", JSON.stringify(n28OwnerSelection.registry_binding.current_active_ids) === JSON.stringify(["classification", "home-assignment"]) && JSON.stringify(n28OwnerSelection.registry_binding.remaining_unselected_membership_kind_ids) === JSON.stringify(["home-assignment"]) && n28OwnerSelection.registry_binding.ordering_semantics === "serialization-only-no-precedence", "N28 inferred registry precedence or failed set difference");

const n29ManifestPath = `${n29Root}/DESIGN-SCOPE-MANIFEST.json`;
const n29DenominatorPath = `${n29Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n29SelectionPath = `${n29Root}/DESIGN-SELECTION-RESULT.json`;
const n29Manifest = readJson(n29ManifestPath);
assert("N29 manifest bytes", digestFile(n29ManifestPath) === "a343257874bfb1bc4d40f79879e99d535bc5ddeca8542917d0bdd7fa29687bdc", "N29 manifest changed");
assert("N29 manifest input digest", digestValue(without(n29Manifest, "input_digest")) === n29Manifest.input_digest && n29Manifest.input_digest === "7f67e54ec527186ccc604eba869d3e878f54e3d6e4ff834d8c143229b8a75d80", "N29 canonical digest mismatch");
assert("N29 manifest closed", n29Manifest.unknowns.length === 0 && n29Manifest.authored_by !== "invoke-design-scope-extractor", "N29 manifest is not closed and independent");
const n29Sources = new Map(n29Manifest.source_contracts.map((source) => [source.path, source.digest]));
assert("N29 exact denominator count", n29Sources.size === 6, `expected 6, got ${n29Sources.size}`);
for (const [relative, expected] of n29Sources) {
  const actual = fs.existsSync(repoAbsolute(relative)) ? digestBytes(fs.readFileSync(repoAbsolute(relative))) : null;
  assert(`N29 source ${relative}`, actual === expected, `expected ${expected}, got ${actual}`);
}
const n29Denominator = readJson(n29DenominatorPath);
assert("N29 denominator bytes", digestFile(n29DenominatorPath) === "2632615e41c3d5b409e1b16d6870e69742c0950b688fdba11d516940822723f5", "N29 denominator changed");
assert("N29 denominator verdict", n29Denominator.verdict === "pass" && n29Denominator.receipt_digest === "d3d631d45fff1350bf7cb8a16e8a926a4547c51f60796628aa92f9ee5b7f3dbf" && n29Denominator.inspected_selectors.length === 6 && n29Denominator.unbound_signal_ids.length === 0 && n29Denominator.missing_detector_inputs.length === 0, "N29 denominator incomplete");
const n29Selection = readJson(n29SelectionPath);
assert("N29 selection bytes", digestFile(n29SelectionPath) === "9d8612e6e57c88554e37095d9a646ba040106e1a07f9455fbd03a2785a8e7b27", "N29 selection changed");
assert("N29 selection fixed point", n29Selection.verdict === "pass" && n29Selection.evidence_state === "design-validator-pass" && n29Selection.fixed_point === true && n29Selection.pass_1_digest === n29Selection.pass_2_digest && n29Selection.pass_1_digest === "14de14a8f16bbf38b6db4b0a917963b22e91b132dd8c06258e1f8ace442bbead" && n29Selection.result_digest === "d43fbb561519483a1cbbe37e9e602c8adbe91f90e092bd59ffb46a8077a5f715", "N29 selection fixed point mismatch");
const n29RequestPath = `${n29Root}/decisions/BMC-REL-NONNUMERIC-29-OPTION-ADMISSIBILITY-REQUEST.json`;
const n29ReceiptPath = `${n29Root}/decisions/BMC-REL-NONNUMERIC-29-OPTION-PREFILTER-RECEIPT.json`;
const n29Request = readJson(n29RequestPath);
const n29Receipt = readJson(n29ReceiptPath);
assert("N29 request bytes", digestFile(n29RequestPath) === "b29ad6f29a05fb424c4d57a28249eb4e69117cd73b950b10a9aabc88f9b9272a", "N29 request changed");
assert("N29 receipt bytes", digestFile(n29ReceiptPath) === "4a1b37d3c84039a51ef3bf76d2421517e7d5d0f5804f560452380501fb57bd77", "N29 receipt changed");
assert("N29 requestDigest", digestValue(n29Request) === n29Receipt.requestDigest && n29Receipt.requestDigest === "544b51e4a05040d4068a3ec7ff1eac1e2300b7989ac0c44b57becfebcff7a881", "N29 prefilter binding mismatch");
const expectedN29Presented = ["BMC-REL-NONNUMERIC-29-A-DIRECT-ONLY-HOME-ASSIGNMENT-CONSEQUENCE", "BMC-REL-NONNUMERIC-29-B-DERIVE-HOME-ASSIGNMENT-REACHABILITY", "BMC-REL-NONNUMERIC-29-C-DEFER", "BMC-REL-NONNUMERIC-29-D-STOP"];
assert("N29 gate route and presented options", n29Receipt.routeOutcome === "gate" && n29Receipt.decisionGateRequired === true && n29Receipt.directOptionId === null && JSON.stringify(n29Receipt.presentedOptionIds) === JSON.stringify(expectedN29Presented), "N29 gate route mismatch");
const n29Actions = n29Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N29 action gates", n29Actions.length === 2 && n29Actions.every((candidate) => candidate.reversibility === "reversible" && candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N29 A/B owner gates invalid");
assert("N29 rejected overreach", JSON.stringify(n29Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-29-W-AUTHOR-DERIVED-CANONICAL-BELONGS-TO-EDGES", "BMC-REL-NONNUMERIC-29-X-INCLUDE-CLASSIFICATION-OR-MIXED-KIND-PATHS", "BMC-REL-NONNUMERIC-29-Y-REQUIRE-HOME-ASSIGNMENT-MEMBERSHIP", "BMC-REL-NONNUMERIC-29-Z-SELECT-REPRESENTATION-CLOSURE-OR-RUNTIME"]), "N29 inadmissible forms not rejected");
const n29Architecture = readText(`${n29Root}/ARCHITECTURE-BUNDLE.md`);
assert("N29 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n29Architecture.includes(heading)), "N29 six-view bundle incomplete");
assert("N29 architecture null selection", n29Architecture.includes("Selection: `null`") && n29Architecture.includes("`authority_effect: none`") && n29Architecture.includes("Recommendation: A") && n29Architecture.includes("non-authoritative"), "N29 architecture implies choice or lacks tradeoff");
const n29Examples = readText(`${n29Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N29 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n29Examples.includes(heading)) && n29Examples.includes("`decision_effect: none`") && n29Examples.includes("hypothetical"), "N29 examples incomplete");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N29 example coverage ${label}`, n29Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n29Context = readText(`${n29Root}/DESIGN-CONTEXT.md`);
assert("N29 frontier derivation", n29Context.includes("N27") && n29Context.includes("N28 A") && n29Context.includes("sole current unresolved") && n29Context.includes("D30") && n29Context.includes("D23") && n29Context.includes("six direct exact sources"), "N29 frontier unexplained");
assert("N29 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n29Context.includes(technique)), "N29 dispatch trace incomplete");
assert("N29 Distill pass", readText(`${n29Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N29 Distill did not pass");
const n29Handoff = readJson(`${n29Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N29 strict handoff", n29Handoff.status === "blocked-at-owner-decision" && n29Handoff.execution_allowed === false && n29Handoff.selected_option === null && n29Handoff.membership_kind === "home-assignment" && n29Handoff.current_decision === n29Receipt.decisionId && n29Handoff.authority_effect === "none", "N29 handoff widened authority");

const n29OwnerPath = `${n29Root}/decisions/BMC-REL-NONNUMERIC-29-OWNER-SELECTION-RECEIPT.json`;
const n29Owner = readJson(n29OwnerPath);
assert("N29 immutable A selection", digestFile(n29OwnerPath) === "76c927b8637da9dc0e56ca25751a8f42c43d2d6d371ac25c6623f935c630b547" && n29Owner.selection.selected_option_id === "BMC-REL-NONNUMERIC-29-A-DIRECT-ONLY-HOME-ASSIGNMENT-CONSEQUENCE" && n29Owner.selection.exact_response_timestamp_exposed === false && n29Owner.selection.selection_recorded_at === "2026-08-25T00:50:44+01:00", "N29 selection receipt drifted");
assert("N29 exact gate binding", n29Owner.admissibility_binding.request_sha256 === digestFile(n29RequestPath) && n29Owner.admissibility_binding.receipt_sha256 === digestFile(n29ReceiptPath) && n29Owner.admissibility_binding.requestDigest === n29Receipt.requestDigest && n29Owner.authorization_boundary.repository_authority_effect === "none", "N29 gate or authority binding widened");

const n30ManifestPath = `${n30Root}/DESIGN-SCOPE-MANIFEST.json`;
const n30DenominatorPath = `${n30Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n30SelectionPath = `${n30Root}/DESIGN-SELECTION-RESULT.json`;
const n30RequestPath = `${n30Root}/decisions/BMC-REL-NONNUMERIC-30-OPTION-ADMISSIBILITY-REQUEST.json`;
const n30ReceiptPath = `${n30Root}/decisions/BMC-REL-NONNUMERIC-30-OPTION-PREFILTER-RECEIPT.json`;
const n30Manifest = readJson(n30ManifestPath);
const n30Denominator = readJson(n30DenominatorPath);
const n30Selection = readJson(n30SelectionPath);
const n30Request = readJson(n30RequestPath);
const n30Receipt = readJson(n30ReceiptPath);
assert("N30 manifest closed", digestValue(without(n30Manifest, "input_digest")) === n30Manifest.input_digest && n30Manifest.unknowns.length === 0 && n30Manifest.source_contracts.length === 9, "N30 manifest not closed");
for (const source of n30Manifest.source_contracts) assert(`N30 source ${source.path}`, digestBytes(fs.readFileSync(repoAbsolute(source.path))) === source.digest, "N30 source drift");
assert("N30 denominator pass", n30Denominator.verdict === "pass" && n30Denominator.unbound_signal_ids.length === 0 && n30Denominator.missing_detector_inputs.length === 0, "N30 denominator incomplete");
assert("N30 selection fixed point", n30Selection.verdict === "pass" && n30Selection.fixed_point === true && n30Selection.pass_1_digest === n30Selection.pass_2_digest, "N30 selection not fixed point");
assert("N30 prefilter binding", digestValue(n30Request) === n30Receipt.requestDigest && n30Receipt.routeOutcome === "gate" && n30Receipt.decisionGateRequired === true, "N30 prefilter binding invalid");
const expectedN30 = ["BMC-REL-NONNUMERIC-30-A-DIRECT-FACTS-ONLY-FOR-MIXED-KIND-PATHS", "BMC-REL-NONNUMERIC-30-B-DERIVE-KIND-TRACE-PRESERVING-MIXED-PATH-REACHABILITY", "BMC-REL-NONNUMERIC-30-C-DEFER", "BMC-REL-NONNUMERIC-30-D-STOP"];
assert("N30 presented options", JSON.stringify(n30Receipt.presentedOptionIds) === JSON.stringify(expectedN30), "N30 options drifted");
const n30Actions = n30Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N30 action owner gates", n30Actions.length === 2 && n30Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N30 owner gate missing");
const n30Architecture = readText(`${n30Root}/ARCHITECTURE-BUNDLE.md`);
assert("N30 six views and null selection", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n30Architecture.includes(heading)) && n30Architecture.includes("Selection: `null`") && n30Architecture.includes("Recommendation: A"), "N30 architecture incomplete");
const n30Examples = readText(`${n30Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N30 D30 semantics and ladder", n30Examples.includes("classified under/by") && n30Examples.includes("home or placement") && n30Examples.includes("`decision_effect: none`") && !n30Examples.includes("direct classification responsibility"), "N30 examples reverse or import semantics");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N30 example coverage ${label}`, n30Examples.split(label).length - 1 === 3, "N30 option coverage unequal");
const n30Handoff = readJson(`${n30Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N30 strict handoff", n30Handoff.status === "blocked-at-owner-decision" && n30Handoff.execution_allowed === false && n30Handoff.selected_option === null && n30Handoff.authority_effect === "none", "N30 handoff widened authority");

const n30OwnerPath = `${n30Root}/decisions/BMC-REL-NONNUMERIC-30-OWNER-SELECTION-RECEIPT.json`;
const n30Owner = readJson(n30OwnerPath);
assert("N30 immutable A selection", digestFile(n30OwnerPath) === "3ea3f93cec267ced57cce9a3196ea0c402ce43de79fb4bb4f9b6bbfc8a37f1ea" && n30Owner.selection.response === "A" && n30Owner.selection.selected_option_id === expectedN30[0] && n30Owner.selection.selected_by === "user" && n30Owner.selection.exact_response_timestamp_exposed === false && n30Owner.selection.selection_recorded_at === "2026-08-25T11:47:42+01:00", "N30 owner receipt drifted");
assert("N30 exact gate binding", n30Owner.admissibility_binding.request_sha256 === digestFile(n30RequestPath) && n30Owner.admissibility_binding.receipt_sha256 === digestFile(n30ReceiptPath) && n30Owner.admissibility_binding.requestDigest === n30Receipt.requestDigest && n30Owner.admissibility_binding.hazard_class === "authority" && n30Owner.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N30 gate binding widened");
assert("N30 narrow effect", n30Owner.scope_binding.endpoint_relation === "distinct" && n30Owner.scope_binding.derived_endpoint_reachability === false && n30Owner.authorization_boundary.n31_or_later_owner_choice_made === false && n30Owner.authorization_boundary.mixed_closed_path_self_reachability_selected === false && n30Owner.authorization_boundary.repository_authority_effect === "none", "N30 effect widened");

const n31ManifestPath = `${n31Root}/DESIGN-SCOPE-MANIFEST.json`;
const n31DenominatorPath = `${n31Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n31SelectionPath = `${n31Root}/DESIGN-SELECTION-RESULT.json`;
const n31RequestPath = `${n31Root}/decisions/BMC-REL-NONNUMERIC-31-OPTION-ADMISSIBILITY-REQUEST.json`;
const n31ReceiptPath = `${n31Root}/decisions/BMC-REL-NONNUMERIC-31-OPTION-PREFILTER-RECEIPT.json`;
const n31OwnerSelectionPath = `${n31Root}/decisions/BMC-REL-NONNUMERIC-31-OWNER-SELECTION-RECEIPT.json`;
const n31Manifest = readJson(n31ManifestPath);
const n31Denominator = readJson(n31DenominatorPath);
const n31Selection = readJson(n31SelectionPath);
const n31Request = readJson(n31RequestPath);
const n31Receipt = readJson(n31ReceiptPath);
const n31OwnerSelection = readJson(n31OwnerSelectionPath);
assert("N31 manifest closed", digestValue(without(n31Manifest, "input_digest")) === n31Manifest.input_digest && n31Manifest.input_digest === "24f082ee61982d12b7d30eda09b75d4bb564eda64c660018605056e5d13ed311" && n31Manifest.unknowns.length === 0 && n31Manifest.source_contracts.length === 9, "N31 manifest not closed");
for (const source of n31Manifest.source_contracts) assert(`N31 source ${source.path}`, digestBytes(fs.readFileSync(repoAbsolute(source.path))) === source.digest, "N31 source drift");
assert("N31 denominator pass", n31Denominator.verdict === "pass" && n31Denominator.receipt_digest === "91f185de8f4d07ba9414e486b43ae35d6dcca490aace7762caa7998c6df177df" && n31Denominator.inspected_selectors.length === 9 && n31Denominator.unbound_signal_ids.length === 0 && n31Denominator.missing_detector_inputs.length === 0, "N31 denominator incomplete");
assert("N31 selection fixed point", n31Selection.verdict === "pass" && n31Selection.evidence_state === "design-validator-pass" && n31Selection.fixed_point === true && n31Selection.pass_1_digest === n31Selection.pass_2_digest && n31Selection.pass_1_digest === "8f9834c0ae2d899c5a1e3005604cc540024d993fd9f6289455da9a7d0bcb8ce1" && n31Selection.result_digest === "6c845fdb5db920e27423288c392063dadf42fbcb4c0c71613792a47d3661a4d7", "N31 selection not fixed point");
assert("N31 prefilter binding", digestValue(n31Request) === n31Receipt.requestDigest && n31Receipt.requestDigest === "9cfb9a190c60ddcf892042b3f724ed923eacb3c8e251a9ea757c1dd58219fd5c" && n31Receipt.routeOutcome === "gate" && n31Receipt.decisionGateRequired === true, "N31 prefilter binding invalid");
const expectedN31 = ["BMC-REL-NONNUMERIC-31-A-NO-DERIVED-SELF-REACHABILITY-FROM-MIXED-KIND-CLOSED-PATHS", "BMC-REL-NONNUMERIC-31-B-DERIVE-KIND-TRACE-PRESERVING-MIXED-CLOSED-PATH-SELF-REACHABILITY", "BMC-REL-NONNUMERIC-31-C-DEFER", "BMC-REL-NONNUMERIC-31-D-STOP"];
assert("N31 presented options", JSON.stringify(n31Receipt.presentedOptionIds) === JSON.stringify(expectedN31) && n31Receipt.directOptionId === null, "N31 options drifted or selected");
const n31Actions = n31Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N31 action owner gates", n31Actions.length === 2 && n31Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N31 owner gate missing");
assert("N31 rejected overreach", JSON.stringify(n31Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-31-W-AUTHOR-CANONICAL-BELONGS-TO-SELF-EDGE", "BMC-REL-NONNUMERIC-31-X-DERIVE-KIND-FREE-SELF-MEMBERSHIP", "BMC-REL-NONNUMERIC-31-Y-REOPEN-MIXED-KIND-TOPOLOGY-OR-DISTINCT-ENDPOINT-BEHAVIOR", "BMC-REL-NONNUMERIC-31-Z-SELECT-REPRESENTATION-COMPLETENESS-RUNTIME-OR-NUMERIC"]), "N31 inadmissible forms drifted");
assert("N31 immutable owner selection", digestFile(n31OwnerSelectionPath) === "dcfcb51592f96c826268cfb89d8f9552dca74f23898ab3255ee0508c0c6c6b3d", "N31 owner selection receipt changed");
assert("N31 exact A selection", n31OwnerSelection.selection.response === "A" && n31OwnerSelection.selection.selected_option_id === expectedN31[0] && n31OwnerSelection.selection.selected_by === "user", "N31 selection is not exact A/user");
assert("N31 recording timestamp semantics", n31OwnerSelection.selection.exact_response_timestamp_exposed === false && n31OwnerSelection.selection.selection_recorded_at === "2026-08-25T12:50:46+01:00" && n31OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N31 timestamp overstated");
assert("N31 owner selection binding", n31OwnerSelection.admissibility_binding.request_sha256 === digestFile(n31RequestPath) && n31OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n31ReceiptPath) && n31OwnerSelection.admissibility_binding.requestDigest === n31Receipt.requestDigest && n31OwnerSelection.admissibility_binding.hazard_class === "authority" && n31OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N31 selection binding mismatch");
assert("N31 narrow no-self-reachability effect", n31OwnerSelection.scope_binding.endpoint_relation === "equal" && n31OwnerSelection.scope_binding.derived_self_reachability === false && n31OwnerSelection.scope_binding.membership_kind_trace_collapse === false && n31OwnerSelection.authorization_boundary.n32_or_later_owner_choice_made === false && n31OwnerSelection.authorization_boundary.next_event_provenance_verb_selected === false && n31OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N31 selection scope widened");
const n31Architecture = readText(`${n31Root}/ARCHITECTURE-BUNDLE.md`);
assert("N31 six views and null selection", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n31Architecture.includes(heading)) && n31Architecture.includes("Selection: `null`") && n31Architecture.includes("Recommendation: A") && n31Architecture.includes("`authority_effect: none`"), "N31 architecture incomplete or selected");
const n31Examples = readText(`${n31Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N31 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n31Examples.includes(heading)) && n31Examples.includes("`decision_effect: none`") && n31Examples.includes("hypothetical") && n31Examples.includes("classified under/by") && n31Examples.includes("home or placement"), "N31 examples incomplete or reverse D30 semantics");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N31 example coverage ${label}`, n31Examples.split(label).length - 1 === 3, "N31 option coverage unequal");
const n31Context = readText(`${n31Root}/DESIGN-CONTEXT.md`);
assert("N31 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n31Context.includes(technique)), "N31 dispatch trace incomplete");
assert("N31 Distill pass", readText(`${n31Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N31 Distill did not pass");
const n31Handoff = readJson(`${n31Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N31 strict handoff", n31Handoff.status === "blocked-at-owner-decision" && n31Handoff.execution_allowed === false && n31Handoff.selected_option === null && n31Handoff.current_decision === n31Receipt.decisionId && n31Handoff.authority_effect === "none", "N31 handoff widened authority");

const n32ManifestPath = `${n32Root}/DESIGN-SCOPE-MANIFEST.json`;
const n32DenominatorPath = `${n32Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n32SelectionPath = `${n32Root}/DESIGN-SELECTION-RESULT.json`;
const n32RequestPath = `${n32Root}/decisions/BMC-REL-NONNUMERIC-32-OPTION-ADMISSIBILITY-REQUEST.json`;
const n32ReceiptPath = `${n32Root}/decisions/BMC-REL-NONNUMERIC-32-OPTION-PREFILTER-RECEIPT.json`;
const n32SequencingPath = `${n32Root}/decisions/BMC-REL-NONNUMERIC-32-VERB-SEQUENCING-RECEIPT.json`;
const n32Manifest = readJson(n32ManifestPath);
const n32Denominator = readJson(n32DenominatorPath);
const n32Selection = readJson(n32SelectionPath);
const n32Request = readJson(n32RequestPath);
const n32Receipt = readJson(n32ReceiptPath);
const n32Sequencing = readJson(n32SequencingPath);
assert("N32 immutable produces sequencing", digestFile(n32SequencingPath) === "6cf05fae7e5446ddb6810da7477c04d91e446c18645248597fd12a6dbffe030f" && n32Sequencing.clarification.exact_input === "produces" && n32Sequencing.clarification.selected_event_provenance_verb_id === "produces" && n32Sequencing.clarification.provided_by === "user", "N32 sequencing receipt drifted");
assert("N32 sequencing timestamp semantics", n32Sequencing.clarification.exact_response_timestamp_exposed === false && n32Sequencing.clarification.selection_recorded_at === "2026-08-25T13:36:50+01:00" && n32Sequencing.clarification.recording_time_note.includes("not a transport-provided response timestamp"), "N32 sequencing timestamp overstated");
assert("N32 sequencing prior bindings", n32Sequencing.bindings.n31_selection_receipt_sha256 === digestFile(n31OwnerSelectionPath) && n32Sequencing.bindings.n31_clarification_closeout_sha256 === "660cd7ab9d4c4be8ec9c1380bc30a824777b08892db801eff4fb412491e63833" && n32Sequencing.bindings.d08_selection_receipt_sha256 === "31ff7cdc1daac554db4d9989e0d159571c4083beddabbd0ad1e7b1169a798d0b", "N32 sequencing binding mismatch");
assert("N32 sequencing narrow effect", n32Sequencing.authority_boundary.n32_owner_choice_made === false && n32Sequencing.authority_boundary.emits_behavior_selected === false && n32Sequencing.authority_boundary.cross_verb_constraint_selected === false && n32Sequencing.authority_boundary.repository_authority_effect === "none", "N32 sequencing inferred behavior");
assert("N32 manifest closed", digestValue(without(n32Manifest, "input_digest")) === n32Manifest.input_digest && n32Manifest.input_digest === "92b04d457199e1802db80aff1bcbeb07de1198d828498c8178fb613f4cc5ad75" && n32Manifest.unknowns.length === 0 && n32Manifest.source_contracts.length === 8, "N32 manifest not closed");
for (const source of n32Manifest.source_contracts) assert(`N32 source ${source.path}`, digestBytes(fs.readFileSync(repoAbsolute(source.path))) === source.digest, "N32 source drift");
assert("N32 denominator pass", n32Denominator.verdict === "pass" && n32Denominator.receipt_digest === "d004658e0da06c6d0222c827e6d8d61e2c5f38f144ff489a679c186e156d4d58" && n32Denominator.inspected_selectors.length === 8 && n32Denominator.unbound_signal_ids.length === 0 && n32Denominator.missing_detector_inputs.length === 0, "N32 denominator incomplete");
assert("N32 selection fixed point", n32Selection.verdict === "pass" && n32Selection.evidence_state === "design-validator-pass" && n32Selection.fixed_point === true && n32Selection.pass_1_digest === n32Selection.pass_2_digest && n32Selection.pass_1_digest === "b610ce5305f9fbd073f48412b370cd39b7babc566b2ef3dbec638c9d18bb7212" && n32Selection.result_digest === "31330a9e8494de18c739a298c4045f2501d8e848bd9327a21a4401d18c9d1fba", "N32 selection not fixed point");
assert("N32 prefilter binding", digestValue(n32Request) === n32Receipt.requestDigest && n32Receipt.requestDigest === "0127506fe250b88f7bdd240a15807cac38be017e6c4fda147fd126132f8e688d" && n32Receipt.routeOutcome === "gate" && n32Receipt.decisionGateRequired === true, "N32 prefilter binding invalid");
const expectedN32 = ["BMC-REL-NONNUMERIC-32-A-REJECT-DUPLICATE-AUTHORED-PRODUCES", "BMC-REL-NONNUMERIC-32-B-CONDITIONALLY-COALESCE-EXACT-DUPLICATE-AUTHORED-PRODUCES-WITH-PROVENANCE", "BMC-REL-NONNUMERIC-32-C-DEFER", "BMC-REL-NONNUMERIC-32-D-STOP"];
assert("N32 presented options", JSON.stringify(n32Receipt.presentedOptionIds) === JSON.stringify(expectedN32) && n32Receipt.directOptionId === null, "N32 options drifted or selected");
const n32Actions = n32Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N32 action owner gates", n32Actions.length === 2 && n32Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N32 owner gate missing");
assert("N32 rejected overreach", JSON.stringify(n32Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-32-W-TREAT-EVENT-PAYLOAD-EQUALITY-AS-DUPLICATE", "BMC-REL-NONNUMERIC-32-X-COLLAPSE-PRODUCES-AND-EMITS", "BMC-REL-NONNUMERIC-32-Y-SILENT-COALESCE-WITHOUT-PROVENANCE", "BMC-REL-NONNUMERIC-32-Z-SELECT-RUNTIME-NUMERIC-ORDERING-CLOSURE-OR-REPRESENTATION"]), "N32 inadmissible forms drifted");
const n32Architecture = readText(`${n32Root}/ARCHITECTURE-BUNDLE.md`);
assert("N32 six views and null selection", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n32Architecture.includes(heading)) && n32Architecture.includes("Selection: `null`") && n32Architecture.includes("Recommendation: A") && n32Architecture.includes("`authority_effect: none`"), "N32 architecture incomplete or selected");
const n32Examples = readText(`${n32Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N32 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n32Examples.includes(heading)) && n32Examples.includes("`decision_effect: none`") && n32Examples.includes("hypothetical") && n32Examples.includes("Operation --[produces]--> Event") && n32Examples.includes("runtime"), "N32 examples incomplete or reverse produces semantics");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N32 example coverage ${label}`, n32Examples.split(label).length - 1 === 3, "N32 option coverage unequal");
const n32Context = readText(`${n32Root}/DESIGN-CONTEXT.md`);
assert("N32 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n32Context.includes(technique)), "N32 dispatch trace incomplete");
assert("N32 Distill pass", readText(`${n32Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N32 Distill did not pass");
const n32Handoff = readJson(`${n32Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N32 strict handoff", n32Handoff.status === "blocked-at-owner-decision" && n32Handoff.execution_allowed === false && n32Handoff.selected_option === null && n32Handoff.current_decision === n32Receipt.decisionId && n32Handoff.sequenced_event_provenance_verb === "produces" && n32Handoff.authority_effect === "none", "N32 handoff widened authority");
const n32OwnerSelectionPath = `${n32Root}/decisions/BMC-REL-NONNUMERIC-32-OWNER-SELECTION-RECEIPT.json`;
const n32OwnerSelection = readJson(n32OwnerSelectionPath);
assert("N32 immutable owner selection", digestFile(n32OwnerSelectionPath) === "7dd59e72957d75d16e03818a48cad60ccd8a1687cd4bf0e1b2aa7a14b279dc9e", "N32 owner selection receipt changed");
assert("N32 exact A selection", n32OwnerSelection.selection.response === "A" && n32OwnerSelection.selection.selected_option_id === expectedN32[0] && n32OwnerSelection.selection.selected_by === "user", "N32 selection is not exact A/user");
assert("N32 recording timestamp semantics", n32OwnerSelection.selection.exact_response_timestamp_exposed === false && n32OwnerSelection.selection.selection_recorded_at === "2026-08-25T14:12:40+01:00" && n32OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N32 timestamp overstated");
assert("N32 owner selection binding", n32OwnerSelection.admissibility_binding.request_sha256 === digestFile(n32RequestPath) && n32OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n32ReceiptPath) && n32OwnerSelection.admissibility_binding.requestDigest === n32Receipt.requestDigest && n32OwnerSelection.admissibility_binding.hazard_class === "authority" && n32OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N32 selection binding mismatch");
assert("N32 narrow duplicate rejection", n32OwnerSelection.scope_binding.canonical_verb === "produces" && n32OwnerSelection.scope_binding.source_meta_type === "Operation" && n32OwnerSelection.scope_binding.target_meta_type === "Event" && n32OwnerSelection.scope_binding.behavior === "reject-and-repair" && n32OwnerSelection.authorization_boundary.exact_duplicate_produces_authorship_rejected === true && n32OwnerSelection.authorization_boundary.emits_duplicate_policy_selected === false && n32OwnerSelection.authorization_boundary.adjacent_produces_facet_selected === false && n32OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N32 selection scope widened");

const n33ManifestPath = `${n33Root}/DESIGN-SCOPE-MANIFEST.json`;
const n33DenominatorPath = `${n33Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n33SelectionPath = `${n33Root}/DESIGN-SELECTION-RESULT.json`;
const n33RequestPath = `${n33Root}/decisions/BMC-REL-NONNUMERIC-33-OPTION-ADMISSIBILITY-REQUEST.json`;
const n33ReceiptPath = `${n33Root}/decisions/BMC-REL-NONNUMERIC-33-OPTION-PREFILTER-RECEIPT.json`;
const n33Manifest = readJson(n33ManifestPath);
const n33Denominator = readJson(n33DenominatorPath);
const n33Selection = readJson(n33SelectionPath);
const n33Request = readJson(n33RequestPath);
const n33Receipt = readJson(n33ReceiptPath);
assert("N33 manifest closed", digestValue(without(n33Manifest, "input_digest")) === n33Manifest.input_digest && n33Manifest.input_digest === "0e0118a54ae182d923ad76e6e3a0920aba3cc3d5ec96f5f1a454a2166e16f066" && n33Manifest.unknowns.length === 0 && n33Manifest.source_contracts.length === 8, "N33 manifest not closed");
for (const source of n33Manifest.source_contracts) assert(`N33 source ${source.path}`, digestBytes(fs.readFileSync(repoAbsolute(source.path))) === source.digest, "N33 source drift");
assert("N33 denominator pass", n33Denominator.verdict === "pass" && n33Denominator.receipt_digest === "0cf1fe10ab81ee59f52902a86fcd7656917b94404c692f650ea649142a542ff1" && n33Denominator.inspected_selectors.length === 8 && n33Denominator.unbound_signal_ids.length === 0 && n33Denominator.missing_detector_inputs.length === 0, "N33 denominator incomplete");
assert("N33 selection fixed point", n33Selection.verdict === "pass" && n33Selection.evidence_state === "design-validator-pass" && n33Selection.fixed_point === true && n33Selection.pass_1_digest === n33Selection.pass_2_digest && n33Selection.pass_1_digest === "a19932151b104a82de33bb2ca2d678949fd8c599d3f0097caec1602674c61473" && n33Selection.result_digest === "1bac2fa53a271b010f54798597e77be465c7d513ff19882cb71398344274e547", "N33 selection not fixed point");
assert("N33 prefilter binding", digestValue(n33Request) === n33Receipt.requestDigest && n33Receipt.requestDigest === "c6f68f4be7bb77c6125c1305f45bbe251ecae7c894a5a00601595fcbad792817" && n33Receipt.routeOutcome === "gate" && n33Receipt.decisionGateRequired === true, "N33 prefilter binding invalid");
const expectedN33 = ["BMC-REL-NONNUMERIC-33-A-REJECT-DUPLICATE-AUTHORED-EMITS", "BMC-REL-NONNUMERIC-33-B-CONDITIONALLY-COALESCE-EXACT-DUPLICATE-AUTHORED-EMITS-WITH-PROVENANCE", "BMC-REL-NONNUMERIC-33-C-DEFER", "BMC-REL-NONNUMERIC-33-D-STOP"];
assert("N33 presented options", JSON.stringify(n33Receipt.presentedOptionIds) === JSON.stringify(expectedN33) && n33Receipt.directOptionId === null, "N33 options drifted or selected");
const n33Actions = n33Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N33 action owner gates", n33Actions.length === 2 && n33Actions.every((candidate) => candidate.hazardClass === "authority" && candidate.ownerGate === "relationship-decision-owner:owner-decision"), "N33 owner gate missing");
assert("N33 rejected overreach", JSON.stringify(n33Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-33-W-TREAT-EVENT-PAYLOAD-EQUALITY-AS-DUPLICATE", "BMC-REL-NONNUMERIC-33-X-NARROW-EMITS-TO-EVENT-SOURCING", "BMC-REL-NONNUMERIC-33-Y-SILENT-COALESCE-WITHOUT-PROVENANCE", "BMC-REL-NONNUMERIC-33-Z-SELECT-CROSS-VERB-RUNTIME-NUMERIC-ORDERING-CLOSURE-OR-REPRESENTATION"]), "N33 inadmissible forms drifted");
const n33Architecture = readText(`${n33Root}/ARCHITECTURE-BUNDLE.md`);
assert("N33 six views and null selection", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n33Architecture.includes(heading)) && n33Architecture.includes("Selection: `null`") && n33Architecture.includes("Recommendation: A") && n33Architecture.includes("`authority_effect: none`"), "N33 architecture incomplete or selected");
const n33Examples = readText(`${n33Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N33 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n33Examples.includes(heading)) && n33Examples.includes("`decision_effect: none`") && n33Examples.includes("hypothetical") && n33Examples.includes("Entity --[emits]--> Event") && n33Examples.includes("Event Sourcing"), "N33 examples incomplete or narrowed");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N33 example coverage ${label}`, n33Examples.split(label).length - 1 === 3, "N33 option coverage unequal");
const n33Context = readText(`${n33Root}/DESIGN-CONTEXT.md`);
assert("N33 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n33Context.includes(technique)), "N33 dispatch trace incomplete");
assert("N33 Distill pass", readText(`${n33Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N33 Distill did not pass");
const n33Handoff = readJson(`${n33Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N33 strict handoff", n33Handoff.status === "blocked-at-owner-decision" && n33Handoff.execution_allowed === false && n33Handoff.selected_option === null && n33Handoff.current_decision === n33Receipt.decisionId && n33Handoff.authority_effect === "none", "N33 handoff widened authority");
const n33OwnerSelectionPath = `${n33Root}/decisions/BMC-REL-NONNUMERIC-33-OWNER-SELECTION-RECEIPT.json`;
const n33OwnerSelection = readJson(n33OwnerSelectionPath);
assert("N33 immutable owner selection", digestFile(n33OwnerSelectionPath) === "65cce5220a452653ff89ced77e371e622c488b125cefd10aad4919a4c9dd53f2", "N33 owner selection receipt changed");
assert("N33 exact A selection", n33OwnerSelection.selection.response === "A" && n33OwnerSelection.selection.selected_option_id === expectedN33[0] && n33OwnerSelection.selection.selected_by === "user", "N33 selection is not exact A/user");
assert("N33 recording timestamp semantics", n33OwnerSelection.selection.exact_response_timestamp_exposed === false && n33OwnerSelection.selection.selection_recorded_at === "2026-08-25T14:39:26+01:00" && n33OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N33 timestamp overstated");
assert("N33 owner selection binding", n33OwnerSelection.admissibility_binding.request_sha256 === digestFile(n33RequestPath) && n33OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n33ReceiptPath) && n33OwnerSelection.admissibility_binding.requestDigest === n33Receipt.requestDigest && n33OwnerSelection.admissibility_binding.hazard_class === "authority" && n33OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N33 selection binding mismatch");
assert("N33 narrow duplicate rejection", n33OwnerSelection.scope_binding.canonical_verb === "emits" && n33OwnerSelection.scope_binding.source_meta_type === "Entity" && n33OwnerSelection.scope_binding.target_meta_type === "Event" && n33OwnerSelection.scope_binding.behavior === "reject-and-repair" && n33OwnerSelection.authorization_boundary.exact_duplicate_emits_authorship_rejected === true && n33OwnerSelection.authorization_boundary.event_sourcing_narrowing_selected === false && n33OwnerSelection.authorization_boundary.event_payload_or_runtime_occurrence_identity_selected === false && n33OwnerSelection.authorization_boundary.produces_policy_changed === false && n33OwnerSelection.authorization_boundary.adjacent_emits_facet_selected === false && n33OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N33 selection scope widened");
const n34SequencingPath = `${n34Root}/decisions/BMC-REL-NONNUMERIC-34-SUBJECT-SEQUENCING-RECEIPT.json`;
const n34ManifestPath = `${n34Root}/DESIGN-SCOPE-MANIFEST.json`;
const n34DenominatorPath = `${n34Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n34SelectionPath = `${n34Root}/DESIGN-SELECTION-RESULT.json`;
const n34RequestPath = `${n34Root}/decisions/BMC-REL-NONNUMERIC-34-OPTION-ADMISSIBILITY-REQUEST.json`;
const n34ReceiptPath = `${n34Root}/decisions/BMC-REL-NONNUMERIC-34-OPTION-PREFILTER-RECEIPT.json`;
const n34OwnerSelectionPath = `${n34Root}/decisions/BMC-REL-NONNUMERIC-34-OWNER-SELECTION-RECEIPT.json`;
const n34Sequencing = readJson(n34SequencingPath);
const n34Manifest = readJson(n34ManifestPath);
const n34Denominator = readJson(n34DenominatorPath);
const n34Selection = readJson(n34SelectionPath);
const n34Request = readJson(n34RequestPath);
const n34Receipt = readJson(n34ReceiptPath);
const n34OwnerSelection = readJson(n34OwnerSelectionPath);
assert("N34 sequencing immutable bytes", digestFile(n34SequencingPath) === "c5cf601a0257be8efe28f3cfcabaa69372b7e389de1370b5b485e609916c2600", "N34 sequencing receipt changed");
assert("N34 sequencing exact subject only", n34Sequencing.exact_input === "emits + occurrence semantics" && n34Sequencing.selection.relation_id === "emits" && n34Sequencing.selection.facet_id === "occurrence_semantics" && n34Sequencing.selection.selected_by === "user" && n34Sequencing.selection.exact_response_timestamp_exposed === false && n34Sequencing.authority_effect === "none" && n34Sequencing.does_not_select.some((item) => item.includes("any N34 action")), "N34 sequencing widened or selected behavior");
assert("N34 sequencing prior bindings", n34Sequencing.bindings.prior_n33_owner_selection_receipt_sha256 === digestFile(n33OwnerSelectionPath) && n34Sequencing.bindings.prior_design_closeout_sha256 === "96c10ce11b956029669e66eea95a2c627dc9ce24528e307935619a485bbbe3e8" && n34Sequencing.bindings.prior_design_validation_sha256 === "0f917dae1aeeda91bd21b39521ae529931c92ae8c610cbd74a89cff4b107b818", "N34 sequencing evidence mismatch");
assert("N34 manifest closed", digestValue(without(n34Manifest, "input_digest")) === n34Manifest.input_digest && n34Manifest.input_digest === "e61f91e5409ba808f91b3b5e51f02f5e526f708297f5ad9cc2cd9e25999c366b" && n34Manifest.unknowns.length === 0 && n34Manifest.source_contracts.length === 8, "N34 manifest not closed");
for (const source of n34Manifest.source_contracts) assert(`N34 source ${source.path}`, digestBytes(fs.readFileSync(repoAbsolute(source.path))) === source.digest, "N34 source drift");
assert("N34 denominator pass", n34Denominator.verdict === "pass" && n34Denominator.receipt_digest === "3f8066f7430f39bdb571464ef72e22712ad4ce1baedb2da94c00e2741f9a1389" && n34Denominator.inspected_selectors.length === 8 && n34Denominator.unbound_signal_ids.length === 0 && n34Denominator.missing_detector_inputs.length === 0, "N34 denominator incomplete");
assert("N34 selection fixed point", n34Selection.verdict === "pass" && n34Selection.evidence_state === "design-validator-pass" && n34Selection.fixed_point === true && n34Selection.pass_1_digest === n34Selection.pass_2_digest && n34Selection.pass_1_digest === "f66d923c12a0909b942f99849e2bfae17fdac2eca86f22c1da7ce2dc9d1ab29a" && n34Selection.result_digest === "8a972c7a7ca04b2d09b6e5b363d16b2fc8c6019873009065f7a3db9a88633728", "N34 selection not fixed point");
assert("N34 prefilter binding", digestValue(n34Request) === n34Receipt.requestDigest && n34Receipt.requestDigest === "058cf45649733ba04c66515bcab3180b7baccf1e98cd7a77332d4f9dc12f944c" && n34Receipt.routeOutcome === "gate" && n34Receipt.decisionGateRequired === true, "N34 prefilter binding invalid");
const expectedN34 = ["BMC-REL-NONNUMERIC-34-A-RETAIN-CONCEPT-LEVEL-AUTHORED-EMITS-SEMANTICS", "BMC-REL-NONNUMERIC-34-B-DEFER", "BMC-REL-NONNUMERIC-34-C-STOP"];
assert("N34 A defer stop cardinality regression", JSON.stringify(n34Receipt.admissibleOptionIds) === JSON.stringify(expectedN34) && JSON.stringify(n34Receipt.presentedOptionIds) === JSON.stringify(expectedN34) && n34Receipt.directOptionId === null && n34Receipt.routeOutcome === "gate", "N34 action/defer/stop cardinality or route regressed");
const n34Actions = n34Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N34 action owner gate", n34Actions.length === 1 && n34Actions[0].hazardClass === "authority" && n34Actions[0].ownerGate === "relationship-decision-owner:owner-decision", "N34 action owner gate missing");
assert("N34 rejected unsupported shapes", JSON.stringify(n34Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-34-W-TREAT-RUNTIME-EVENT-OCCURRENCES-AS-CANONICAL-EMITS-OCCURRENCES", "BMC-REL-NONNUMERIC-34-X-SELECT-CONCEPT-AND-RUNTIME-WITH-SEPARATE-BOUNDS", "BMC-REL-NONNUMERIC-34-Y-INVENT-DECLARED-EMISSION-OCCURRENCE-AXIS", "BMC-REL-NONNUMERIC-34-Z-REUSE-RELATION-SPECIFIC-OCCURRENCE-TOKENS-OR-BUNDLE-ADJACENT-SEMANTICS"]), "N34 inadmissible forms drifted");
const n34Architecture = readText(`${n34Root}/ARCHITECTURE-BUNDLE.md`);
assert("N34 six views and null selection", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n34Architecture.includes(heading)) && n34Architecture.includes("Selection: `null`") && n34Architecture.includes("Recommendation: A") && n34Architecture.includes("`authority_effect: none`"), "N34 architecture incomplete or selected");
const n34Examples = readText(`${n34Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N34 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n34Examples.includes(heading)) && n34Examples.includes("`decision_effect: none`") && n34Examples.includes("hypothetical") && n34Examples.includes("Explain standing choice"), "N34 examples incomplete or imply selection");
for (const label of ["**A", "**B", "**C"]) assert(`N34 example coverage ${label}`, n34Examples.split(label).length - 1 === 3, "N34 option coverage unequal");
const n34Context = readText(`${n34Root}/DESIGN-CONTEXT.md`);
assert("N34 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n34Context.includes(technique)), "N34 dispatch trace incomplete");
assert("N34 Distill pass", readText(`${n34Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N34 Distill did not pass");
const n34Handoff = readJson(`${n34Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N34 strict handoff", n34Handoff.status === "blocked-at-owner-decision" && n34Handoff.execution_allowed === false && n34Handoff.selected_option === null && n34Handoff.current_decision === n34Receipt.decisionId && JSON.stringify(n34Handoff.presented_options) === JSON.stringify(expectedN34) && n34Handoff.standing_context_option === "Explain / more context" && n34Handoff.authority_effect === "none", "N34 handoff widened authority");
assert("N34 immutable owner selection", digestFile(n34OwnerSelectionPath) === "c71fe6c6280836b146bfe1b1aec2f4c586e31927f64dc496eb0c609349c27dc0", "N34 owner selection receipt changed");
assert("N34 exact A selection", n34OwnerSelection.selection.response === "A" && n34OwnerSelection.selection.selected_option_id === expectedN34[0] && n34OwnerSelection.selection.selected_by === "user", "N34 selection is not exact A/user");
assert("N34 recording timestamp semantics", n34OwnerSelection.selection.exact_response_timestamp_exposed === false && n34OwnerSelection.selection.selection_recorded_at === "2026-08-25T15:54:37+01:00" && n34OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N34 timestamp overstated");
assert("N34 owner selection binding", n34OwnerSelection.admissibility_binding.request_sha256 === digestFile(n34RequestPath) && n34OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n34ReceiptPath) && n34OwnerSelection.admissibility_binding.requestDigest === n34Receipt.requestDigest && n34OwnerSelection.admissibility_binding.hazard_class === "authority" && n34OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N34 selection binding mismatch");
assert("N34 narrow concept-fact effect", n34OwnerSelection.scope_binding.canonical_verb === "emits" && n34OwnerSelection.scope_binding.source_meta_type === "Entity" && n34OwnerSelection.scope_binding.target_meta_type === "Event" && n34OwnerSelection.scope_binding.occurrence_unit === "authored-canonical-concept-fact" && n34OwnerSelection.scope_binding.runtime_event_occurrences_in_scope === false && n34OwnerSelection.authorization_boundary.emits_occurrence_semantics_selected === true && n34OwnerSelection.authorization_boundary.concept_level_authored_fact_only === true && n34OwnerSelection.authorization_boundary.n35_or_later_owner_choice_made === false && n34OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N34 selection scope widened");
const n35SequencingPath = `${n35Root}/decisions/BMC-REL-NONNUMERIC-35-SUBJECT-SEQUENCING-RECEIPT.json`;
const n35ManifestPath = `${n35Root}/DESIGN-SCOPE-MANIFEST.json`;
const n35DenominatorPath = `${n35Root}/DESIGN-DENOMINATOR-RECEIPT.json`;
const n35SelectionPath = `${n35Root}/DESIGN-SELECTION-RESULT.json`;
const n35RequestPath = `${n35Root}/decisions/BMC-REL-NONNUMERIC-35-OPTION-ADMISSIBILITY-REQUEST.json`;
const n35ReceiptPath = `${n35Root}/decisions/BMC-REL-NONNUMERIC-35-OPTION-PREFILTER-RECEIPT.json`;
const n35OwnerSelectionPath = `${n35Root}/decisions/BMC-REL-NONNUMERIC-35-OWNER-SELECTION-RECEIPT.json`;
const n35Sequencing = readJson(n35SequencingPath);
const n35Manifest = readJson(n35ManifestPath);
const n35Denominator = readJson(n35DenominatorPath);
const n35Selection = readJson(n35SelectionPath);
const n35Request = readJson(n35RequestPath);
const n35Receipt = readJson(n35ReceiptPath);
const n35OwnerSelection = readJson(n35OwnerSelectionPath);
assert("N35 sequencing immutable bytes", digestFile(n35SequencingPath) === "107ed83b9a3ee0128f66bb8bf0cf936a39ecd4d2a8a40299fa1d1006844ba9d1", "N35 sequencing receipt changed");
assert("N35 sequencing exact subject only", n35Sequencing.exact_input === "emits + ordering" && n35Sequencing.selection.relation_id === "emits" && n35Sequencing.selection.facet_id === "ordering" && n35Sequencing.selection.selected_by === "user" && n35Sequencing.selection.exact_response_timestamp_exposed === false && n35Sequencing.selection.selection_recorded_at === "2026-08-25T16:33:34+01:00" && n35Sequencing.selection.recording_time_note.includes("not a transport-provided response timestamp") && n35Sequencing.authority_effect === "none" && n35Sequencing.does_not_select.some((item) => item.includes("any N35 action")), "N35 sequencing widened or selected behavior");
assert("N35 sequencing prior bindings", n35Sequencing.bindings.prior_n34_owner_selection_receipt_sha256 === digestFile(n34OwnerSelectionPath) && n35Sequencing.bindings.prior_design_closeout_sha256 === "21043067ba463304406399b35feb6a929cb7f76ac309cc72acaddf3eacbb9f8c" && n35Sequencing.bindings.prior_design_validation_sha256 === "92e2e4afd71b9aae117706b80b4ec7ebb4dc34fa626ef155203178c60a71bb9d", "N35 sequencing evidence mismatch");
assert("N35 manifest closed", digestValue(without(n35Manifest, "input_digest")) === n35Manifest.input_digest && n35Manifest.input_digest === "93f5e05435ca002ed9b78a2bce4444affad265351d99480cf71b6e08571a3612" && n35Manifest.unknowns.length === 0 && n35Manifest.source_contracts.length === 8, "N35 manifest not closed");
for (const source of n35Manifest.source_contracts) assert(`N35 source ${source.path}`, digestBytes(fs.readFileSync(repoAbsolute(source.path))) === source.digest, "N35 source drift");
assert("N35 denominator pass", n35Denominator.verdict === "pass" && n35Denominator.receipt_digest === "b8ac71522366e13b58df356a934f3460199a57f99202ed6a1977d32ff1bba896" && n35Denominator.inspected_selectors.length === 8 && n35Denominator.unbound_signal_ids.length === 0 && n35Denominator.missing_detector_inputs.length === 0, "N35 denominator incomplete");
assert("N35 selection fixed point", n35Selection.verdict === "pass" && n35Selection.evidence_state === "design-validator-pass" && n35Selection.fixed_point === true && n35Selection.pass_1_digest === n35Selection.pass_2_digest && n35Selection.pass_1_digest === "a43210f0e9f9cddce5ded49c8a3d8f1b04fc8c2e2a9b0536e74d2f3479f58034" && n35Selection.result_digest === "04601dfbf0af5e55faf20abe182263fba6d8a6bb867e1cd0690dc46b3790ecc1", "N35 selection not fixed point");
assert("N35 prefilter binding", digestValue(n35Request) === n35Receipt.requestDigest && n35Receipt.requestDigest === "91c503e4210ea7803b6369cc2510acf119708e35c7c61541ae5ed838c55bfda7" && n35Receipt.routeOutcome === "gate" && n35Receipt.decisionGateRequired === true, "N35 prefilter binding invalid");
const expectedN35 = ["BMC-REL-NONNUMERIC-35-A-ORDERING-NOT-APPLICABLE-TO-AUTHORED-EMITS-FACTS", "BMC-REL-NONNUMERIC-35-B-DEFER", "BMC-REL-NONNUMERIC-35-C-STOP"];
assert("N35 A defer stop cardinality regression", JSON.stringify(n35Receipt.admissibleOptionIds) === JSON.stringify(expectedN35) && JSON.stringify(n35Receipt.presentedOptionIds) === JSON.stringify(expectedN35) && n35Receipt.directOptionId === null && n35Receipt.routeOutcome === "gate", "N35 action/defer/stop cardinality or route regressed");
const n35Actions = n35Request.candidates.filter((candidate) => candidate.structuralStatus === "admissible" && candidate.optionKind === "action");
assert("N35 action owner gate", n35Actions.length === 1 && n35Actions[0].optionId === expectedN35[0] && n35Actions[0].hazardClass === "authority" && n35Actions[0].ownerGate === "relationship-decision-owner:owner-decision", "N35 action owner gate missing");
assert("N35 no enum as authority regression", !n35Receipt.presentedOptionIds.some((optionId) => optionId.includes("UNORDERED") || optionId.includes("ORDERED-WITHOUT")) && n35Receipt.rejectedOptions.some((item) => item.optionId === "BMC-REL-NONNUMERIC-35-X-LABEL-EMITS-UNORDERED-WITHOUT-DISTINCT-SET-CONSEQUENCE" && item.reasons.some((reason) => reason.includes("no source-backed observable consequence"))) && n35Request.candidates.some((candidate) => candidate.optionId === "BMC-REL-NONNUMERIC-35-W-TREAT-EMITS-AS-ORDERED-WITHOUT-AUTHORED-ORDER-IDENTITY" && candidate.structuralStatus === "inadmissible"), "N35 generic enum was treated as semantic authority");
assert("N35 rejected unsupported shapes", JSON.stringify(n35Receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(["BMC-REL-NONNUMERIC-35-W-TREAT-EMITS-AS-ORDERED-WITHOUT-AUTHORED-ORDER-IDENTITY", "BMC-REL-NONNUMERIC-35-X-LABEL-EMITS-UNORDERED-WITHOUT-DISTINCT-SET-CONSEQUENCE", "BMC-REL-NONNUMERIC-35-Y-DERIVE-ORDER-FROM-SOURCE-ARRAY-RUNTIME-OR-PAYLOAD", "BMC-REL-NONNUMERIC-35-Z-REUSE-D04-D05-N34-TOKENS-OR-BUNDLE-ADJACENT-SEMANTICS"]), "N35 inadmissible forms drifted");
const n35Architecture = readText(`${n35Root}/ARCHITECTURE-BUNDLE.md`);
assert("N35 six views and null selection", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n35Architecture.includes(heading)) && n35Architecture.includes("Selection: `null`") && n35Architecture.includes("Recommendation: A") && n35Architecture.includes("`authority_effect: none`"), "N35 architecture incomplete or selected");
const n35Examples = readText(`${n35Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N35 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n35Examples.includes(heading)) && n35Examples.includes("`decision_effect: none`") && n35Examples.includes("hypothetical") && n35Examples.includes("Explain standing choice"), "N35 examples incomplete or imply selection");
for (const label of ["**A", "**B", "**C"]) assert(`N35 example coverage ${label}`, n35Examples.split(label).length - 1 === 3, "N35 option coverage unequal");
const n35Context = readText(`${n35Root}/DESIGN-CONTEXT.md`);
assert("N35 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n35Context.includes(technique)), "N35 dispatch trace incomplete");
assert("N35 distinct consequence explanation", n35Context.includes("no distinct validator or generator consequence") && n35Context.includes("D27") && n35Context.includes("manufacture a binary") && n35Context.includes("policy"), "N35 unordered/not-applicable distinction is not explicit");
assert("N35 Distill pass", readText(`${n35Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N35 Distill did not pass");
const n35Handoff = readJson(`${n35Root}/evidence/RUNTIME-HANDOFF.json`);
assert("N35 strict handoff", n35Handoff.status === "blocked-at-owner-decision" && n35Handoff.execution_allowed === false && n35Handoff.selected_option === null && n35Handoff.current_decision === n35Receipt.decisionId && JSON.stringify(n35Handoff.presented_options) === JSON.stringify(expectedN35) && n35Handoff.standing_context_option === "Explain / more context" && n35Handoff.authority_effect === "none", "N35 handoff widened authority");
assert("N35 immutable owner selection bytes", digestFile(n35OwnerSelectionPath) === "85a7902c50fb998d35e6e5e5307c3aa36b89b3a3f21702a6f8639ed0e87c7d74", "N35 owner selection receipt changed");
assert("N35 owner selection exact A and recording semantics", n35OwnerSelection.selection.response === "A" && n35OwnerSelection.selection.selected_option_id === expectedN35[0] && n35OwnerSelection.selection.selected_by === "user" && n35OwnerSelection.selection.exact_response_timestamp_exposed === false && n35OwnerSelection.selection.selection_recorded_at === "2026-08-25T17:03:38+01:00" && n35OwnerSelection.selection.recording_time_note.includes("not a transport-provided response timestamp"), "N35 owner selection identity or time semantics drifted");
assert("N35 owner selection admissibility binding", n35OwnerSelection.admissibility_binding.request_sha256 === digestFile(n35RequestPath) && n35OwnerSelection.admissibility_binding.receipt_sha256 === digestFile(n35ReceiptPath) && n35OwnerSelection.admissibility_binding.requestDigest === n35Receipt.requestDigest && n35OwnerSelection.admissibility_binding.route_outcome === "gate" && n35OwnerSelection.admissibility_binding.selected_option_admitted === true && n35OwnerSelection.admissibility_binding.selected_option_presented === true && n35OwnerSelection.admissibility_binding.hazard_class === "authority" && n35OwnerSelection.admissibility_binding.owner_gate === "relationship-decision-owner:owner-decision", "N35 owner selection gate binding mismatch");
assert("N35 exact Design-only not-applicable effect", n35OwnerSelection.scope_binding.canonical_verb === "emits" && n35OwnerSelection.scope_binding.source_meta_type === "Entity" && n35OwnerSelection.scope_binding.target_meta_type === "Event" && n35OwnerSelection.scope_binding.facet === "ordering" && n35OwnerSelection.scope_binding.selected_value === "not-applicable" && n35OwnerSelection.scope_binding.authored_order_identity_present === false && n35OwnerSelection.authorization_boundary.emits_ordering_selected === true && n35OwnerSelection.authorization_boundary.packet_mutation_authorized === false && n35OwnerSelection.authorization_boundary.repository_authority_effect === "none", "N35 selected effect widened");
assert("post-N35 no inferred N36 regression", decisionLog.includes("`numeric_bounds`, `closure`, `multi_endpoint_semantics`") && decisionLog.includes("`partial_view`, `representation`, `runtime_cardinality`") && decisionLog.includes("`compatibility_token`") && decisionLog.includes("Canonical inverse kind `none`") && decisionLog.includes("No N36 gate is formed"), "post-N35 sequencing residue or no-gate boundary missing");
const architecture = readText(`${n03Root}/ARCHITECTURE-BUNDLE.md`);
assert("N03 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => architecture.includes(heading)), "six-view bundle incomplete");
assert("N03 architecture null selection", architecture.includes("Selection: `null`") && architecture.includes("`authority_effect: none`"), "architecture implies a decision");
const examples = readText(`${n03Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N03 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => examples.includes(heading)), "example rung missing");
assert("N03 examples decision effect none", examples.includes("`decision_effect: none`") && examples.includes("## Coverage"), "examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N03 example coverage ${label}`, examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n04Architecture = readText(`${n04Root}/ARCHITECTURE-BUNDLE.md`);
assert("N04 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n04Architecture.includes(heading)), "N04 six-view bundle incomplete");
assert("N04 architecture null selection", n04Architecture.includes("Selection: `null`") && n04Architecture.includes("`authority_effect: none`"), "N04 architecture implies a decision");
assert("N04 topology boundary", n04Architecture.includes("two or more distinct") && n04Architecture.includes("transitivity") && n04Architecture.includes("existence"), "N04 boundary incomplete");
const n04Examples = readText(`${n04Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N04 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n04Examples.includes(heading)), "N04 example rung missing");
assert("N04 examples decision effect none", n04Examples.includes("`decision_effect: none`") && n04Examples.includes("## Coverage"), "N04 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N04 example coverage ${label}`, n04Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n04Context = readText(`${n04Root}/DESIGN-CONTEXT.md`);
assert("N04 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n04Context.includes(technique)), "N04 dispatch trace incomplete");
assert("N04 Distill pass", readText(`${n04Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N04 Distill did not pass");
const n05Architecture = readText(`${n05Root}/ARCHITECTURE-BUNDLE.md`);
assert("N05 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n05Architecture.includes(heading)), "N05 six-view bundle incomplete");
assert("N05 architecture null selection", n05Architecture.includes("Selection: `null`") && n05Architecture.includes("`authority_effect: none`"), "N05 architecture implies a decision");
assert("N05 behavior boundary", n05Architecture.includes("Neither option") && n05Architecture.includes("accepts or rejects any cycle") && n05Architecture.includes("mixed-dimension"), "N05 behavior boundary incomplete");
const n05Examples = readText(`${n05Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N05 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n05Examples.includes(heading)), "N05 example rung missing");
assert("N05 examples decision effect none", n05Examples.includes("`decision_effect: none`") && n05Examples.includes("## Coverage"), "N05 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N05 example coverage ${label}`, n05Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n05Context = readText(`${n05Root}/DESIGN-CONTEXT.md`);
assert("N05 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n05Context.includes(technique)), "N05 dispatch trace incomplete");
assert("N05 Distill pass", readText(`${n05Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N05 Distill did not pass");
const n06Architecture = readText(`${n06Root}/ARCHITECTURE-BUNDLE.md`);
assert("N06 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n06Architecture.includes(heading)), "N06 six-view bundle incomplete");
assert("N06 architecture null selection", n06Architecture.includes("Selection: `null`") && n06Architecture.includes("`authority_effect: none`"), "N06 architecture implies a decision");
assert("N06 boundary", n06Architecture.includes("same-dimension") && n06Architecture.includes("two or more distinct") && n06Architecture.includes("mixed-dimension") && n06Architecture.includes("conditional exception"), "N06 boundary incomplete");
const n06Examples = readText(`${n06Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N06 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n06Examples.includes(heading)), "N06 example rung missing");
assert("N06 examples decision effect none", n06Examples.includes("`decision_effect: none`") && n06Examples.includes("## Coverage"), "N06 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N06 example coverage ${label}`, n06Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n06Context = readText(`${n06Root}/DESIGN-CONTEXT.md`);
assert("N06 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n06Context.includes(technique)), "N06 dispatch trace incomplete");
assert("N06 Distill pass", readText(`${n06Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N06 Distill did not pass");
const n07Architecture = readText(`${n07Root}/ARCHITECTURE-BUNDLE.md`);
assert("N07 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n07Architecture.includes(heading)), "N07 six-view bundle incomplete");
assert("N07 architecture null selection", n07Architecture.includes("Selection: `null`") && n07Architecture.includes("`authority_effect: none`"), "N07 architecture implies a decision");
assert("N07 boundary", n07Architecture.includes("mixed-dimension") && n07Architecture.includes("pairwise non-overlapping") && n07Architecture.includes("same-dimension") && n07Architecture.includes("transitivity"), "N07 boundary incomplete");
const n07Examples = readText(`${n07Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N07 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n07Examples.includes(heading)), "N07 example rung missing");
assert("N07 examples decision effect none", n07Examples.includes("`decision_effect: none`") && n07Examples.includes("## Coverage"), "N07 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N07 example coverage ${label}`, n07Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n07Context = readText(`${n07Root}/DESIGN-CONTEXT.md`);
assert("N07 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n07Context.includes(technique)), "N07 dispatch trace incomplete");
assert("N07 Distill pass", readText(`${n07Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N07 Distill did not pass");
const n08Architecture = readText(`${n08Root}/ARCHITECTURE-BUNDLE.md`);
assert("N08 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n08Architecture.includes(heading)), "N08 six-view bundle incomplete");
assert("N08 architecture null selection", n08Architecture.includes("Selection: `null`") && n08Architecture.includes("`authority_effect: none`"), "N08 architecture implies a decision");
assert("N08 boundary", n08Architecture.includes("different dimension") && n08Architecture.includes("different owner") && n08Architecture.includes("provenance") && n08Architecture.includes("runtime"), "N08 boundary incomplete");
const n08Examples = readText(`${n08Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N08 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n08Examples.includes(heading)), "N08 example rung missing");
assert("N08 examples decision effect none", n08Examples.includes("`decision_effect: none`") && n08Examples.includes("## Coverage"), "N08 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N08 example coverage ${label}`, n08Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n08Context = readText(`${n08Root}/DESIGN-CONTEXT.md`);
assert("N08 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n08Context.includes(technique)), "N08 dispatch trace incomplete");
assert("N08 Distill pass", readText(`${n08Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N08 Distill did not pass");
const n09Architecture = readText(`${n09Root}/ARCHITECTURE-BUNDLE.md`);
assert("N09 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n09Architecture.includes(heading)), "N09 six-view bundle incomplete");
assert("N09 architecture null selection", n09Architecture.includes("Selection: `null`") && n09Architecture.includes("`authority_effect: none`"), "N09 architecture implies a decision");
assert("N09 boundary", n09Architecture.includes("generated") && n09Architecture.includes("dimension") && n09Architecture.includes("materialization") && n09Architecture.includes("canonical mutation"), "N09 boundary incomplete");
const n09Examples = readText(`${n09Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N09 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n09Examples.includes(heading)), "N09 example rung missing");
assert("N09 examples decision effect none", n09Examples.includes("`decision_effect: none`") && n09Examples.includes("## Coverage"), "N09 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) {
  assert(`N09 example coverage ${label}`, n09Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
}
const n09Context = readText(`${n09Root}/DESIGN-CONTEXT.md`);
assert("N09 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n09Context.includes(technique)), "N09 dispatch trace incomplete");
assert("N09 Distill pass", readText(`${n09Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N09 Distill did not pass");
const n10Architecture = readText(`${n10Root}/ARCHITECTURE-BUNDLE.md`);
assert("N10 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n10Architecture.includes(heading)), "N10 six-view bundle incomplete");
assert("N10 architecture null selection", n10Architecture.includes("Selection: `null`") && n10Architecture.includes("`authority_effect: none`"), "N10 architecture implies a decision");
assert("N10 boundary", n10Architecture.includes("provenance") && n10Architecture.includes("drift") && n10Architecture.includes("storage technology") && n10Architecture.includes("canonical mutation"), "N10 boundary incomplete");
const n10Examples = readText(`${n10Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N10 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n10Examples.includes(heading)), "N10 example rung missing");
assert("N10 examples decision effect none", n10Examples.includes("`decision_effect: none`") && n10Examples.includes("## Coverage"), "N10 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N10 example coverage ${label}`, n10Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n10Context = readText(`${n10Root}/DESIGN-CONTEXT.md`);
assert("N10 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n10Context.includes(technique)), "N10 dispatch trace incomplete");
assert("N10 Distill pass", readText(`${n10Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N10 Distill did not pass");
const n11Architecture = readText(`${n11Root}/ARCHITECTURE-BUNDLE.md`);
assert("N11 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n11Architecture.includes(heading)), "N11 six-view bundle incomplete");
assert("N11 architecture null selection", n11Architecture.includes("Selection: `null`") && n11Architecture.includes("`authority_effect: none`"), "N11 architecture implies a decision");
assert("N11 boundary", n11Architecture.includes("observed subgraph") && n11Architecture.includes("global acyclicity") && n11Architecture.includes("closure proof shape") && n11Architecture.includes("observed prohibited cycle"), "N11 boundary incomplete");
const n11Examples = readText(`${n11Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N11 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n11Examples.includes(heading)), "N11 example rung missing");
assert("N11 examples decision effect none", n11Examples.includes("`decision_effect: none`") && n11Examples.includes("## Coverage"), "N11 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N11 example coverage ${label}`, n11Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n11Context = readText(`${n11Root}/DESIGN-CONTEXT.md`);
assert("N11 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n11Context.includes(technique)), "N11 dispatch trace incomplete");
assert("N11 duplicate response isolation", n11Context.includes("without using either confirming `A` response for\nthis unseen gate"), "N10 duplicate response leaked into N11");
assert("N11 Distill pass", readText(`${n11Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N11 Distill did not pass");
const n12Architecture = readText(`${n12Root}/ARCHITECTURE-BUNDLE.md`);
assert("N12 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n12Architecture.includes(heading)), "N12 six-view bundle incomplete");
assert("N12 architecture null selection", n12Architecture.includes("Selection: `null`") && n12Architecture.includes("`authority_effect: none`"), "N12 architecture implies a decision");
assert("N12 proof boundary", n12Architecture.includes("population") && n12Architecture.includes("outgoing") && n12Architecture.includes("incoming") && n12Architecture.includes("closure representation") && n12Architecture.includes("per-dimension closure metadata"), "N12 proof boundary incomplete");
const n12Examples = readText(`${n12Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N12 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n12Examples.includes(heading)), "N12 example rung missing");
assert("N12 examples decision effect none", n12Examples.includes("`decision_effect: none`") && n12Examples.includes("## Coverage"), "N12 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N12 example coverage ${label}`, n12Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n12Context = readText(`${n12Root}/DESIGN-CONTEXT.md`);
assert("N12 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n12Context.includes(technique)), "N12 dispatch trace incomplete");
assert("N12 Distill pass", readText(`${n12Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N12 Distill did not pass");
const n13Architecture = readText(`${n13Root}/ARCHITECTURE-BUNDLE.md`);
assert("N13 six views", ["## 1. Context View", "## 2. High-Level Structure View", "## 3. Low-Level Components View", "## 4. Workflow Process View", "## 5. Decision Flow View", "## 6. Dependency Interface View"].every((heading) => n13Architecture.includes(heading)), "N13 six-view bundle incomplete");
assert("N13 architecture null selection", n13Architecture.includes("Selection: `null`") && n13Architecture.includes("`authority_effect: none`"), "N13 architecture implies a decision");
assert("N13 governance boundary", n13Architecture.includes("uniform") && n13Architecture.includes("per admitted dimension") && n13Architecture.includes("No transitive result exists yet") && n13Architecture.includes("mixed-dimension"), "N13 governance boundary incomplete");
const n13Examples = readText(`${n13Root}/DESIGN-DECISION-EXAMPLES.md`);
assert("N13 complexity ladder", ["Low Complexity", "Medium Complexity", "Complex"].every((heading) => n13Examples.includes(heading)), "N13 example rung missing");
assert("N13 examples decision effect none", n13Examples.includes("`decision_effect: none`") && n13Examples.includes("## Coverage"), "N13 examples imply selection");
for (const label of ["**A", "**B", "**C", "**D"]) assert(`N13 example coverage ${label}`, n13Examples.split(label).length - 1 === 3, `${label} not covered exactly once per rung`);
const n13Context = readText(`${n13Root}/DESIGN-CONTEXT.md`);
assert("N13 dispatch trace", ["sequence", "owner_boundary_check", "residue_ledger", "artifact_contract_bridge", "concrete_path_evidence", "validation_loop", "frame_handoff"].every((technique) => n13Context.includes(technique)), "N13 dispatch trace incomplete");
assert("N13 Distill pass", readText(`${n13Root}/DESIGN-DISTILL-VALIDATION.md`).includes("Unit selection: `pass`"), "N13 Distill did not pass");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bmc-rel-n03-design-"));
try {
  const replayDenominator = path.join(temp, "denominator.json");
  const replaySelection = path.join(temp, "selection.json");
  const replayPrefilter = path.join(temp, "prefilter.json");
  run("N03 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), repoAbsolute(`projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/${manifestPath}`), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:orchestrates-duplicate-authorship", "--output", replayDenominator]);
  assert("N03 extractor byte identity", fs.readFileSync(replayDenominator).equals(fs.readFileSync(absolute(denominatorPath))), "extractor replay differs");
  run("N03 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), repoAbsolute(`projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/${manifestPath}`), replayDenominator, "--authored-concerns", absolute(`${n03Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n03Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", replaySelection]);
  assert("N03 selector byte identity", fs.readFileSync(replaySelection).equals(fs.readFileSync(absolute(selectionPath))), "selector replay differs");
  run("N03 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n03RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", replayPrefilter]);
  assert("N03 prefilter byte identity", fs.readFileSync(replayPrefilter).equals(fs.readFileSync(absolute(n03ReceiptPath))), "prefilter replay differs");

  const n04ReplayDenominator = path.join(temp, "n04-denominator.json");
  const n04ReplaySelection = path.join(temp, "n04-selection.json");
  const n04ReplayPrefilter = path.join(temp, "n04-prefilter.json");
  run("N04 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n04ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-self-edge-policy", "--output", n04ReplayDenominator]);
  assert("N04 extractor byte identity", fs.readFileSync(n04ReplayDenominator).equals(fs.readFileSync(absolute(n04DenominatorPath))), "N04 extractor replay differs");
  run("N04 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n04ManifestPath), n04ReplayDenominator, "--authored-concerns", absolute(`${n04Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n04Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n04ReplaySelection]);
  assert("N04 selector byte identity", fs.readFileSync(n04ReplaySelection).equals(fs.readFileSync(absolute(n04SelectionPath))), "N04 selector replay differs");
  run("N04 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n04RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n04ReplayPrefilter]);
  assert("N04 prefilter byte identity", fs.readFileSync(n04ReplayPrefilter).equals(fs.readFileSync(absolute(n04ReceiptPath))), "N04 prefilter replay differs");

  const n05ReplayDenominator = path.join(temp, "n05-denominator.json");
  const n05ReplaySelection = path.join(temp, "n05-selection.json");
  const n05ReplayPrefilter = path.join(temp, "n05-prefilter.json");
  run("N05 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n05ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-cycle-policy-governance", "--output", n05ReplayDenominator]);
  assert("N05 extractor byte identity", fs.readFileSync(n05ReplayDenominator).equals(fs.readFileSync(absolute(n05DenominatorPath))), "N05 extractor replay differs");
  run("N05 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n05ManifestPath), n05ReplayDenominator, "--authored-concerns", absolute(`${n05Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n05Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n05ReplaySelection]);
  assert("N05 selector byte identity", fs.readFileSync(n05ReplaySelection).equals(fs.readFileSync(absolute(n05SelectionPath))), "N05 selector replay differs");
  run("N05 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n05RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n05ReplayPrefilter]);
  assert("N05 prefilter byte identity", fs.readFileSync(n05ReplayPrefilter).equals(fs.readFileSync(absolute(n05ReceiptPath))), "N05 prefilter replay differs");

  const n06ReplayDenominator = path.join(temp, "n06-denominator.json");
  const n06ReplaySelection = path.join(temp, "n06-selection.json");
  const n06ReplayPrefilter = path.join(temp, "n06-prefilter.json");
  run("N06 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n06ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-uniform-longer-cycle-behavior", "--output", n06ReplayDenominator]);
  assert("N06 extractor byte identity", fs.readFileSync(n06ReplayDenominator).equals(fs.readFileSync(absolute(n06DenominatorPath))), "N06 extractor replay differs");
  run("N06 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n06ManifestPath), n06ReplayDenominator, "--authored-concerns", absolute(`${n06Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n06Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n06ReplaySelection]);
  assert("N06 selector byte identity", fs.readFileSync(n06ReplaySelection).equals(fs.readFileSync(absolute(n06SelectionPath))), "N06 selector replay differs");
  run("N06 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n06RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n06ReplayPrefilter]);
  assert("N06 prefilter byte identity", fs.readFileSync(n06ReplayPrefilter).equals(fs.readFileSync(absolute(n06ReceiptPath))), "N06 prefilter replay differs");

  const n07ReplayDenominator = path.join(temp, "n07-denominator.json");
  const n07ReplaySelection = path.join(temp, "n07-selection.json");
  const n07ReplayPrefilter = path.join(temp, "n07-prefilter.json");
  run("N07 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n07ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-mixed-dimension-closed-path-behavior", "--output", n07ReplayDenominator]);
  assert("N07 extractor byte identity", fs.readFileSync(n07ReplayDenominator).equals(fs.readFileSync(absolute(n07DenominatorPath))), "N07 extractor replay differs");
  run("N07 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n07ManifestPath), n07ReplayDenominator, "--authored-concerns", absolute(`${n07Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n07Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n07ReplaySelection]);
  assert("N07 selector byte identity", fs.readFileSync(n07ReplaySelection).equals(fs.readFileSync(absolute(n07SelectionPath))), "N07 selector replay differs");
  run("N07 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n07RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n07ReplayPrefilter]);
  assert("N07 prefilter byte identity", fs.readFileSync(n07ReplayPrefilter).equals(fs.readFileSync(absolute(n07ReceiptPath))), "N07 prefilter replay differs");

  const n08ReplayDenominator = path.join(temp, "n08-denominator.json");
  const n08ReplaySelection = path.join(temp, "n08-selection.json");
  const n08ReplayPrefilter = path.join(temp, "n08-prefilter.json");
  run("N08 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n08ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-duplicate-authorship", "--output", n08ReplayDenominator]);
  assert("N08 extractor byte identity", fs.readFileSync(n08ReplayDenominator).equals(fs.readFileSync(absolute(n08DenominatorPath))), "N08 extractor replay differs");
  run("N08 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n08ManifestPath), n08ReplayDenominator, "--authored-concerns", absolute(`${n08Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n08Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n08ReplaySelection]);
  assert("N08 selector byte identity", fs.readFileSync(n08ReplaySelection).equals(fs.readFileSync(absolute(n08SelectionPath))), "N08 selector replay differs");
  run("N08 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n08RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n08ReplayPrefilter]);
  assert("N08 prefilter byte identity", fs.readFileSync(n08ReplayPrefilter).equals(fs.readFileSync(absolute(n08ReceiptPath))), "N08 prefilter replay differs");

  const n09ReplayDenominator = path.join(temp, "n09-denominator.json");
  const n09ReplaySelection = path.join(temp, "n09-selection.json");
  const n09ReplayPrefilter = path.join(temp, "n09-prefilter.json");
  run("N09 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n09ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-inverse-dimension-preservation", "--output", n09ReplayDenominator]);
  assert("N09 extractor byte identity", fs.readFileSync(n09ReplayDenominator).equals(fs.readFileSync(absolute(n09DenominatorPath))), "N09 extractor replay differs");
  run("N09 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n09ManifestPath), n09ReplayDenominator, "--authored-concerns", absolute(`${n09Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n09Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n09ReplaySelection]);
  assert("N09 selector byte identity", fs.readFileSync(n09ReplaySelection).equals(fs.readFileSync(absolute(n09SelectionPath))), "N09 selector replay differs");
  run("N09 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n09RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n09ReplayPrefilter]);
  assert("N09 prefilter byte identity", fs.readFileSync(n09ReplayPrefilter).equals(fs.readFileSync(absolute(n09ReceiptPath))), "N09 prefilter replay differs");

  const n10ReplayDenominator = path.join(temp, "n10-denominator.json");
  const n10ReplaySelection = path.join(temp, "n10-selection.json");
  const n10ReplayPrefilter = path.join(temp, "n10-prefilter.json");
  run("N10 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n10ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owned-by-materialization-policy", "--output", n10ReplayDenominator]);
  assert("N10 extractor byte identity", fs.readFileSync(n10ReplayDenominator).equals(fs.readFileSync(absolute(n10DenominatorPath))), "N10 extractor replay differs");
  run("N10 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n10ManifestPath), n10ReplayDenominator, "--authored-concerns", absolute(`${n10Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n10Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n10ReplaySelection]);
  assert("N10 selector byte identity", fs.readFileSync(n10ReplaySelection).equals(fs.readFileSync(absolute(n10SelectionPath))), "N10 selector replay differs");
  run("N10 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n10RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n10ReplayPrefilter]);
  assert("N10 prefilter byte identity", fs.readFileSync(n10ReplayPrefilter).equals(fs.readFileSync(absolute(n10ReceiptPath))), "N10 prefilter replay differs");

  const n11ReplayDenominator = path.join(temp, "n11-denominator.json");
  const n11ReplaySelection = path.join(temp, "n11-selection.json");
  const n11ReplayPrefilter = path.join(temp, "n11-prefilter.json");
  run("N11 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n11ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-cycle-partial-view-verdict", "--output", n11ReplayDenominator]);
  assert("N11 extractor byte identity", fs.readFileSync(n11ReplayDenominator).equals(fs.readFileSync(absolute(n11DenominatorPath))), "N11 extractor replay differs");
  run("N11 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n11ManifestPath), n11ReplayDenominator, "--authored-concerns", absolute(`${n11Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n11Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n11ReplaySelection]);
  assert("N11 selector byte identity", fs.readFileSync(n11ReplaySelection).equals(fs.readFileSync(absolute(n11SelectionPath))), "N11 selector replay differs");
  run("N11 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n11RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n11ReplayPrefilter]);
  assert("N11 prefilter byte identity", fs.readFileSync(n11ReplayPrefilter).equals(fs.readFileSync(absolute(n11ReceiptPath))), "N11 prefilter replay differs");

  const n12ReplayDenominator = path.join(temp, "n12-denominator.json");
  const n12ReplaySelection = path.join(temp, "n12-selection.json");
  const n12ReplayPrefilter = path.join(temp, "n12-prefilter.json");
  run("N12 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n12ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-cycle-closure-proof-shape", "--output", n12ReplayDenominator]);
  assert("N12 extractor byte identity", fs.readFileSync(n12ReplayDenominator).equals(fs.readFileSync(absolute(n12DenominatorPath))), "N12 extractor replay differs");
  run("N12 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n12ManifestPath), n12ReplayDenominator, "--authored-concerns", absolute(`${n12Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n12Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n12ReplaySelection]);
  assert("N12 selector byte identity", fs.readFileSync(n12ReplaySelection).equals(fs.readFileSync(absolute(n12SelectionPath))), "N12 selector replay differs");
  run("N12 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n12RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n12ReplayPrefilter]);
  assert("N12 prefilter byte identity", fs.readFileSync(n12ReplayPrefilter).equals(fs.readFileSync(absolute(n12ReceiptPath))), "N12 prefilter replay differs");

  const n13ReplayDenominator = path.join(temp, "n13-denominator.json");
  const n13ReplaySelection = path.join(temp, "n13-selection.json");
  const n13ReplayPrefilter = path.join(temp, "n13-prefilter.json");
  run("N13 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n13ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-path-consequence-governance", "--output", n13ReplayDenominator]);
  assert("N13 extractor byte identity", fs.readFileSync(n13ReplayDenominator).equals(fs.readFileSync(absolute(n13DenominatorPath))), "N13 extractor replay differs");
  run("N13 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n13ManifestPath), n13ReplayDenominator, "--authored-concerns", absolute(`${n13Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n13Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n13ReplaySelection]);
  assert("N13 selector byte identity", fs.readFileSync(n13ReplaySelection).equals(fs.readFileSync(absolute(n13SelectionPath))), "N13 selector replay differs");
  run("N13 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n13RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n13ReplayPrefilter]);
  assert("N13 prefilter byte identity", fs.readFileSync(n13ReplayPrefilter).equals(fs.readFileSync(absolute(n13ReceiptPath))), "N13 prefilter replay differs");

  const n14ReplayDenominator = path.join(temp, "n14-denominator.json");
  const n14ReplaySelection = path.join(temp, "n14-selection.json");
  const n14ReplayPrefilter = path.join(temp, "n14-prefilter.json");
  run("N14 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n14ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-lifecycle-path-consequence-behavior", "--output", n14ReplayDenominator]);
  assert("N14 extractor byte identity", fs.readFileSync(n14ReplayDenominator).equals(fs.readFileSync(absolute(n14DenominatorPath))), "N14 extractor replay differs");
  run("N14 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n14ManifestPath), n14ReplayDenominator, "--authored-concerns", absolute(`${n14Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n14Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n14ReplaySelection]);
  assert("N14 selector byte identity", fs.readFileSync(n14ReplaySelection).equals(fs.readFileSync(absolute(n14SelectionPath))), "N14 selector replay differs");
  run("N14 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n14RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n14ReplayPrefilter]);
  assert("N14 prefilter byte identity", fs.readFileSync(n14ReplayPrefilter).equals(fs.readFileSync(absolute(n14ReceiptPath))), "N14 prefilter replay differs");

  const n15ReplayDenominator = path.join(temp, "n15-denominator.json");
  const n15ReplaySelection = path.join(temp, "n15-selection.json");
  const n15ReplayPrefilter = path.join(temp, "n15-prefilter.json");
  run("N15 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n15ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-custody-path-consequence-behavior", "--output", n15ReplayDenominator]);
  assert("N15 extractor byte identity", fs.readFileSync(n15ReplayDenominator).equals(fs.readFileSync(absolute(n15DenominatorPath))), "N15 extractor replay differs");
  run("N15 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n15ManifestPath), n15ReplayDenominator, "--authored-concerns", absolute(`${n15Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n15Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n15ReplaySelection]);
  assert("N15 selector byte identity", fs.readFileSync(n15ReplaySelection).equals(fs.readFileSync(absolute(n15SelectionPath))), "N15 selector replay differs");
  run("N15 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n15RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n15ReplayPrefilter]);
  assert("N15 prefilter byte identity", fs.readFileSync(n15ReplayPrefilter).equals(fs.readFileSync(absolute(n15ReceiptPath))), "N15 prefilter replay differs");

  const n16ReplayDenominator = path.join(temp, "n16-denominator.json");
  const n16ReplaySelection = path.join(temp, "n16-selection.json");
  const n16ReplayPrefilter = path.join(temp, "n16-prefilter.json");
  run("N16 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n16ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-write-responsibility-path-consequence-behavior", "--output", n16ReplayDenominator]);
  assert("N16 extractor byte identity", fs.readFileSync(n16ReplayDenominator).equals(fs.readFileSync(absolute(n16DenominatorPath))), "N16 extractor replay differs");
  run("N16 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n16ManifestPath), n16ReplayDenominator, "--authored-concerns", absolute(`${n16Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n16Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n16ReplaySelection]);
  assert("N16 selector byte identity", fs.readFileSync(n16ReplaySelection).equals(fs.readFileSync(absolute(n16SelectionPath))), "N16 selector replay differs");
  run("N16 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n16RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n16ReplayPrefilter]);
  assert("N16 prefilter byte identity", fs.readFileSync(n16ReplayPrefilter).equals(fs.readFileSync(absolute(n16ReceiptPath))), "N16 prefilter replay differs");

  const n17ReplayDenominator = path.join(temp, "n17-denominator.json");
  const n17ReplaySelection = path.join(temp, "n17-selection.json");
  const n17ReplayPrefilter = path.join(temp, "n17-prefilter.json");
  run("N17 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n17ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-mixed-dimension-path-consequence-behavior", "--output", n17ReplayDenominator]);
  assert("N17 extractor byte identity", fs.readFileSync(n17ReplayDenominator).equals(fs.readFileSync(absolute(n17DenominatorPath))), "N17 extractor replay differs");
  run("N17 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n17ManifestPath), n17ReplayDenominator, "--authored-concerns", absolute(`${n17Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n17Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n17ReplaySelection]);
  assert("N17 selector byte identity", fs.readFileSync(n17ReplaySelection).equals(fs.readFileSync(absolute(n17SelectionPath))), "N17 selector replay differs");
  run("N17 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n17RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n17ReplayPrefilter]);
  assert("N17 prefilter byte identity", fs.readFileSync(n17ReplayPrefilter).equals(fs.readFileSync(absolute(n17ReceiptPath))), "N17 prefilter replay differs");

  const n18ReplayDenominator = path.join(temp, "n18-denominator.json");
  const n18ReplaySelection = path.join(temp, "n18-selection.json");
  const n18ReplayPrefilter = path.join(temp, "n18-prefilter.json");
  run("N18 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n18ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:owns-mixed-dimension-closed-path-self-reachability-behavior", "--output", n18ReplayDenominator]);
  assert("N18 extractor byte identity", fs.readFileSync(n18ReplayDenominator).equals(fs.readFileSync(absolute(n18DenominatorPath))), "N18 extractor replay differs");
  run("N18 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n18ManifestPath), n18ReplayDenominator, "--authored-concerns", absolute(`${n18Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n18Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n18ReplaySelection]);
  assert("N18 selector byte identity", fs.readFileSync(n18ReplaySelection).equals(fs.readFileSync(absolute(n18SelectionPath))), "N18 selector replay differs");
  run("N18 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n18RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n18ReplayPrefilter]);
  assert("N18 prefilter byte identity", fs.readFileSync(n18ReplayPrefilter).equals(fs.readFileSync(absolute(n18ReceiptPath))), "N18 prefilter replay differs");

  const n19ReplayDenominator = path.join(temp, "n19-denominator.json");
  const n19ReplaySelection = path.join(temp, "n19-selection.json");
  const n19ReplayPrefilter = path.join(temp, "n19-prefilter.json");
  run("N19 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n19ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-self-edge-policy-governance", "--output", n19ReplayDenominator]);
  assert("N19 extractor byte identity", fs.readFileSync(n19ReplayDenominator).equals(fs.readFileSync(absolute(n19DenominatorPath))), "N19 extractor replay differs");
  run("N19 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n19ManifestPath), n19ReplayDenominator, "--authored-concerns", absolute(`${n19Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n19Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n19ReplaySelection]);
  assert("N19 selector byte identity", fs.readFileSync(n19ReplaySelection).equals(fs.readFileSync(absolute(n19SelectionPath))), "N19 selector replay differs");
  run("N19 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n19RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n19ReplayPrefilter]);
  assert("N19 prefilter byte identity", fs.readFileSync(n19ReplayPrefilter).equals(fs.readFileSync(absolute(n19ReceiptPath))), "N19 prefilter replay differs");

  const n20ReplayDenominator = path.join(temp, "n20-denominator.json");
  const n20ReplaySelection = path.join(temp, "n20-selection.json");
  const n20ReplayPrefilter = path.join(temp, "n20-prefilter.json");
  run("N20 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n20ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-uniform-self-edge-behavior", "--output", n20ReplayDenominator]);
  assert("N20 extractor byte identity", fs.readFileSync(n20ReplayDenominator).equals(fs.readFileSync(absolute(n20DenominatorPath))), "N20 extractor replay differs");
  run("N20 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n20ManifestPath), n20ReplayDenominator, "--authored-concerns", absolute(`${n20Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n20Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n20ReplaySelection]);
  assert("N20 selector byte identity", fs.readFileSync(n20ReplaySelection).equals(fs.readFileSync(absolute(n20SelectionPath))), "N20 selector replay differs");
  run("N20 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n20RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n20ReplayPrefilter]);
  assert("N20 prefilter byte identity", fs.readFileSync(n20ReplayPrefilter).equals(fs.readFileSync(absolute(n20ReceiptPath))), "N20 prefilter replay differs");

  const n21ReplayDenominator = path.join(temp, "n21-denominator.json");
  const n21ReplaySelection = path.join(temp, "n21-selection.json");
  const n21ReplayPrefilter = path.join(temp, "n21-prefilter.json");
  run("N21 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n21ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-longer-cycle-policy-governance", "--output", n21ReplayDenominator]);
  assert("N21 extractor byte identity", fs.readFileSync(n21ReplayDenominator).equals(fs.readFileSync(absolute(n21DenominatorPath))), "N21 extractor replay differs");
  run("N21 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n21ManifestPath), n21ReplayDenominator, "--authored-concerns", absolute(`${n21Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n21Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n21ReplaySelection]);
  assert("N21 selector byte identity", fs.readFileSync(n21ReplaySelection).equals(fs.readFileSync(absolute(n21SelectionPath))), "N21 selector replay differs");
  run("N21 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n21RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n21ReplayPrefilter]);
  assert("N21 prefilter byte identity", fs.readFileSync(n21ReplayPrefilter).equals(fs.readFileSync(absolute(n21ReceiptPath))), "N21 prefilter replay differs");

  const n22ReplayDenominator = path.join(temp, "n22-denominator.json");
  const n22ReplaySelection = path.join(temp, "n22-selection.json");
  const n22ReplayPrefilter = path.join(temp, "n22-prefilter.json");
  run("N22 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n22ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-uniform-longer-cycle-behavior", "--output", n22ReplayDenominator]);
  assert("N22 extractor byte identity", fs.readFileSync(n22ReplayDenominator).equals(fs.readFileSync(absolute(n22DenominatorPath))), "N22 extractor replay differs");
  run("N22 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n22ManifestPath), n22ReplayDenominator, "--authored-concerns", absolute(`${n22Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n22Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n22ReplaySelection]);
  assert("N22 selector byte identity", fs.readFileSync(n22ReplaySelection).equals(fs.readFileSync(absolute(n22SelectionPath))), "N22 selector replay differs");
  run("N22 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n22RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n22ReplayPrefilter]);
  assert("N22 prefilter byte identity", fs.readFileSync(n22ReplayPrefilter).equals(fs.readFileSync(absolute(n22ReceiptPath))), "N22 prefilter replay differs");

  const n23ReplayDenominator = path.join(temp, "n23-denominator.json");
  const n23ReplaySelection = path.join(temp, "n23-selection.json");
  const n23ReplayPrefilter = path.join(temp, "n23-prefilter.json");
  run("N23 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n23ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-mixed-kind-closed-path-behavior", "--output", n23ReplayDenominator]);
  assert("N23 extractor byte identity", fs.readFileSync(n23ReplayDenominator).equals(fs.readFileSync(absolute(n23DenominatorPath))), "N23 extractor replay differs");
  run("N23 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n23ManifestPath), n23ReplayDenominator, "--authored-concerns", absolute(`${n23Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n23Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n23ReplaySelection]);
  assert("N23 selector byte identity", fs.readFileSync(n23ReplaySelection).equals(fs.readFileSync(absolute(n23SelectionPath))), "N23 selector replay differs");
  run("N23 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n23RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n23ReplayPrefilter]);
  assert("N23 prefilter byte identity", fs.readFileSync(n23ReplayPrefilter).equals(fs.readFileSync(absolute(n23ReceiptPath))), "N23 prefilter replay differs");

  const n24ReplayDenominator = path.join(temp, "n24-denominator.json");
  const n24ReplaySelection = path.join(temp, "n24-selection.json");
  const n24ReplayPrefilter = path.join(temp, "n24-prefilter.json");
  run("N24 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n24ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-duplicate-authorship", "--output", n24ReplayDenominator]);
  assert("N24 extractor byte identity", fs.readFileSync(n24ReplayDenominator).equals(fs.readFileSync(absolute(n24DenominatorPath))), "N24 extractor replay differs");
  run("N24 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n24ManifestPath), n24ReplayDenominator, "--authored-concerns", absolute(`${n24Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n24Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n24ReplaySelection]);
  assert("N24 selector byte identity", fs.readFileSync(n24ReplaySelection).equals(fs.readFileSync(absolute(n24SelectionPath))), "N24 selector replay differs");
  run("N24 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n24RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n24ReplayPrefilter]);
  assert("N24 prefilter byte identity", fs.readFileSync(n24ReplayPrefilter).equals(fs.readFileSync(absolute(n24ReceiptPath))), "N24 prefilter replay differs");

  const n25ReplayDenominator = path.join(temp, "n25-denominator.json");
  const n25ReplaySelection = path.join(temp, "n25-selection.json");
  const n25ReplayPrefilter = path.join(temp, "n25-prefilter.json");
  run("N25 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n25ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-same-kind-cycle-partial-view-verdict", "--output", n25ReplayDenominator]);
  assert("N25 extractor byte identity", fs.readFileSync(n25ReplayDenominator).equals(fs.readFileSync(absolute(n25DenominatorPath))), "N25 extractor replay differs");
  run("N25 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n25ManifestPath), n25ReplayDenominator, "--authored-concerns", absolute(`${n25Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n25Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n25ReplaySelection]);
  assert("N25 selector byte identity", fs.readFileSync(n25ReplaySelection).equals(fs.readFileSync(absolute(n25SelectionPath))), "N25 selector replay differs");
  run("N25 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n25RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n25ReplayPrefilter]);
  assert("N25 prefilter byte identity", fs.readFileSync(n25ReplayPrefilter).equals(fs.readFileSync(absolute(n25ReceiptPath))), "N25 prefilter replay differs");

  const n26ReplayDenominator = path.join(temp, "n26-denominator.json");
  const n26ReplaySelection = path.join(temp, "n26-selection.json");
  const n26ReplayPrefilter = path.join(temp, "n26-prefilter.json");
  run("N26 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n26ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-same-kind-cycle-closure-proof-shape", "--output", n26ReplayDenominator]);
  assert("N26 extractor byte identity", fs.readFileSync(n26ReplayDenominator).equals(fs.readFileSync(absolute(n26DenominatorPath))), "N26 extractor replay differs");
  run("N26 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n26ManifestPath), n26ReplayDenominator, "--authored-concerns", absolute(`${n26Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n26Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n26ReplaySelection]);
  assert("N26 selector byte identity", fs.readFileSync(n26ReplaySelection).equals(fs.readFileSync(absolute(n26SelectionPath))), "N26 selector replay differs");
  run("N26 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n26RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n26ReplayPrefilter]);
  assert("N26 prefilter byte identity", fs.readFileSync(n26ReplayPrefilter).equals(fs.readFileSync(absolute(n26ReceiptPath))), "N26 prefilter replay differs");

  const n27ReplayDenominator = path.join(temp, "n27-denominator.json");
  const n27ReplaySelection = path.join(temp, "n27-selection.json");
  const n27ReplayPrefilter = path.join(temp, "n27-prefilter.json");
  run("N27 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n27ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-path-consequence-policy-governance", "--output", n27ReplayDenominator]);
  assert("N27 extractor byte identity", fs.readFileSync(n27ReplayDenominator).equals(fs.readFileSync(absolute(n27DenominatorPath))), "N27 extractor replay differs");
  run("N27 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n27ManifestPath), n27ReplayDenominator, "--authored-concerns", absolute(`${n27Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n27Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n27ReplaySelection]);
  assert("N27 selector byte identity", fs.readFileSync(n27ReplaySelection).equals(fs.readFileSync(absolute(n27SelectionPath))), "N27 selector replay differs");
  run("N27 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n27RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n27ReplayPrefilter]);
  assert("N27 prefilter byte identity", fs.readFileSync(n27ReplayPrefilter).equals(fs.readFileSync(absolute(n27ReceiptPath))), "N27 prefilter replay differs");

  const n28ReplayDenominator = path.join(temp, "n28-denominator.json");
  const n28ReplaySelection = path.join(temp, "n28-selection.json");
  const n28ReplayPrefilter = path.join(temp, "n28-prefilter.json");
  run("N28 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n28ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-classification-path-consequence-behavior", "--output", n28ReplayDenominator]);
  assert("N28 extractor byte identity", fs.readFileSync(n28ReplayDenominator).equals(fs.readFileSync(absolute(n28DenominatorPath))), "N28 extractor replay differs");
  run("N28 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n28ManifestPath), n28ReplayDenominator, "--authored-concerns", absolute(`${n28Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n28Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n28ReplaySelection]);
  assert("N28 selector byte identity", fs.readFileSync(n28ReplaySelection).equals(fs.readFileSync(absolute(n28SelectionPath))), "N28 selector replay differs");
  run("N28 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n28RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n28ReplayPrefilter]);
  assert("N28 prefilter byte identity", fs.readFileSync(n28ReplayPrefilter).equals(fs.readFileSync(absolute(n28ReceiptPath))), "N28 prefilter replay differs");

  const n29ReplayDenominator = path.join(temp, "n29-denominator.json");
  const n29ReplaySelection = path.join(temp, "n29-selection.json");
  const n29ReplayPrefilter = path.join(temp, "n29-prefilter.json");
  run("N29 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n29ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-home-assignment-path-consequence-behavior", "--output", n29ReplayDenominator]);
  assert("N29 extractor byte identity", fs.readFileSync(n29ReplayDenominator).equals(fs.readFileSync(absolute(n29DenominatorPath))), "N29 extractor replay differs");
  run("N29 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n29ManifestPath), n29ReplayDenominator, "--authored-concerns", absolute(`${n29Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n29Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n29ReplaySelection]);
  assert("N29 selector byte identity", fs.readFileSync(n29ReplaySelection).equals(fs.readFileSync(absolute(n29SelectionPath))), "N29 selector replay differs");
  run("N29 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n29RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n29ReplayPrefilter]);
  assert("N29 prefilter byte identity", fs.readFileSync(n29ReplayPrefilter).equals(fs.readFileSync(absolute(n29ReceiptPath))), "N29 prefilter replay differs");

  const n30ReplayDenominator = path.join(temp, "n30-denominator.json");
  const n30ReplaySelection = path.join(temp, "n30-selection.json");
  const n30ReplayPrefilter = path.join(temp, "n30-prefilter.json");
  run("N30 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n30ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-mixed-kind-path-consequence-behavior", "--output", n30ReplayDenominator]);
  assert("N30 extractor byte identity", fs.readFileSync(n30ReplayDenominator).equals(fs.readFileSync(absolute(n30DenominatorPath))), "N30 extractor replay differs");
  run("N30 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n30ManifestPath), n30ReplayDenominator, "--authored-concerns", absolute(`${n30Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n30Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n30ReplaySelection]);
  assert("N30 selector byte identity", fs.readFileSync(n30ReplaySelection).equals(fs.readFileSync(absolute(n30SelectionPath))), "N30 selector replay differs");
  run("N30 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n30RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n30ReplayPrefilter]);
  assert("N30 prefilter byte identity", fs.readFileSync(n30ReplayPrefilter).equals(fs.readFileSync(absolute(n30ReceiptPath))), "N30 prefilter replay differs");

  const n31ReplayDenominator = path.join(temp, "n31-denominator.json");
  const n31ReplaySelection = path.join(temp, "n31-selection.json");
  const n31ReplayPrefilter = path.join(temp, "n31-prefilter.json");
  run("N31 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n31ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:belongs-to-mixed-kind-closed-path-self-reachability-behavior", "--output", n31ReplayDenominator]);
  assert("N31 extractor byte identity", fs.readFileSync(n31ReplayDenominator).equals(fs.readFileSync(absolute(n31DenominatorPath))), "N31 extractor replay differs");
  run("N31 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n31ManifestPath), n31ReplayDenominator, "--authored-concerns", absolute(`${n31Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n31Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n31ReplaySelection]);
  assert("N31 selector byte identity", fs.readFileSync(n31ReplaySelection).equals(fs.readFileSync(absolute(n31SelectionPath))), "N31 selector replay differs");
  run("N31 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n31RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n31ReplayPrefilter]);
  assert("N31 prefilter byte identity", fs.readFileSync(n31ReplayPrefilter).equals(fs.readFileSync(absolute(n31ReceiptPath))), "N31 prefilter replay differs");

  const n32ReplayDenominator = path.join(temp, "n32-denominator.json");
  const n32ReplaySelection = path.join(temp, "n32-selection.json");
  const n32ReplayPrefilter = path.join(temp, "n32-prefilter.json");
  run("N32 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n32ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:produces-duplicate-authorship", "--output", n32ReplayDenominator]);
  assert("N32 extractor byte identity", fs.readFileSync(n32ReplayDenominator).equals(fs.readFileSync(absolute(n32DenominatorPath))), "N32 extractor replay differs");
  run("N32 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n32ManifestPath), n32ReplayDenominator, "--authored-concerns", absolute(`${n32Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n32Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n32ReplaySelection]);
  assert("N32 selector byte identity", fs.readFileSync(n32ReplaySelection).equals(fs.readFileSync(absolute(n32SelectionPath))), "N32 selector replay differs");
  run("N32 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n32RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n32ReplayPrefilter]);
  assert("N32 prefilter byte identity", fs.readFileSync(n32ReplayPrefilter).equals(fs.readFileSync(absolute(n32ReceiptPath))), "N32 prefilter replay differs");

  const n33ReplayDenominator = path.join(temp, "n33-denominator.json");
  const n33ReplaySelection = path.join(temp, "n33-selection.json");
  const n33ReplayPrefilter = path.join(temp, "n33-prefilter.json");
  run("N33 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n33ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:emits-duplicate-authorship", "--output", n33ReplayDenominator]);
  assert("N33 extractor byte identity", fs.readFileSync(n33ReplayDenominator).equals(fs.readFileSync(absolute(n33DenominatorPath))), "N33 extractor replay differs");
  run("N33 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n33ManifestPath), n33ReplayDenominator, "--authored-concerns", absolute(`${n33Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n33Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n33ReplaySelection]);
  assert("N33 selector byte identity", fs.readFileSync(n33ReplaySelection).equals(fs.readFileSync(absolute(n33SelectionPath))), "N33 selector replay differs");
  run("N33 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n33RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n33ReplayPrefilter]);
  assert("N33 prefilter byte identity", fs.readFileSync(n33ReplayPrefilter).equals(fs.readFileSync(absolute(n33ReceiptPath))), "N33 prefilter replay differs");

  const n34ReplayDenominator = path.join(temp, "n34-denominator.json");
  const n34ReplaySelection = path.join(temp, "n34-selection.json");
  const n34ReplayPrefilter = path.join(temp, "n34-prefilter.json");
  run("N34 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n34ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:emits-occurrence-semantics", "--output", n34ReplayDenominator]);
  assert("N34 extractor byte identity", fs.readFileSync(n34ReplayDenominator).equals(fs.readFileSync(absolute(n34DenominatorPath))), "N34 extractor replay differs");
  run("N34 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n34ManifestPath), n34ReplayDenominator, "--authored-concerns", absolute(`${n34Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n34Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n34ReplaySelection]);
  assert("N34 selector byte identity", fs.readFileSync(n34ReplaySelection).equals(fs.readFileSync(absolute(n34SelectionPath))), "N34 selector replay differs");
  run("N34 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n34RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n34ReplayPrefilter]);
  assert("N34 prefilter byte identity", fs.readFileSync(n34ReplayPrefilter).equals(fs.readFileSync(absolute(n34ReceiptPath))), "N34 prefilter replay differs");

  const n35ReplayDenominator = path.join(temp, "n35-denominator.json");
  const n35ReplaySelection = path.join(temp, "n35-selection.json");
  const n35ReplayPrefilter = path.join(temp, "n35-prefilter.json");
  run("N35 extractor replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_scope_extractor.py"), absolute(n35ManifestPath), "--repository-root", repositoryRoot, "--authored-concern-id", "concern:emits-ordering", "--output", n35ReplayDenominator]);
  assert("N35 extractor byte identity", fs.readFileSync(n35ReplayDenominator).equals(fs.readFileSync(absolute(n35DenominatorPath))), "N35 extractor replay differs");
  run("N35 selector replay", "python3", [repoAbsolute(".agents/skills/invoke/scripts/design_selection_validator.py"), absolute(n35ManifestPath), n35ReplayDenominator, "--authored-concerns", absolute(`${n35Root}/DESIGN-AUTHORED-CONCERNS.json`), "--planned-witnesses", absolute(`${n35Root}/DESIGN-PLANNED-WITNESSES.json`), "--output", n35ReplaySelection]);
  assert("N35 selector byte identity", fs.readFileSync(n35ReplaySelection).equals(fs.readFileSync(absolute(n35SelectionPath))), "N35 selector replay differs");
  run("N35 prefilter replay", "python3", [repoAbsolute(".agents/skills/decision-gate/scripts/prefilter-options.py"), absolute(n35RequestPath), "--request-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"), "--receipt-schema", repoAbsolute(".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"), "--output", n35ReplayPrefilter]);
  assert("N35 prefilter byte identity", fs.readFileSync(n35ReplayPrefilter).equals(fs.readFileSync(absolute(n35ReceiptPath))), "N35 prefilter replay differs");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

run("main packet positive validation", "/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node", [repoAbsolute("projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs")]);
run("main packet hostile self-test", "/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node", [repoAbsolute("projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs"), "--self-test"]);

const jsonFiles = walk(designRoot).filter((file) => file.endsWith(".json"));
for (const file of jsonFiles) {
  try { JSON.parse(fs.readFileSync(file, "utf8")); pass(`json parse ${path.relative(designRoot, file)}`); }
  catch (error) { fail(`json parse ${path.relative(designRoot, file)}`, error.message); }
}
for (const file of walk(designRoot).filter((file) => /\.(md|json|mjs)$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  const trailing = text.split("\n").findIndex((line) => /[ \t]+$/.test(line));
  assert(`whitespace ${path.relative(designRoot, file)}`, trailing === -1 && text.endsWith("\n"), trailing >= 0 ? `trailing whitespace line ${trailing + 1}` : "missing final newline");
}

const closeout = readJson("DESIGN-CLOSEOUT-RECEIPT.json");
assert("closeout phase", closeout.schema_version === "domainspec.invoke.design-closeout-receipt/v42" && closeout.status === "blocked-at-owner-clarification" && closeout.prior_n35_gate_closeout_sha256 === "df6316e9db104610ee8aade9fec362341d9696124cf66a395609b4b2a76231f3", "closeout phase is stale");
assert("closeout N13 binding", closeout.n13_closeout.selected_option_id === "BMC-REL-NONNUMERIC-13-B-DIMENSION-SPECIFIC-PATH-CONSEQUENCE-POLICY" && closeout.n13_closeout.selection_receipt_sha256 === digestFile(n13OwnerSelectionPath) && closeout.n13_closeout.request_sha256 === digestFile(n13RequestPath) && closeout.n13_closeout.receipt_sha256 === digestFile(n13ReceiptPath) && closeout.n13_closeout.requestDigest === n13Receipt.requestDigest, "closeout N13 binding mismatch");
assert("closeout N14 sequencing", closeout.n14_sequencing.selected_dimension_id === "lifecycle" && closeout.n14_sequencing.receipt_sha256 === digestFile(n14SequencingPath), "closeout N14 sequencing mismatch");
assert("closeout N14 selection", closeout.n14_closeout.selected_option_id === "BMC-REL-NONNUMERIC-14-A-DIRECT-ONLY-LIFECYCLE-OWNERSHIP-CONSEQUENCE" && closeout.n14_closeout.selection_receipt_sha256 === digestFile(n14OwnerSelectionPath) && closeout.n14_closeout.request_sha256 === digestFile(n14RequestPath) && closeout.n14_closeout.receipt_sha256 === digestFile(n14ReceiptPath) && closeout.n14_closeout.requestDigest === n14Receipt.requestDigest, "closeout N14 binding mismatch");
assert("closeout N15 sequencing", closeout.n15_sequencing.selected_dimension_id === "custody" && closeout.n15_sequencing.receipt_sha256 === digestFile(n15SequencingPath) && closeout.n15_sequencing.n15_behavior_selected === true, "closeout N15 sequencing mismatch");
assert("closeout N15 denominator", closeout.n15_continuation_denominator.source_count === 7 && closeout.n15_continuation_denominator.manifest_sha256 === digestFile(n15ManifestPath) && closeout.n15_continuation_denominator.denominator_file_sha256 === digestFile(n15DenominatorPath) && closeout.n15_continuation_denominator.denominator_receipt_digest === n15Denominator.receipt_digest, "closeout N15 denominator mismatch");
assert("closeout N15 selection", closeout.n15_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n15SelectionPath) && closeout.n15_continuation_selection_fixed_point.pass_1_digest === n15Selection.pass_1_digest && closeout.n15_continuation_selection_fixed_point.pass_2_digest === n15Selection.pass_2_digest && closeout.n15_continuation_selection_fixed_point.fixed_point === true, "closeout N15 selection mismatch");
assert("closeout N15 selection", closeout.n15_closeout.selected_option_id === "BMC-REL-NONNUMERIC-15-A-DIRECT-ONLY-CUSTODY-OWNERSHIP-CONSEQUENCE" && closeout.n15_closeout.selection_receipt_sha256 === digestFile(n15OwnerSelectionPath) && closeout.n15_closeout.request_sha256 === digestFile(n15RequestPath) && closeout.n15_closeout.receipt_sha256 === digestFile(n15ReceiptPath) && closeout.n15_closeout.requestDigest === n15Receipt.requestDigest, "closeout N15 binding mismatch");
assert("closeout N16 denominator", closeout.n16_continuation_denominator.source_count === 7 && closeout.n16_continuation_denominator.manifest_sha256 === digestFile(n16ManifestPath) && closeout.n16_continuation_denominator.denominator_file_sha256 === digestFile(n16DenominatorPath) && closeout.n16_continuation_denominator.denominator_receipt_digest === n16Denominator.receipt_digest, "closeout N16 denominator mismatch");
assert("closeout N16 selection", closeout.n16_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n16SelectionPath) && closeout.n16_continuation_selection_fixed_point.pass_1_digest === n16Selection.pass_1_digest && closeout.n16_continuation_selection_fixed_point.pass_2_digest === n16Selection.pass_2_digest && closeout.n16_continuation_selection_fixed_point.fixed_point === true, "closeout N16 selection mismatch");
assert("closeout N16 selection", closeout.n16_closeout.selected_option_id === "BMC-REL-NONNUMERIC-16-A-DIRECT-ONLY-WRITE-RESPONSIBILITY-CONSEQUENCE" && closeout.n16_closeout.selection_receipt_sha256 === digestFile(n16OwnerSelectionPath) && closeout.n16_closeout.request_sha256 === digestFile(n16RequestPath) && closeout.n16_closeout.receipt_sha256 === digestFile(n16ReceiptPath) && closeout.n16_closeout.requestDigest === n16Receipt.requestDigest, "closeout N16 binding mismatch");
assert("closeout N17 denominator", closeout.n17_continuation_denominator.source_count === 9 && closeout.n17_continuation_denominator.manifest_sha256 === digestFile(n17ManifestPath) && closeout.n17_continuation_denominator.denominator_file_sha256 === digestFile(n17DenominatorPath) && closeout.n17_continuation_denominator.denominator_receipt_digest === n17Denominator.receipt_digest, "closeout N17 denominator mismatch");
assert("closeout N17 selection", closeout.n17_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n17SelectionPath) && closeout.n17_continuation_selection_fixed_point.pass_1_digest === n17Selection.pass_1_digest && closeout.n17_continuation_selection_fixed_point.pass_2_digest === n17Selection.pass_2_digest && closeout.n17_continuation_selection_fixed_point.fixed_point === true, "closeout N17 selection mismatch");
assert("closeout N17 selection receipt", closeout.n17_closeout.selected_option_id === "BMC-REL-NONNUMERIC-17-A-DIRECT-FACTS-ONLY-FOR-MIXED-DIMENSION-PATHS" && closeout.n17_closeout.selection_receipt_sha256 === digestFile(n17OwnerSelectionPath) && closeout.n17_closeout.request_sha256 === digestFile(n17RequestPath) && closeout.n17_closeout.receipt_sha256 === digestFile(n17ReceiptPath) && closeout.n17_closeout.requestDigest === n17Receipt.requestDigest, "closeout N17 binding mismatch");
assert("closeout N18 denominator", closeout.n18_continuation_denominator.source_count === 8 && closeout.n18_continuation_denominator.manifest_sha256 === digestFile(n18ManifestPath) && closeout.n18_continuation_denominator.denominator_file_sha256 === digestFile(n18DenominatorPath) && closeout.n18_continuation_denominator.denominator_receipt_digest === n18Denominator.receipt_digest, "closeout N18 denominator mismatch");
assert("closeout N18 selection", closeout.n18_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n18SelectionPath) && closeout.n18_continuation_selection_fixed_point.pass_1_digest === n18Selection.pass_1_digest && closeout.n18_continuation_selection_fixed_point.pass_2_digest === n18Selection.pass_2_digest && closeout.n18_continuation_selection_fixed_point.fixed_point === true, "closeout N18 selection mismatch");
assert("closeout N18 selection receipt", closeout.n18_closeout.selected_option_id === "BMC-REL-NONNUMERIC-18-A-NO-DERIVED-SELF-REACHABILITY-FROM-MIXED-CLOSED-PATHS" && closeout.n18_closeout.selection_receipt_sha256 === digestFile(n18OwnerSelectionPath) && closeout.n18_closeout.request_sha256 === digestFile(n18RequestPath) && closeout.n18_closeout.receipt_sha256 === digestFile(n18ReceiptPath) && closeout.n18_closeout.requestDigest === n18Receipt.requestDigest, "closeout N18 binding mismatch");
assert("closeout N19 denominator", closeout.n19_continuation_denominator.source_count === 7 && closeout.n19_continuation_denominator.manifest_sha256 === digestFile(n19ManifestPath) && closeout.n19_continuation_denominator.denominator_file_sha256 === digestFile(n19DenominatorPath) && closeout.n19_continuation_denominator.denominator_receipt_digest === n19Denominator.receipt_digest, "closeout N19 denominator mismatch");
assert("closeout N19 selection", closeout.n19_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n19SelectionPath) && closeout.n19_continuation_selection_fixed_point.pass_1_digest === n19Selection.pass_1_digest && closeout.n19_continuation_selection_fixed_point.pass_2_digest === n19Selection.pass_2_digest && closeout.n19_continuation_selection_fixed_point.fixed_point === true, "closeout N19 selection mismatch");
assert("closeout N19 selection receipt", closeout.n19_closeout.selected_option_id === "BMC-REL-NONNUMERIC-19-A-UNIFORM-SELF-EDGE-POLICY-ACROSS-MEMBERSHIP-KINDS" && closeout.n19_closeout.selection_receipt_sha256 === digestFile(n19OwnerSelectionPath) && closeout.n19_closeout.request_sha256 === digestFile(n19RequestPath) && closeout.n19_closeout.receipt_sha256 === digestFile(n19ReceiptPath) && closeout.n19_closeout.requestDigest === n19Receipt.requestDigest, "closeout N19 binding mismatch");
assert("closeout N20 denominator", closeout.n20_continuation_denominator.source_count === 6 && closeout.n20_continuation_denominator.manifest_sha256 === digestFile(n20ManifestPath) && closeout.n20_continuation_denominator.denominator_file_sha256 === digestFile(n20DenominatorPath) && closeout.n20_continuation_denominator.denominator_receipt_digest === n20Denominator.receipt_digest, "closeout N20 denominator mismatch");
assert("closeout N20 selection", closeout.n20_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n20SelectionPath) && closeout.n20_continuation_selection_fixed_point.pass_1_digest === n20Selection.pass_1_digest && closeout.n20_continuation_selection_fixed_point.pass_2_digest === n20Selection.pass_2_digest && closeout.n20_continuation_selection_fixed_point.fixed_point === true, "closeout N20 selection mismatch");
assert("closeout N20 selection receipt", closeout.n20_closeout.selected_option_id === "BMC-REL-NONNUMERIC-20-A-REJECT-UNIFORM-BELONGS-TO-SELF-EDGES" && closeout.n20_closeout.selection_receipt_sha256 === digestFile(n20OwnerSelectionPath) && closeout.n20_closeout.request_sha256 === digestFile(n20RequestPath) && closeout.n20_closeout.receipt_sha256 === digestFile(n20ReceiptPath) && closeout.n20_closeout.requestDigest === n20Receipt.requestDigest, "closeout N20 binding mismatch");
assert("closeout N21 denominator", closeout.n21_continuation_denominator.source_count === 6 && closeout.n21_continuation_denominator.manifest_sha256 === digestFile(n21ManifestPath) && closeout.n21_continuation_denominator.denominator_file_sha256 === digestFile(n21DenominatorPath) && closeout.n21_continuation_denominator.denominator_receipt_digest === n21Denominator.receipt_digest, "closeout N21 denominator mismatch");
assert("closeout N21 selection", closeout.n21_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n21SelectionPath) && closeout.n21_continuation_selection_fixed_point.pass_1_digest === n21Selection.pass_1_digest && closeout.n21_continuation_selection_fixed_point.pass_2_digest === n21Selection.pass_2_digest && closeout.n21_continuation_selection_fixed_point.fixed_point === true, "closeout N21 selection mismatch");
assert("closeout N21 selection receipt", closeout.n21_closeout.selected_option_id === "BMC-REL-NONNUMERIC-21-A-UNIFORM-LONGER-CYCLE-POLICY-ACROSS-MEMBERSHIP-KINDS" && closeout.n21_closeout.selection_receipt_sha256 === digestFile(n21OwnerSelectionPath) && closeout.n21_closeout.request_sha256 === digestFile(n21RequestPath) && closeout.n21_closeout.receipt_sha256 === digestFile(n21ReceiptPath) && closeout.n21_closeout.requestDigest === n21Receipt.requestDigest, "closeout N21 binding mismatch");
assert("closeout N22 denominator", closeout.n22_continuation_denominator.source_count === 6 && closeout.n22_continuation_denominator.manifest_sha256 === digestFile(n22ManifestPath) && closeout.n22_continuation_denominator.denominator_file_sha256 === digestFile(n22DenominatorPath) && closeout.n22_continuation_denominator.denominator_receipt_digest === n22Denominator.receipt_digest, "closeout N22 denominator mismatch");
assert("closeout N22 selection", closeout.n22_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n22SelectionPath) && closeout.n22_continuation_selection_fixed_point.pass_1_digest === n22Selection.pass_1_digest && closeout.n22_continuation_selection_fixed_point.pass_2_digest === n22Selection.pass_2_digest && closeout.n22_continuation_selection_fixed_point.fixed_point === true, "closeout N22 selection mismatch");
assert("closeout N22 selection receipt", closeout.n22_closeout.selected_option_id === "BMC-REL-NONNUMERIC-22-A-REJECT-UNIFORM-SAME-KIND-LONGER-CYCLES" && closeout.n22_closeout.selection_receipt_sha256 === digestFile(n22OwnerSelectionPath) && closeout.n22_closeout.request_sha256 === digestFile(n22RequestPath) && closeout.n22_closeout.receipt_sha256 === digestFile(n22ReceiptPath) && closeout.n22_closeout.requestDigest === n22Receipt.requestDigest, "closeout N22 binding mismatch");
assert("closeout N23 denominator", closeout.n23_continuation_denominator.source_count === 8 && closeout.n23_continuation_denominator.manifest_sha256 === digestFile(n23ManifestPath) && closeout.n23_continuation_denominator.denominator_file_sha256 === digestFile(n23DenominatorPath) && closeout.n23_continuation_denominator.denominator_receipt_digest === n23Denominator.receipt_digest, "closeout N23 denominator mismatch");
assert("closeout N23 selection", closeout.n23_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n23SelectionPath) && closeout.n23_continuation_selection_fixed_point.pass_1_digest === n23Selection.pass_1_digest && closeout.n23_continuation_selection_fixed_point.pass_2_digest === n23Selection.pass_2_digest && closeout.n23_continuation_selection_fixed_point.fixed_point === true, "closeout N23 selection mismatch");
assert("closeout N23 selection receipt", closeout.n23_closeout.selected_option_id === "BMC-REL-NONNUMERIC-23-A-ALLOW-MIXED-KIND-CLOSED-PATHS" && closeout.n23_closeout.selection_receipt_sha256 === digestFile(n23OwnerSelectionPath) && closeout.n23_closeout.request_sha256 === digestFile(n23RequestPath) && closeout.n23_closeout.receipt_sha256 === digestFile(n23ReceiptPath) && closeout.n23_closeout.requestDigest === n23Receipt.requestDigest, "closeout N23 binding mismatch");
assert("closeout N24 denominator", closeout.n24_continuation_denominator.source_count === 9 && closeout.n24_continuation_denominator.manifest_sha256 === digestFile(n24ManifestPath) && closeout.n24_continuation_denominator.denominator_file_sha256 === digestFile(n24DenominatorPath) && closeout.n24_continuation_denominator.denominator_receipt_digest === n24Denominator.receipt_digest, "closeout N24 denominator mismatch");
assert("closeout N24 selection", closeout.n24_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n24SelectionPath) && closeout.n24_continuation_selection_fixed_point.pass_1_digest === n24Selection.pass_1_digest && closeout.n24_continuation_selection_fixed_point.pass_2_digest === n24Selection.pass_2_digest && closeout.n24_continuation_selection_fixed_point.fixed_point === true, "closeout N24 selection mismatch");
assert("closeout N24 selection receipt", closeout.n24_closeout.selected_option_id === "BMC-REL-NONNUMERIC-24-A-REJECT-DUPLICATE-AUTHORED-BELONGS-TO" && closeout.n24_closeout.selection_receipt_sha256 === digestFile(n24OwnerSelectionPath) && closeout.n24_closeout.request_sha256 === digestFile(n24RequestPath) && closeout.n24_closeout.receipt_sha256 === digestFile(n24ReceiptPath) && closeout.n24_closeout.requestDigest === n24Receipt.requestDigest, "closeout N24 binding mismatch");
assert("closeout N25 denominator", closeout.n25_continuation_denominator.source_count === 10 && closeout.n25_continuation_denominator.manifest_sha256 === digestFile(n25ManifestPath) && closeout.n25_continuation_denominator.denominator_file_sha256 === digestFile(n25DenominatorPath) && closeout.n25_continuation_denominator.denominator_receipt_digest === n25Denominator.receipt_digest, "closeout N25 denominator mismatch");
assert("closeout N25 selection", closeout.n25_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n25SelectionPath) && closeout.n25_continuation_selection_fixed_point.pass_1_digest === n25Selection.pass_1_digest && closeout.n25_continuation_selection_fixed_point.pass_2_digest === n25Selection.pass_2_digest && closeout.n25_continuation_selection_fixed_point.fixed_point === true, "closeout N25 selection mismatch");
assert("closeout N25 selection receipt", closeout.n25_closeout.selected_option_id === "BMC-REL-NONNUMERIC-25-A-NOT-EVALUATED-WITHOUT-RELEVANT-CLOSURE" && closeout.n25_closeout.selection_receipt_sha256 === digestFile(n25OwnerSelectionPath) && closeout.n25_closeout.request_sha256 === digestFile(n25RequestPath) && closeout.n25_closeout.receipt_sha256 === digestFile(n25ReceiptPath) && closeout.n25_closeout.requestDigest === n25Receipt.requestDigest, "closeout N25 binding mismatch");
assert("closeout N26 denominator", closeout.n26_continuation_denominator.source_count === 10 && closeout.n26_continuation_denominator.manifest_sha256 === digestFile(n26ManifestPath) && closeout.n26_continuation_denominator.denominator_file_sha256 === digestFile(n26DenominatorPath) && closeout.n26_continuation_denominator.denominator_receipt_digest === n26Denominator.receipt_digest, "closeout N26 denominator mismatch");
assert("closeout N26 selection", closeout.n26_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n26SelectionPath) && closeout.n26_continuation_selection_fixed_point.pass_1_digest === n26Selection.pass_1_digest && closeout.n26_continuation_selection_fixed_point.pass_2_digest === n26Selection.pass_2_digest && closeout.n26_continuation_selection_fixed_point.fixed_point === true, "closeout N26 selection mismatch");
assert("closeout N26 selection receipt", closeout.n26_closeout.selected_option_id === "BMC-REL-NONNUMERIC-26-A-OUTGOING-ADJACENCY-PLUS-ENTITY-POPULATION" && closeout.n26_closeout.selection_receipt_sha256 === digestFile(n26OwnerSelectionPath) && closeout.n26_closeout.request_sha256 === digestFile(n26RequestPath) && closeout.n26_closeout.receipt_sha256 === digestFile(n26ReceiptPath) && closeout.n26_closeout.requestDigest === n26Receipt.requestDigest, "closeout N26 binding mismatch");
assert("closeout N27 denominator", closeout.n27_continuation_denominator.source_count === 9 && closeout.n27_continuation_denominator.manifest_sha256 === digestFile(n27ManifestPath) && closeout.n27_continuation_denominator.denominator_file_sha256 === digestFile(n27DenominatorPath) && closeout.n27_continuation_denominator.denominator_receipt_digest === n27Denominator.receipt_digest, "closeout N27 denominator mismatch");
assert("closeout N27 selection", closeout.n27_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n27SelectionPath) && closeout.n27_continuation_selection_fixed_point.pass_1_digest === n27Selection.pass_1_digest && closeout.n27_continuation_selection_fixed_point.pass_2_digest === n27Selection.pass_2_digest && closeout.n27_continuation_selection_fixed_point.fixed_point === true, "closeout N27 selection mismatch");
assert("closeout N27 selection receipt", closeout.n27_closeout.selected_option_id === "BMC-REL-NONNUMERIC-27-B-KIND-SPECIFIC-PATH-CONSEQUENCE-POLICY" && closeout.n27_closeout.selection_receipt_sha256 === digestFile(n27OwnerSelectionPath) && closeout.n27_closeout.request_sha256 === digestFile(n27RequestPath) && closeout.n27_closeout.receipt_sha256 === digestFile(n27ReceiptPath) && closeout.n27_closeout.requestDigest === n27Receipt.requestDigest, "closeout N27 binding mismatch");
assert("closeout N28 sequencing", closeout.n28_sequencing.selected_membership_kind_id === "classification" && closeout.n28_sequencing.receipt_sha256 === digestFile(n28SequencingPath), "closeout N28 sequencing mismatch");
assert("closeout N28 denominator", closeout.n28_continuation_denominator.source_count === 6 && closeout.n28_continuation_denominator.manifest_sha256 === digestFile(n28ManifestPath) && closeout.n28_continuation_denominator.denominator_file_sha256 === digestFile(n28DenominatorPath) && closeout.n28_continuation_denominator.denominator_receipt_digest === n28Denominator.receipt_digest, "closeout N28 denominator mismatch");
assert("closeout N28 selection", closeout.n28_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n28SelectionPath) && closeout.n28_continuation_selection_fixed_point.pass_1_digest === n28Selection.pass_1_digest && closeout.n28_continuation_selection_fixed_point.pass_2_digest === n28Selection.pass_2_digest && closeout.n28_continuation_selection_fixed_point.fixed_point === true, "closeout N28 selection mismatch");
assert("closeout N28 selection receipt", closeout.n28_closeout.selected_option_id === expectedN28Presented[0] && closeout.n28_closeout.selection_receipt_sha256 === digestFile(n28OwnerSelectionPath) && closeout.n28_closeout.request_sha256 === digestFile(n28RequestPath) && closeout.n28_closeout.receipt_sha256 === digestFile(n28ReceiptPath) && closeout.n28_closeout.requestDigest === n28Receipt.requestDigest, "closeout N28 binding mismatch");
assert("closeout N29 denominator", closeout.n29_continuation_denominator.source_count === 6 && closeout.n29_continuation_denominator.manifest_sha256 === digestFile(n29ManifestPath) && closeout.n29_continuation_denominator.denominator_file_sha256 === digestFile(n29DenominatorPath) && closeout.n29_continuation_denominator.denominator_receipt_digest === n29Denominator.receipt_digest, "closeout N29 denominator mismatch");
assert("closeout N29 selection", closeout.n29_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n29SelectionPath) && closeout.n29_continuation_selection_fixed_point.pass_1_digest === n29Selection.pass_1_digest && closeout.n29_continuation_selection_fixed_point.pass_2_digest === n29Selection.pass_2_digest && closeout.n29_continuation_selection_fixed_point.fixed_point === true, "closeout N29 selection mismatch");
assert("closeout N29 selection receipt", closeout.n29_closeout.selected_option_id === expectedN29Presented[0] && closeout.n29_closeout.selection_receipt_sha256 === digestFile(n29OwnerPath) && closeout.n29_closeout.request_sha256 === digestFile(n29RequestPath) && closeout.n29_closeout.receipt_sha256 === digestFile(n29ReceiptPath) && closeout.n29_closeout.requestDigest === n29Receipt.requestDigest, "closeout N29 binding mismatch");
assert("closeout N30 denominator", closeout.n30_continuation_denominator.source_count === 9 && closeout.n30_continuation_denominator.manifest_sha256 === digestFile(n30ManifestPath) && closeout.n30_continuation_denominator.denominator_file_sha256 === digestFile(n30DenominatorPath) && closeout.n30_continuation_denominator.denominator_receipt_digest === n30Denominator.receipt_digest, "closeout N30 denominator mismatch");
assert("closeout N30 selection", closeout.n30_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n30SelectionPath) && closeout.n30_continuation_selection_fixed_point.pass_1_digest === n30Selection.pass_1_digest && closeout.n30_continuation_selection_fixed_point.pass_2_digest === n30Selection.pass_2_digest && closeout.n30_continuation_selection_fixed_point.fixed_point === true, "closeout N30 selection mismatch");
assert("closeout N30 selection receipt", closeout.n30_closeout.selected_option_id === expectedN30[0] && closeout.n30_closeout.selection_receipt_sha256 === digestFile(n30OwnerPath) && closeout.n30_closeout.request_sha256 === digestFile(n30RequestPath) && closeout.n30_closeout.receipt_sha256 === digestFile(n30ReceiptPath) && closeout.n30_closeout.requestDigest === n30Receipt.requestDigest, "closeout N30 binding mismatch");
assert("closeout N31 denominator", closeout.n31_continuation_denominator.source_count === 9 && closeout.n31_continuation_denominator.manifest_sha256 === digestFile(n31ManifestPath) && closeout.n31_continuation_denominator.denominator_file_sha256 === digestFile(n31DenominatorPath) && closeout.n31_continuation_denominator.denominator_receipt_digest === n31Denominator.receipt_digest, "closeout N31 denominator mismatch");
assert("closeout N31 selection", closeout.n31_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n31SelectionPath) && closeout.n31_continuation_selection_fixed_point.pass_1_digest === n31Selection.pass_1_digest && closeout.n31_continuation_selection_fixed_point.pass_2_digest === n31Selection.pass_2_digest && closeout.n31_continuation_selection_fixed_point.fixed_point === true, "closeout N31 selection mismatch");
assert("closeout N31 owner selection", closeout.n31_closeout.selected_option_id === expectedN31[0] && closeout.n31_closeout.selection_receipt_sha256 === digestFile(n31OwnerSelectionPath) && closeout.n31_closeout.request_sha256 === digestFile(n31RequestPath) && closeout.n31_closeout.receipt_sha256 === digestFile(n31ReceiptPath) && closeout.n31_closeout.requestDigest === n31Receipt.requestDigest, "closeout N31 binding mismatch");
assert("closeout N32 sequencing", closeout.n32_sequencing.selected_event_provenance_verb_id === "produces" && closeout.n32_sequencing.receipt_sha256 === digestFile(n32SequencingPath) && closeout.n32_sequencing.n32_behavior_selected === false, "closeout N32 sequencing mismatch");
assert("closeout N32 denominator", closeout.n32_continuation_denominator.source_count === 8 && closeout.n32_continuation_denominator.manifest_sha256 === digestFile(n32ManifestPath) && closeout.n32_continuation_denominator.denominator_file_sha256 === digestFile(n32DenominatorPath) && closeout.n32_continuation_denominator.denominator_receipt_digest === n32Denominator.receipt_digest, "closeout N32 denominator mismatch");
assert("closeout N32 selection", closeout.n32_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n32SelectionPath) && closeout.n32_continuation_selection_fixed_point.pass_1_digest === n32Selection.pass_1_digest && closeout.n32_continuation_selection_fixed_point.pass_2_digest === n32Selection.pass_2_digest && closeout.n32_continuation_selection_fixed_point.fixed_point === true, "closeout N32 selection mismatch");
assert("closeout N32 owner selection", closeout.n32_closeout.selected_option_id === expectedN32[0] && closeout.n32_closeout.selection_receipt_sha256 === digestFile(n32OwnerSelectionPath) && closeout.n32_closeout.request_sha256 === digestFile(n32RequestPath) && closeout.n32_closeout.receipt_sha256 === digestFile(n32ReceiptPath) && closeout.n32_closeout.requestDigest === n32Receipt.requestDigest, "closeout N32 binding mismatch");
assert("closeout N33 denominator", closeout.n33_continuation_denominator.source_count === 8 && closeout.n33_continuation_denominator.manifest_sha256 === digestFile(n33ManifestPath) && closeout.n33_continuation_denominator.denominator_file_sha256 === digestFile(n33DenominatorPath) && closeout.n33_continuation_denominator.denominator_receipt_digest === n33Denominator.receipt_digest, "closeout N33 denominator mismatch");
assert("closeout N33 selection", closeout.n33_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n33SelectionPath) && closeout.n33_continuation_selection_fixed_point.pass_1_digest === n33Selection.pass_1_digest && closeout.n33_continuation_selection_fixed_point.pass_2_digest === n33Selection.pass_2_digest && closeout.n33_continuation_selection_fixed_point.fixed_point === true, "closeout N33 selection mismatch");
assert("closeout N33 owner selection", closeout.n33_closeout.selected_option_id === expectedN33[0] && closeout.n33_closeout.selection_receipt_sha256 === digestFile(n33OwnerSelectionPath) && closeout.n33_closeout.request_sha256 === digestFile(n33RequestPath) && closeout.n33_closeout.receipt_sha256 === digestFile(n33ReceiptPath) && closeout.n33_closeout.requestDigest === n33Receipt.requestDigest, "closeout N33 binding mismatch");
assert("closeout N34 sequencing", closeout.n34_sequencing.exact_input === "emits + occurrence semantics" && closeout.n34_sequencing.selected_relation_id === "emits" && closeout.n34_sequencing.selected_facet_id === "occurrence_semantics" && closeout.n34_sequencing.receipt_sha256 === digestFile(n34SequencingPath) && closeout.n34_sequencing.behavior_selected === false, "closeout N34 sequencing mismatch");
assert("closeout N34 denominator", closeout.n34_continuation_denominator.source_count === 8 && closeout.n34_continuation_denominator.manifest_sha256 === digestFile(n34ManifestPath) && closeout.n34_continuation_denominator.denominator_file_sha256 === digestFile(n34DenominatorPath) && closeout.n34_continuation_denominator.denominator_receipt_digest === n34Denominator.receipt_digest, "closeout N34 denominator mismatch");
assert("closeout N34 selection fixed point", closeout.n34_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n34SelectionPath) && closeout.n34_continuation_selection_fixed_point.pass_1_digest === n34Selection.pass_1_digest && closeout.n34_continuation_selection_fixed_point.pass_2_digest === n34Selection.pass_2_digest && closeout.n34_continuation_selection_fixed_point.fixed_point === true, "closeout N34 selection mismatch");
assert("closeout N34 owner selection", closeout.n34_closeout.selected_option_id === expectedN34[0] && closeout.n34_closeout.selection_receipt_sha256 === digestFile(n34OwnerSelectionPath) && closeout.n34_closeout.request_sha256 === digestFile(n34RequestPath) && closeout.n34_closeout.receipt_sha256 === digestFile(n34ReceiptPath) && closeout.n34_closeout.requestDigest === n34Receipt.requestDigest, "closeout N34 binding mismatch");
assert("closeout N35 sequencing", closeout.n35_sequencing.exact_input === "emits + ordering" && closeout.n35_sequencing.selected_relation_id === "emits" && closeout.n35_sequencing.selected_facet_id === "ordering" && closeout.n35_sequencing.receipt_sha256 === digestFile(n35SequencingPath) && closeout.n35_sequencing.behavior_selected === false, "closeout N35 sequencing mismatch");
assert("closeout N35 denominator", closeout.n35_continuation_denominator.source_count === 8 && closeout.n35_continuation_denominator.manifest_sha256 === digestFile(n35ManifestPath) && closeout.n35_continuation_denominator.denominator_file_sha256 === digestFile(n35DenominatorPath) && closeout.n35_continuation_denominator.denominator_receipt_digest === n35Denominator.receipt_digest, "closeout N35 denominator mismatch");
assert("closeout N35 selection fixed point", closeout.n35_continuation_selection_fixed_point.selection_file_sha256 === digestFile(n35SelectionPath) && closeout.n35_continuation_selection_fixed_point.pass_1_digest === n35Selection.pass_1_digest && closeout.n35_continuation_selection_fixed_point.pass_2_digest === n35Selection.pass_2_digest && closeout.n35_continuation_selection_fixed_point.fixed_point === true, "closeout N35 selection mismatch");
assert("closeout N35 owner selection", closeout.n35_closeout.selected_option_id === expectedN35[0] && closeout.n35_closeout.selection_receipt_sha256 === digestFile(n35OwnerSelectionPath) && closeout.n35_closeout.request_sha256 === digestFile(n35RequestPath) && closeout.n35_closeout.receipt_sha256 === digestFile(n35ReceiptPath) && closeout.n35_closeout.requestDigest === n35Receipt.requestDigest, "closeout N35 binding mismatch");
assert("closeout current post-N35 clarification", closeout.current_decision === null && closeout.current_clarification.clarification_id === "BMC-REL-NONNUMERIC-POST-N35-SUBJECT-SEQUENCING-CLARIFICATION" && closeout.current_clarification.question.includes("remaining independently governed emits facet") && closeout.current_clarification.recommendation === null && closeout.current_clarification.selection === null && closeout.current_clarification.n36_gate_formed === false && closeout.current_clarification.authority_effect === "none", "closeout post-N35 clarification stale or selected");
assert("closeout authority ceiling", closeout.claim_ceiling.authority_effect === "none" && closeout.claim_ceiling.n32_owner_choice_made === true && closeout.claim_ceiling.produces_duplicate_policy_selected === true && closeout.claim_ceiling.exact_duplicate_produces_authorship_rejected === true && closeout.claim_ceiling.n33_gate_formed === true && closeout.claim_ceiling.n33_owner_choice_made === true && closeout.claim_ceiling.emits_duplicate_policy_selected === true && closeout.claim_ceiling.exact_duplicate_emits_authorship_rejected === true && closeout.claim_ceiling.event_provenance_duplicate_authorship_scope_closed === true && closeout.claim_ceiling.n34_gate_formed === true && closeout.claim_ceiling.n34_owner_choice_made === true && closeout.claim_ceiling.emits_occurrence_semantics_selected === true && closeout.claim_ceiling.concept_level_authored_fact_only === true && closeout.claim_ceiling.next_subject_selected === true && closeout.claim_ceiling.selected_relation === "emits" && closeout.claim_ceiling.selected_facet === "ordering" && closeout.claim_ceiling.n35_gate_formed === true && closeout.claim_ceiling.n35_owner_choice_made === true && closeout.claim_ceiling.emits_ordering_selected === true && closeout.claim_ceiling.emits_ordering_value === "not-applicable" && closeout.claim_ceiling.n36_gate_formed === false && closeout.claim_ceiling.inverse_applicability_source_determined === true && closeout.claim_ceiling.self_relation_applicability_source_determined === true && closeout.claim_ceiling.packet_accepted === false && closeout.claim_ceiling.implementation_authorized === false && closeout.claim_ceiling.promotion_or_publication_authorized === false, "closeout authority ceiling widened");
assert("closeout validation binding shape", closeout.validation.design_validation_sha256 === digestFile("DESIGN-VALIDATION.json") && closeout.validation.extractor_selector_prefilter_replays.includes("N35 byte-identical"), "closeout validation binding stale");
for (const [relative, expected] of closeout.changed_artifact_inventory) {
  assert(`closeout changed artifact ${relative}`, digestFile(relative) === expected, `expected ${expected}, got ${digestFile(relative)}`);
}
const transport = readJson("DESIGN-TRANSPORT-REPORT.json");
assert("transport N35 closed and clarification open", transport.closed_decisions.some((item) => item.decision_id === n35Receipt.decisionId && item.selected_option === expectedN35[0]) && transport.blocker_decision_id === null && transport.blocker_clarification_id === "BMC-REL-NONNUMERIC-POST-N35-SUBJECT-SEQUENCING-CLARIFICATION" && transport.blocker_selected_option === null, "transport lifecycle stale");
assert("transport current post-N35 clarification", transport.frontier_stop.status === "blocked-at-owner-clarification" && transport.frontier_stop.n35_gate_formed === true && transport.frontier_stop.n35_owner_choice_made === true && transport.frontier_stop.emits_ordering_selected === true && transport.frontier_stop.emits_ordering_value === "not-applicable" && transport.frontier_stop.n36_gate_formed === false && transport.frontier_stop.recommendation === null && transport.frontier_stop.selection === null && transport.frontier_stop.inverse_applicability_source_determined === true && transport.frontier_stop.self_relation_applicability_source_determined === true && transport.next_route === "owner-sequencing-clarification" && transport.authority_effect === "none", "transport post-N35 clarification widened or selected");
const rootHandoff = readJson("evidence/RUNTIME-HANDOFF.json");
assert("root current post-N35 handoff", rootHandoff.status === "blocked-at-owner-clarification" && rootHandoff.current_decision === null && rootHandoff.current_clarification === "BMC-REL-NONNUMERIC-POST-N35-SUBJECT-SEQUENCING-CLARIFICATION" && rootHandoff.selected_source_count === 8 && rootHandoff.sequenced_relation === "emits" && rootHandoff.sequenced_facet === "ordering" && rootHandoff.selected_option === expectedN35[0] && rootHandoff.presented_options.length === 0 && rootHandoff.last_closed_option === expectedN35[0] && rootHandoff.next_route === "owner-sequencing-clarification" && rootHandoff.recommendation === null && rootHandoff.n35_gate_formed === true && rootHandoff.n35_owner_choice_made === true && rootHandoff.emits_ordering_selected === true && rootHandoff.emits_ordering_value === "not-applicable" && rootHandoff.n36_gate_formed === false && rootHandoff.inverse_applicability_source_determined === true && rootHandoff.self_relation_applicability_source_determined === true && rootHandoff.authority_effect === "none", "root post-N35 handoff stale or selected");

const output = {
  schema_version: "domainspec.invoke.design-validation/v42",
  target_id: "BMC-REL-CONSTRAINT-COMPLETION",
  result: failures.length === 0 ? "pass" : "fail",
  check_count: checks.length,
  failure_count: failures.length,
  checks,
  failures,
  evidence: {
    n01_request_sha256: digestFile(n01RequestPath),
    n01_receipt_sha256: digestFile(n01ReceiptPath),
    n01_request_digest: n01Receipt.requestDigest,
    n01_selection_receipt_sha256: digestFile(n01SelectionPath),
    n02_request_sha256: digestFile(n02RequestPath),
    n02_receipt_sha256: digestFile(n02ReceiptPath),
    n02_request_digest: n02Receipt.requestDigest,
    n02_selection_receipt_sha256: digestFile(n02SelectionPath),
    n03_manifest_input_digest: manifest.input_digest,
    n03_denominator_receipt_digest: denominator.receipt_digest,
    n03_selection_result_digest: selection.result_digest,
    n03_pass_1_digest: selection.pass_1_digest,
    n03_pass_2_digest: selection.pass_2_digest,
    n03_request_digest: n03Receipt.requestDigest,
    n03_request_sha256: digestFile(n03RequestPath),
    n03_receipt_sha256: digestFile(n03ReceiptPath),
    n03_selection_receipt_sha256: digestFile(n03SelectionPath),
    n03_route: n03Receipt.routeOutcome,
    n04_manifest_input_digest: n04Manifest.input_digest,
    n04_denominator_receipt_digest: n04Denominator.receipt_digest,
    n04_selection_result_digest: n04Selection.result_digest,
    n04_pass_1_digest: n04Selection.pass_1_digest,
    n04_pass_2_digest: n04Selection.pass_2_digest,
    n04_request_digest: n04Receipt.requestDigest,
    n04_request_sha256: digestFile(n04RequestPath),
    n04_receipt_sha256: digestFile(n04ReceiptPath),
    n04_selection_receipt_sha256: digestFile(n04OwnerSelectionPath),
    n04_route: n04Receipt.routeOutcome,
    n05_manifest_input_digest: n05Manifest.input_digest,
    n05_denominator_receipt_digest: n05Denominator.receipt_digest,
    n05_selection_result_digest: n05Selection.result_digest,
    n05_pass_1_digest: n05Selection.pass_1_digest,
    n05_pass_2_digest: n05Selection.pass_2_digest,
    n05_request_digest: n05Receipt.requestDigest,
    n05_request_sha256: digestFile(n05RequestPath),
    n05_receipt_sha256: digestFile(n05ReceiptPath),
    n05_selection_receipt_sha256: digestFile(n05OwnerSelectionPath),
    n05_route: n05Receipt.routeOutcome,
    n06_manifest_input_digest: n06Manifest.input_digest,
    n06_denominator_receipt_digest: n06Denominator.receipt_digest,
    n06_selection_result_digest: n06Selection.result_digest,
    n06_pass_1_digest: n06Selection.pass_1_digest,
    n06_pass_2_digest: n06Selection.pass_2_digest,
    n06_request_digest: n06Receipt.requestDigest,
    n06_request_sha256: digestFile(n06RequestPath),
    n06_receipt_sha256: digestFile(n06ReceiptPath),
    n06_selection_receipt_sha256: digestFile(n06OwnerSelectionPath),
    n06_route: n06Receipt.routeOutcome,
    n07_manifest_input_digest: n07Manifest.input_digest,
    n07_denominator_receipt_digest: n07Denominator.receipt_digest,
    n07_selection_result_digest: n07Selection.result_digest,
    n07_pass_1_digest: n07Selection.pass_1_digest,
    n07_pass_2_digest: n07Selection.pass_2_digest,
    n07_request_digest: n07Receipt.requestDigest,
    n07_request_sha256: digestFile(n07RequestPath),
    n07_receipt_sha256: digestFile(n07ReceiptPath),
    n07_selection_receipt_sha256: digestFile(n07OwnerSelectionPath),
    n07_route: n07Receipt.routeOutcome,
    n08_manifest_input_digest: n08Manifest.input_digest,
    n08_denominator_receipt_digest: n08Denominator.receipt_digest,
    n08_selection_result_digest: n08Selection.result_digest,
    n08_pass_1_digest: n08Selection.pass_1_digest,
    n08_pass_2_digest: n08Selection.pass_2_digest,
    n08_request_digest: n08Receipt.requestDigest,
    n08_request_sha256: digestFile(n08RequestPath),
    n08_receipt_sha256: digestFile(n08ReceiptPath),
    n08_selection_receipt_sha256: digestFile(n08OwnerSelectionPath),
    n08_route: n08Receipt.routeOutcome,
    n09_manifest_input_digest: n09Manifest.input_digest,
    n09_denominator_receipt_digest: n09Denominator.receipt_digest,
    n09_selection_result_digest: n09Selection.result_digest,
    n09_pass_1_digest: n09Selection.pass_1_digest,
    n09_pass_2_digest: n09Selection.pass_2_digest,
    n09_request_digest: n09Receipt.requestDigest,
    n09_request_sha256: digestFile(n09RequestPath),
    n09_receipt_sha256: digestFile(n09ReceiptPath),
    n09_selection_receipt_sha256: digestFile(n09OwnerSelectionPath),
    n09_route: n09Receipt.routeOutcome,
    n10_manifest_input_digest: n10Manifest.input_digest,
    n10_denominator_receipt_digest: n10Denominator.receipt_digest,
    n10_selection_result_digest: n10Selection.result_digest,
    n10_pass_1_digest: n10Selection.pass_1_digest,
    n10_pass_2_digest: n10Selection.pass_2_digest,
    n10_request_digest: n10Receipt.requestDigest,
    n10_request_sha256: digestFile(n10RequestPath),
    n10_receipt_sha256: digestFile(n10ReceiptPath),
    n10_selection_receipt_sha256: digestFile(n10OwnerSelectionPath),
    n10_route: n10Receipt.routeOutcome,
    n11_manifest_input_digest: n11Manifest.input_digest,
    n11_denominator_receipt_digest: n11Denominator.receipt_digest,
    n11_selection_result_digest: n11Selection.result_digest,
    n11_pass_1_digest: n11Selection.pass_1_digest,
    n11_pass_2_digest: n11Selection.pass_2_digest,
    n11_request_digest: n11Receipt.requestDigest,
    n11_request_sha256: digestFile(n11RequestPath),
    n11_receipt_sha256: digestFile(n11ReceiptPath),
    n11_selection_receipt_sha256: digestFile(n11OwnerSelectionPath),
    n11_route: n11Receipt.routeOutcome,
    n12_manifest_input_digest: n12Manifest.input_digest,
    n12_denominator_receipt_digest: n12Denominator.receipt_digest,
    n12_selection_result_digest: n12Selection.result_digest,
    n12_pass_1_digest: n12Selection.pass_1_digest,
    n12_pass_2_digest: n12Selection.pass_2_digest,
    n12_request_digest: n12Receipt.requestDigest,
    n12_request_sha256: digestFile(n12RequestPath),
    n12_receipt_sha256: digestFile(n12ReceiptPath),
    n12_selection_receipt_sha256: digestFile(n12OwnerSelectionPath),
    n12_route: n12Receipt.routeOutcome,
    n13_manifest_input_digest: n13Manifest.input_digest,
    n13_denominator_receipt_digest: n13Denominator.receipt_digest,
    n13_selection_result_digest: n13Selection.result_digest,
    n13_pass_1_digest: n13Selection.pass_1_digest,
    n13_pass_2_digest: n13Selection.pass_2_digest,
    n13_request_digest: n13Receipt.requestDigest,
    n13_request_sha256: digestFile(n13RequestPath),
    n13_receipt_sha256: digestFile(n13ReceiptPath),
    n13_selection_receipt_sha256: digestFile(n13OwnerSelectionPath),
    n13_route: n13Receipt.routeOutcome,
    n14_sequencing_receipt_sha256: digestFile(n14SequencingPath),
    n14_manifest_input_digest: n14Manifest.input_digest,
    n14_denominator_receipt_digest: n14Denominator.receipt_digest,
    n14_selection_result_digest: n14Selection.result_digest,
    n14_pass_1_digest: n14Selection.pass_1_digest,
    n14_pass_2_digest: n14Selection.pass_2_digest,
    n14_request_digest: n14Receipt.requestDigest,
    n14_request_sha256: digestFile(n14RequestPath),
    n14_receipt_sha256: digestFile(n14ReceiptPath),
    n14_selection_receipt_sha256: digestFile(n14OwnerSelectionPath),
    n14_route: n14Receipt.routeOutcome,
    n15_sequencing_receipt_sha256: digestFile(n15SequencingPath),
    n15_manifest_input_digest: n15Manifest.input_digest,
    n15_denominator_receipt_digest: n15Denominator.receipt_digest,
    n15_selection_result_digest: n15Selection.result_digest,
    n15_pass_1_digest: n15Selection.pass_1_digest,
    n15_pass_2_digest: n15Selection.pass_2_digest,
    n15_request_digest: n15Receipt.requestDigest,
    n15_request_sha256: digestFile(n15RequestPath),
    n15_receipt_sha256: digestFile(n15ReceiptPath),
    n15_selection_receipt_sha256: digestFile(n15OwnerSelectionPath),
    n15_route: n15Receipt.routeOutcome,
    n16_manifest_input_digest: n16Manifest.input_digest,
    n16_denominator_receipt_digest: n16Denominator.receipt_digest,
    n16_selection_result_digest: n16Selection.result_digest,
    n16_pass_1_digest: n16Selection.pass_1_digest,
    n16_pass_2_digest: n16Selection.pass_2_digest,
    n16_request_digest: n16Receipt.requestDigest,
    n16_request_sha256: digestFile(n16RequestPath),
    n16_receipt_sha256: digestFile(n16ReceiptPath),
    n16_selection_receipt_sha256: digestFile(n16OwnerSelectionPath),
    n16_route: n16Receipt.routeOutcome,
    n17_manifest_input_digest: n17Manifest.input_digest,
    n17_denominator_receipt_digest: n17Denominator.receipt_digest,
    n17_selection_result_digest: n17Selection.result_digest,
    n17_pass_1_digest: n17Selection.pass_1_digest,
    n17_pass_2_digest: n17Selection.pass_2_digest,
    n17_request_digest: n17Receipt.requestDigest,
    n17_request_sha256: digestFile(n17RequestPath),
    n17_receipt_sha256: digestFile(n17ReceiptPath),
    n17_selection_receipt_sha256: digestFile(n17OwnerSelectionPath),
    n17_route: n17Receipt.routeOutcome,
    n18_manifest_input_digest: n18Manifest.input_digest,
    n18_denominator_receipt_digest: n18Denominator.receipt_digest,
    n18_selection_result_digest: n18Selection.result_digest,
    n18_pass_1_digest: n18Selection.pass_1_digest,
    n18_pass_2_digest: n18Selection.pass_2_digest,
    n18_request_digest: n18Receipt.requestDigest,
    n18_request_sha256: digestFile(n18RequestPath),
    n18_receipt_sha256: digestFile(n18ReceiptPath),
    n18_selection_receipt_sha256: digestFile(n18OwnerSelectionPath),
    n18_route: n18Receipt.routeOutcome,
    n19_manifest_input_digest: n19Manifest.input_digest,
    n19_denominator_receipt_digest: n19Denominator.receipt_digest,
    n19_selection_result_digest: n19Selection.result_digest,
    n19_pass_1_digest: n19Selection.pass_1_digest,
    n19_pass_2_digest: n19Selection.pass_2_digest,
    n19_request_digest: n19Receipt.requestDigest,
    n19_request_sha256: digestFile(n19RequestPath),
    n19_receipt_sha256: digestFile(n19ReceiptPath),
    n19_selection_receipt_sha256: digestFile(n19OwnerSelectionPath),
    n19_route: n19Receipt.routeOutcome,
    n20_manifest_input_digest: n20Manifest.input_digest,
    n20_denominator_receipt_digest: n20Denominator.receipt_digest,
    n20_selection_result_digest: n20Selection.result_digest,
    n20_pass_1_digest: n20Selection.pass_1_digest,
    n20_pass_2_digest: n20Selection.pass_2_digest,
    n20_request_digest: n20Receipt.requestDigest,
    n20_request_sha256: digestFile(n20RequestPath),
    n20_receipt_sha256: digestFile(n20ReceiptPath),
    n20_selection_receipt_sha256: digestFile(n20OwnerSelectionPath),
    n20_route: n20Receipt.routeOutcome,
    n21_manifest_input_digest: n21Manifest.input_digest,
    n21_denominator_receipt_digest: n21Denominator.receipt_digest,
    n21_selection_result_digest: n21Selection.result_digest,
    n21_pass_1_digest: n21Selection.pass_1_digest,
    n21_pass_2_digest: n21Selection.pass_2_digest,
    n21_request_digest: n21Receipt.requestDigest,
    n21_request_sha256: digestFile(n21RequestPath),
    n21_receipt_sha256: digestFile(n21ReceiptPath),
    n21_selection_receipt_sha256: digestFile(n21OwnerSelectionPath),
    n21_route: n21Receipt.routeOutcome,
    n22_manifest_input_digest: n22Manifest.input_digest,
    n22_denominator_receipt_digest: n22Denominator.receipt_digest,
    n22_selection_result_digest: n22Selection.result_digest,
    n22_pass_1_digest: n22Selection.pass_1_digest,
    n22_pass_2_digest: n22Selection.pass_2_digest,
    n22_request_digest: n22Receipt.requestDigest,
    n22_request_sha256: digestFile(n22RequestPath),
    n22_receipt_sha256: digestFile(n22ReceiptPath),
    n22_selection_receipt_sha256: digestFile(n22OwnerSelectionPath),
    n22_route: n22Receipt.routeOutcome,
    n23_manifest_input_digest: n23Manifest.input_digest,
    n23_denominator_receipt_digest: n23Denominator.receipt_digest,
    n23_selection_result_digest: n23Selection.result_digest,
    n23_pass_1_digest: n23Selection.pass_1_digest,
    n23_pass_2_digest: n23Selection.pass_2_digest,
    n23_request_digest: n23Receipt.requestDigest,
    n23_request_sha256: digestFile(n23RequestPath),
    n23_receipt_sha256: digestFile(n23ReceiptPath),
    n23_selection_receipt_sha256: digestFile(n23OwnerSelectionPath),
    n23_route: n23Receipt.routeOutcome,
    n24_manifest_input_digest: n24Manifest.input_digest,
    n24_denominator_receipt_digest: n24Denominator.receipt_digest,
    n24_selection_result_digest: n24Selection.result_digest,
    n24_pass_1_digest: n24Selection.pass_1_digest,
    n24_pass_2_digest: n24Selection.pass_2_digest,
    n24_request_digest: n24Receipt.requestDigest,
    n24_request_sha256: digestFile(n24RequestPath),
    n24_receipt_sha256: digestFile(n24ReceiptPath),
    n24_selection_receipt_sha256: digestFile(n24OwnerSelectionPath),
    n24_route: n24Receipt.routeOutcome,
    n25_manifest_input_digest: n25Manifest.input_digest,
    n25_denominator_receipt_digest: n25Denominator.receipt_digest,
    n25_selection_result_digest: n25Selection.result_digest,
    n25_pass_1_digest: n25Selection.pass_1_digest,
    n25_pass_2_digest: n25Selection.pass_2_digest,
    n25_request_digest: n25Receipt.requestDigest,
    n25_request_sha256: digestFile(n25RequestPath),
    n25_receipt_sha256: digestFile(n25ReceiptPath),
    n25_selection_receipt_sha256: digestFile(n25OwnerSelectionPath),
    n25_route: n25Receipt.routeOutcome,
    n26_manifest_input_digest: n26Manifest.input_digest,
    n26_denominator_receipt_digest: n26Denominator.receipt_digest,
    n26_selection_result_digest: n26Selection.result_digest,
    n26_pass_1_digest: n26Selection.pass_1_digest,
    n26_pass_2_digest: n26Selection.pass_2_digest,
    n26_request_digest: n26Receipt.requestDigest,
    n26_request_sha256: digestFile(n26RequestPath),
    n26_receipt_sha256: digestFile(n26ReceiptPath),
    n26_selection_receipt_sha256: digestFile(n26OwnerSelectionPath),
    n26_route: n26Receipt.routeOutcome,
    n27_manifest_input_digest: n27Manifest.input_digest,
    n27_denominator_receipt_digest: n27Denominator.receipt_digest,
    n27_selection_result_digest: n27Selection.result_digest,
    n27_pass_1_digest: n27Selection.pass_1_digest,
    n27_pass_2_digest: n27Selection.pass_2_digest,
    n27_request_digest: n27Receipt.requestDigest,
    n27_request_sha256: digestFile(n27RequestPath),
    n27_receipt_sha256: digestFile(n27ReceiptPath),
    n27_selection_receipt_sha256: digestFile(n27OwnerSelectionPath),
    n27_route: n27Receipt.routeOutcome,
    n28_sequencing_receipt_sha256: digestFile(n28SequencingPath),
    n28_manifest_input_digest: n28Manifest.input_digest,
    n28_denominator_receipt_digest: n28Denominator.receipt_digest,
    n28_selection_result_digest: n28Selection.result_digest,
    n28_pass_1_digest: n28Selection.pass_1_digest,
    n28_pass_2_digest: n28Selection.pass_2_digest,
    n28_request_digest: n28Receipt.requestDigest,
    n28_request_sha256: digestFile(n28RequestPath),
    n28_receipt_sha256: digestFile(n28ReceiptPath),
    n28_selection_receipt_sha256: digestFile(n28OwnerSelectionPath),
    n28_route: n28Receipt.routeOutcome,
    n29_manifest_input_digest: n29Manifest.input_digest,
    n29_denominator_receipt_digest: n29Denominator.receipt_digest,
    n29_selection_result_digest: n29Selection.result_digest,
    n29_pass_1_digest: n29Selection.pass_1_digest,
    n29_pass_2_digest: n29Selection.pass_2_digest,
    n29_request_digest: n29Receipt.requestDigest,
    n29_request_sha256: digestFile(n29RequestPath),
    n29_receipt_sha256: digestFile(n29ReceiptPath),
    n29_selection_receipt_sha256: digestFile(n29OwnerPath),
    n29_route: n29Receipt.routeOutcome,
    n30_manifest_input_digest: n30Manifest.input_digest,
    n30_denominator_receipt_digest: n30Denominator.receipt_digest,
    n30_selection_result_digest: n30Selection.result_digest,
    n30_pass_1_digest: n30Selection.pass_1_digest,
    n30_pass_2_digest: n30Selection.pass_2_digest,
    n30_request_digest: n30Receipt.requestDigest,
    n30_request_sha256: digestFile(n30RequestPath),
    n30_receipt_sha256: digestFile(n30ReceiptPath),
    n30_selection_receipt_sha256: digestFile(n30OwnerPath),
    n30_route: n30Receipt.routeOutcome,
    n31_manifest_input_digest: n31Manifest.input_digest,
    n31_denominator_receipt_digest: n31Denominator.receipt_digest,
    n31_selection_result_digest: n31Selection.result_digest,
    n31_pass_1_digest: n31Selection.pass_1_digest,
    n31_pass_2_digest: n31Selection.pass_2_digest,
    n31_request_digest: n31Receipt.requestDigest,
    n31_request_sha256: digestFile(n31RequestPath),
    n31_receipt_sha256: digestFile(n31ReceiptPath),
    n31_selection_receipt_sha256: digestFile(n31OwnerSelectionPath),
    n31_route: n31Receipt.routeOutcome,
    n32_sequencing_receipt_sha256: digestFile(n32SequencingPath),
    n32_manifest_input_digest: n32Manifest.input_digest,
    n32_denominator_receipt_digest: n32Denominator.receipt_digest,
    n32_selection_result_digest: n32Selection.result_digest,
    n32_pass_1_digest: n32Selection.pass_1_digest,
    n32_pass_2_digest: n32Selection.pass_2_digest,
    n32_request_digest: n32Receipt.requestDigest,
    n32_request_sha256: digestFile(n32RequestPath),
    n32_receipt_sha256: digestFile(n32ReceiptPath),
    n32_selection_receipt_sha256: digestFile(n32OwnerSelectionPath),
    n32_route: n32Receipt.routeOutcome,
    n33_manifest_input_digest: n33Manifest.input_digest,
    n33_denominator_receipt_digest: n33Denominator.receipt_digest,
    n33_selection_result_digest: n33Selection.result_digest,
    n33_pass_1_digest: n33Selection.pass_1_digest,
    n33_pass_2_digest: n33Selection.pass_2_digest,
    n33_request_digest: n33Receipt.requestDigest,
    n33_request_sha256: digestFile(n33RequestPath),
    n33_receipt_sha256: digestFile(n33ReceiptPath),
    n33_selection_receipt_sha256: digestFile(n33OwnerSelectionPath),
    n33_route: n33Receipt.routeOutcome,
    n34_sequencing_receipt_sha256: digestFile(n34SequencingPath),
    n34_manifest_input_digest: n34Manifest.input_digest,
    n34_denominator_receipt_digest: n34Denominator.receipt_digest,
    n34_selection_result_digest: n34Selection.result_digest,
    n34_pass_1_digest: n34Selection.pass_1_digest,
    n34_pass_2_digest: n34Selection.pass_2_digest,
    n34_request_digest: n34Receipt.requestDigest,
    n34_request_sha256: digestFile(n34RequestPath),
    n34_receipt_sha256: digestFile(n34ReceiptPath),
    n34_selection_receipt_sha256: digestFile(n34OwnerSelectionPath),
    n34_route: n34Receipt.routeOutcome,
    n35_sequencing_receipt_sha256: digestFile(n35SequencingPath),
    n35_manifest_input_digest: n35Manifest.input_digest,
    n35_denominator_receipt_digest: n35Denominator.receipt_digest,
    n35_selection_result_digest: n35Selection.result_digest,
    n35_pass_1_digest: n35Selection.pass_1_digest,
    n35_pass_2_digest: n35Selection.pass_2_digest,
    n35_request_digest: n35Receipt.requestDigest,
    n35_request_sha256: digestFile(n35RequestPath),
    n35_receipt_sha256: digestFile(n35ReceiptPath),
    n35_selection_receipt_sha256: digestFile(n35OwnerSelectionPath),
    n35_route: n35Receipt.routeOutcome,
    source_count: n35Manifest.source_contracts.length,
  },
  current_blocker: "BMC-REL-NONNUMERIC-POST-N35-SUBJECT-SEQUENCING-CLARIFICATION",
  selected_option: null,
  last_closed_selection: expectedN35[0],
  path_scope: "sequencing among remaining independently governed emits facets after N35 A",
  frontier_derivation: "N35 A closes Design-surface ordering as not-applicable; inverse and same-concept self-relation applicability are source-determined; exact sources provide no priority among the remaining independent emits subjects",
  belongs_to_self_edge_behavior_selected: true,
  belongs_to_longer_cycle_governance_selected: true,
  belongs_to_longer_cycle_behavior_selected: true,
  belongs_to_mixed_kind_closed_path_behavior_selected: true,
  belongs_to_duplicate_authorship_selected: true,
  belongs_to_same_kind_cycle_partial_view_verdict_selected: true,
  belongs_to_same_kind_cycle_closure_proof_shape_selected: true,
  belongs_to_path_consequence_governance_selected: true,
  belongs_to_path_consequence_behavior_selected: true,
  classification_path_behavior_selected: true,
  home_assignment_path_behavior_selected: true,
  mixed_kind_path_behavior_selected: true,
  equal_endpoint_mixed_closed_path_self_reachability_selected: true,
  first_membership_kind_selected: true,
  selected_membership_kind: "classification",
  next_gate_formed: false,
  n28_owner_choice_made: true,
  n29_owner_choice_made: true,
  n30_owner_choice_made: true,
  n31_owner_choice_made: true,
  n32_owner_choice_made: true,
  n33_owner_choice_made: true,
  n34_gate_formed: true,
  n34_owner_choice_made: true,
  event_provenance_verb_selected: true,
  selected_event_provenance_verb: "produces",
  current_event_provenance_verb: "emits",
  current_facet: "ordering",
  produces_duplicate_policy_selected: true,
  exact_duplicate_produces_authorship_rejected: true,
  emits_duplicate_policy_selected: true,
  exact_duplicate_emits_authorship_rejected: true,
  event_provenance_duplicate_authorship_scope_closed: true,
  emits_occurrence_semantics_selected: true,
  concept_level_authored_fact_only: true,
  n35_gate_formed: true,
  n35_owner_choice_made: true,
  emits_ordering_selected: true,
  emits_ordering_value: "not-applicable",
  ordered_candidate_admissible: false,
  unordered_candidate_admissible: false,
  not_applicable_candidate_admissible: true,
  n36_gate_formed: false,
  inverse_applicability_source_determined: true,
  self_relation_applicability_source_determined: true,
  next_clarification_required: true,
  authority_effect: "none",
};

const outputArg = process.argv.indexOf("--output");
if (outputArg >= 0 && process.argv[outputArg + 1]) {
  fs.writeFileSync(path.resolve(process.argv[outputArg + 1]), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}
console.log(`${output.result.toUpperCase()}: ${output.check_count} checks, ${output.failure_count} failures`);
for (const failure of failures) console.error(`FAIL: ${failure}`);
process.exit(failures.length === 0 ? 0 : 1);
