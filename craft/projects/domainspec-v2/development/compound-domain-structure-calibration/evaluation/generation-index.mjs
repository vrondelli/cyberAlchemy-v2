import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";

export const GENERATION_INDEX_SCHEMA = "cdsc.generation-index.v1";

export function createGenerationIndex() {
  return {
    schema_version: GENERATION_INDEX_SCHEMA,
    entries: [],
  };
}

export function validateGenerationIndex(index) {
  if (index === null || typeof index !== "object" || Array.isArray(index)) throw new TypeError("generation index must be an object");
  if (index.schema_version !== GENERATION_INDEX_SCHEMA) throw new TypeError("unsupported generation index schema");
  if (!Array.isArray(index.entries)) throw new TypeError("generation index entries must be an array");
  const ids = new Set();
  let predecessor = null;
  for (const entry of index.entries) {
    validateGenerationEntry(entry);
    if (ids.has(entry.generation_id)) throw new TypeError("duplicate generation id");
    if (entry.predecessor_generation_id !== predecessor) throw new TypeError("predecessor conflict");
    ids.add(entry.generation_id);
    predecessor = entry.generation_id;
  }
  return true;
}

export function appendGeneration(index, entry) {
  validateGenerationIndex(index);
  validateGenerationEntry(entry);
  if (index.entries.some((existing) => existing.generation_id === entry.generation_id)) {
    throw new TypeError("duplicate generation id");
  }
  const expectedPredecessor = index.entries.length === 0 ? null : index.entries.at(-1).generation_id;
  if (entry.predecessor_generation_id !== expectedPredecessor) throw new TypeError("predecessor conflict");
  const output = structuredClone(index);
  output.entries.push(structuredClone(entry));
  validateGenerationIndex(output);
  return output;
}

export function appendGenerationFile(filePath, entry) {
  const current = existsSync(filePath) ? JSON.parse(readFileSync(filePath, "utf8")) : createGenerationIndex();
  const output = appendGeneration(current, entry);
  const temporary = `${filePath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporary, `${JSON.stringify(output, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    renameSync(temporary, filePath);
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
  return output;
}

export function generationEntryFromSuite(suiteResult, fixtureResults) {
  if (!Array.isArray(fixtureResults) || fixtureResults.length !== 3) {
    throw new TypeError("generation entry requires three fixture results");
  }
  const fixtureHandles = fixtureResults.map((result) => result.record_id).sort();
  if (new Set(fixtureHandles).size !== 3) throw new TypeError("fixture result handles must be unique");
  return {
    generation_id: suiteResult.generation_id,
    predecessor_generation_id: suiteResult.predecessor_generation_id,
    suite_result_handle: suiteResult.record_id,
    fixture_result_handles: fixtureHandles,
    semantic_result_digest: suiteResult.content_digest,
  };
}

function validateGenerationEntry(entry) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError("generation entry must be an object");
  requirePattern(entry.generation_id, /^generation:sha256:[a-f0-9]{64}$/, "generation id");
  if (entry.predecessor_generation_id !== null) {
    requirePattern(entry.predecessor_generation_id, /^generation:sha256:[a-f0-9]{64}$/, "predecessor generation id");
  }
  requirePattern(entry.suite_result_handle, /^record:sha256:[a-f0-9]{64}$/, "suite result handle");
  requirePattern(entry.semantic_result_digest, /^sha256:[a-f0-9]{64}$/, "semantic result digest");
  if (!Array.isArray(entry.fixture_result_handles) || entry.fixture_result_handles.length !== 3) {
    throw new TypeError("fixture result handles must contain three entries");
  }
  const sorted = [...entry.fixture_result_handles].sort();
  if (new Set(sorted).size !== 3 || sorted.some((value, index) => value !== entry.fixture_result_handles[index])) {
    throw new TypeError("fixture result handles must be sorted and unique");
  }
  for (const handle of sorted) requirePattern(handle, /^record:sha256:[a-f0-9]{64}$/, "fixture result handle");
}

function requirePattern(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value)) throw new TypeError(`${label} has invalid format`);
}
