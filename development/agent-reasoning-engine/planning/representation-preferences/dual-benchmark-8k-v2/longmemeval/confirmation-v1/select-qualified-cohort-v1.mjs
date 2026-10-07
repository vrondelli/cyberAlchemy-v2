#!/usr/bin/env node
// Provider-free, create-only selection of the frozen four-task LongMemEval cohort.
import {createHash} from "node:crypto";
import {closeSync, constants, fsyncSync, linkSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

const EXPECTED = Object.freeze({
  selector: "499c6b7ca3afe59f15548b0930a1b5011fd358008d932b11a85cdef8baf73d7b",
  queue: "145236349ea9ac4cccec0d4fe36dc5f744c7ccda43ae650428012f0038b9ffb1",
  qualifications: "864649bc2577feb1eea02a8e4953627191ec3db3884dc4b2f6afd362438b0d3f",
  results: "533d9f5d8ebe3c329b66872def60377bad732300c516355383a5440c7143f74f",
  qualification_set: "5705cfe6513bcd57047c22419d0b634856e1e0c2ebe13a92aad61bd26471d37b",
  qualifier: "5882f4501b5f5365c05cef1d1ee1b8c3b873e0859e27a035bbef9c6aac71af0c",
});
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const sha = (value) => createHash("sha256").update(Buffer.isBuffer(value) ? value : stable(value)).digest("hex");
const fail = (code) => { throw new Error(code); };

function exactRead(path, expected, code) {
  const bytes = readFileSync(path);
  if (sha(bytes) !== expected) fail(code);
  return bytes;
}

function publish(path, value) {
  const parent = dirname(path);
  mkdirSync(parent, {recursive: true, mode: 0o755});
  const temporary = `${path}.${process.pid}.tmp`;
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const descriptor = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o444);
  try { writeFileSync(descriptor, bytes); fsyncSync(descriptor); } finally { closeSync(descriptor); }
  try {
    linkSync(temporary, path);
    const directory = openSync(parent, constants.O_RDONLY | constants.O_DIRECTORY);
    try { fsyncSync(directory); } finally { closeSync(directory); }
  } finally { try { unlinkSync(temporary); } catch {} }
}

export async function select(selectorPath, queuePath, qualificationPath, resultsPath, outputPath, expectedMaterializerSha256) {
  if (!/^[a-f0-9]{64}$/.test(expectedMaterializerSha256 ?? "") || sha(readFileSync(process.argv[1])) !== expectedMaterializerSha256) fail("cohort-selector.materializer-drift");
  const selectorBytes = exactRead(selectorPath, EXPECTED.selector, "cohort-selector.selector-drift");
  const queueBytes = exactRead(queuePath, EXPECTED.queue, "cohort-selector.queue-drift");
  const qualificationBytes = exactRead(qualificationPath, EXPECTED.qualifications, "cohort-selector.qualifications-drift");
  const resultsBytes = exactRead(resultsPath, EXPECTED.results, "cohort-selector.results-drift");
  const queue = JSON.parse(queueBytes);
  const qualifications = JSON.parse(qualificationBytes);
  const results = JSON.parse(resultsBytes);
  if (results.status !== "measured" || results.calls !== 32 || results.calls_exact !== true || results.all_usage_known !== true || results.long_history_count !== 32 || results.model_calls !== 0 || results.automatic_retries !== 0 || results.credentials_crossed_gateway_boundary !== false || results.evaluator_fields_accessed !== false || results.qualification_set_sha256 !== EXPECTED.qualification_set || results.qualifier_sha256 !== EXPECTED.qualifier || sha(qualifications) !== EXPECTED.qualification_set) fail("cohort-selector.qualification-result-invalid");
  const module = await import(`data:text/javascript;base64,${selectorBytes.toString("base64")}`);
  const cohort = module.selectTokenizerQualifiedCohort(queue, qualifications, {size: 4});
  const material = {
    schema_version: "are.longmemeval-qualified-cohort-selection/v1",
    cohort,
    inputs: {materializer_sha256: expectedMaterializerSha256, selector_sha256: EXPECTED.selector, queue_file_sha256: EXPECTED.queue, qualifications_file_sha256: EXPECTED.qualifications, results_file_sha256: EXPECTED.results, qualification_set_sha256: EXPECTED.qualification_set, qualifier_sha256: EXPECTED.qualifier},
    selection_provider_calls: 0,
    evaluator_fields_accessed: false,
    authority_effect: "none",
  };
  const receipt = {...material, selection_sha256: sha(material)};
  publish(outputPath, receipt);
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  if (process.argv.length !== 8) fail("usage: select-qualified-cohort-v1.mjs SELECTOR QUEUE QUALIFICATIONS RESULTS OUTPUT EXPECTED_MATERIALIZER_SHA256");
  const receipt = await select(...process.argv.slice(2));
  process.stdout.write(`${JSON.stringify({status: "selected", cohort_size: receipt.cohort.cohort_size, cohort_sha256: receipt.cohort.cohort_sha256, selection_sha256: receipt.selection_sha256, selection_provider_calls: 0})}\n`);
}
