import {readFileSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve} from "node:path";

import {sha256} from "./common.mjs";

const PREDICTION_SCHEMA = "are.external-retrieval-prediction/v1";
const TOKEN_RE = /[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[^A-Za-z0-9_\s]/gu;
const WORD_RE = /[A-Za-z0-9]+/g;
const TEST_PARTS = new Set(["__tests__", "test", "tests", "testing", "testdata", "testsuite", "testsuites"]);

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }

function parseJsonl(bytes, label) {
  return bytes.toString("utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); } catch (error) { throw new Error(`${label}:${index + 1}: ${error.message}`); }
  });
}

function safePath(value, label) {
  if (!nonEmpty(value)) throw new Error(`${label}: missing repository-relative path`);
  const path = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.startsWith("/") || path.split("/").includes("..")) throw new Error(`${label}: unsafe repository path`);
  return path;
}

function inside(root, path) {
  const offset = relative(root, path);
  return offset === "" || (!offset.startsWith("..") && !isAbsolute(offset));
}

function corpusPath(root, value, label) {
  if (!nonEmpty(value)) throw new Error(`${label}: missing chunks_path`);
  const candidate = resolve(root, value);
  if (!inside(root, candidate)) throw new Error(`${label}: chunks_path escapes corpus directory`);
  const path = realpathSync(candidate);
  if (!inside(root, path)) throw new Error(`${label}: chunks_path symlink escapes corpus directory`);
  return path;
}

function tokens(value) {
  const spaced = String(value ?? "").replace(/([a-z])([A-Z])/g, "$1 $2");
  return (spaced.match(WORD_RE) ?? []).map((token) => token.toLowerCase());
}

function tokenCount(value) { return String(value ?? "").match(TOKEN_RE)?.length ?? 0; }

function isTestPath(path) {
  const lowered = path.toLowerCase();
  const parts = lowered.split("/");
  const basename = parts.at(-1) ?? "";
  return parts.some((part) => TEST_PARTS.has(part)) || basename.startsWith("test_") || /(?:_test|\.test|\.spec)\.[a-z0-9]+$/.test(basename) || /tests?\.(?:java|cs)$/.test(basename);
}

function isNoisePath(path) {
  const parts = path.toLowerCase().split("/");
  const basename = parts.at(-1) ?? "";
  return parts.some((part) => ["node_modules", "vendor", "docs", "documentation", "examples", "snapshots"].includes(part)) || /^(?:readme|license|changelog)(?:\.|$)/.test(basename);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function queryText(sample) { return JSON.stringify(canonical(sample.query ?? {})); }

function requestAnchors(sample) {
  const query = sample.query ?? {};
  const candidates = [
    query.changed_file,
    query.given_file,
    query.anchor_file,
    query.path,
    ...(Array.isArray(query.changed_files) ? query.changed_files : []),
    ...(Array.isArray(query.given_files) ? query.given_files : []),
    ...(Array.isArray(query.implementation_files) ? query.implementation_files : []),
  ];
  return new Set(candidates.filter(nonEmpty).map((path) => safePath(path, `${sample.id}:query-anchor`)));
}

function loadManifest(corpusRoot) {
  const manifestPath = resolve(corpusRoot, "corpus_manifest.jsonl");
  const bytes = readFileSync(manifestPath);
  const entries = new Map();
  for (const [index, row] of parseJsonl(bytes, manifestPath).entries()) {
    if (row.status && row.status !== "ok") continue;
    if (!nonEmpty(row.repo) || !nonEmpty(row.base_commit)) throw new Error(`${manifestPath}:${index + 1}: invalid corpus identity`);
    const key = `${row.repo}\0${row.base_commit}`;
    if (entries.has(key)) throw new Error(`${manifestPath}:${index + 1}: duplicate corpus identity`);
    entries.set(key, corpusPath(corpusRoot, row.chunks_path, `${manifestPath}:${index + 1}`));
  }
  return {manifestPath, bytes, entries};
}

function loadFiles(chunksPath, repo, baseCommit, maximumFiles) {
  const bytes = readFileSync(chunksPath);
  const fullFiles = new Map();
  const fragments = new Map();
  for (const [index, row] of parseJsonl(bytes, chunksPath).entries()) {
    if ((row.repo && row.repo !== repo) || (row.base_commit && row.base_commit !== baseCommit)) throw new Error(`${chunksPath}:${index + 1}: corpus binding mismatch`);
    const path = safePath(row.path, `${chunksPath}:${index + 1}`);
    const text = String(row.text ?? "");
    if (row.kind === "file") fullFiles.set(path, text);
    else if (!fullFiles.has(path)) fragments.set(path, [...(fragments.get(path) ?? []), text]);
  }
  const paths = [...new Set([...fullFiles.keys(), ...fragments.keys()])].sort();
  if (paths.length === 0) throw new Error(`${chunksPath}: empty corpus`);
  if (paths.length > maximumFiles) throw new Error(`${chunksPath}: corpus exceeds maximum_files_per_snapshot`);
  return {
    digest: sha256(bytes),
    files: paths.map((path) => ({path, text: fullFiles.get(path) ?? fragments.get(path).join("\n")})),
  };
}

function prepareIndex(files, settings) {
  const documents = files.map((file) => {
    const documentTokens = tokens(`${file.path}\n${file.text.slice(0, settings.maximum_content_characters)}`);
    const termCounts = new Map();
    for (const token of documentTokens) termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
    return {...file, tokens: documentTokens, term_counts: termCounts};
  });
  const frequencies = new Map();
  const lengths = documents.map((document) => document.tokens.length);
  for (const document of documents) for (const token of new Set(document.tokens)) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  const averageLength = lengths.reduce((sum, length) => sum + length, 0) / Math.max(1, lengths.length);
  return {documents, frequencies, averageLength};
}

function bm25(queryTokens, index) {
  const {documents, frequencies, averageLength} = index;
  const queryCounts = new Map();
  for (const token of queryTokens) queryCounts.set(token, (queryCounts.get(token) ?? 0) + 1);
  return documents.map((document) => {
    let score = 0;
    for (const [token, queryCount] of queryCounts) {
      const tf = document.term_counts.get(token) ?? 0;
      if (tf === 0) continue;
      const df = frequencies.get(token) ?? 0;
      const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
      const normalization = 0.25 + 0.75 * (document.tokens.length / Math.max(1, averageLength));
      score += queryCount * idf * ((tf * 2.5) / (tf + 1.5 * normalization));
    }
    return score;
  });
}

function rank(sample, index, settings) {
  const query = queryText(sample);
  const queryTokens = tokens(query);
  const anchors = requestAnchors(sample);
  const anchorTokens = new Set([...anchors].flatMap(tokens).filter((token) => token.length > 2));
  const semanticScores = bm25(queryTokens, index);
  const ranked = index.documents.map((document, documentIndex) => {
    const pathTokens = new Set(tokens(document.path));
    const sharedAnchorTokens = [...anchorTokens].filter((token) => pathTokens.has(token)).length;
    let score = semanticScores[documentIndex] + sharedAnchorTokens * settings.anchor_token_bonus;
    if (query.toLowerCase().includes(document.path.toLowerCase())) score += settings.explicit_path_bonus;
    if (sample.task_type === "code2test") score += isTestPath(document.path) ? settings.task_path_bonus : -settings.task_path_penalty;
    if (["trace2code", "testlog2code"].includes(sample.task_type)) score += isTestPath(document.path) ? -settings.task_path_penalty : settings.task_path_bonus;
    if (isNoisePath(document.path)) score -= settings.noise_penalty;
    if (anchors.has(document.path)) score = Number.NEGATIVE_INFINITY;
    return {path: document.path, text: document.text, score};
  }).filter((entry) => Number.isFinite(entry.score)).sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  return ranked;
}

function produceOne(sample, index, settings) {
  const ranked = rank(sample, index, settings);
  const topScore = ranked[0]?.score ?? 0;
  const secondScore = ranked[1]?.score ?? 0;
  const decision = topScore >= settings.minimum_score && topScore - secondScore >= settings.minimum_margin ? "retrieve" : "abstain";
  const selected = decision === "retrieve" ? ranked.slice(0, settings.maximum_ranked_files) : [];
  return {
    schema_version: PREDICTION_SCHEMA,
    sample_id: sample.id,
    repo: sample.repo,
    base_commit: sample.base_commit,
    decision,
    ranked_files: selected.map((file) => ({path: file.path, header_tokens: tokenCount(`### ${file.path}\n`), content_tokens: tokenCount(file.text)})),
  };
}

export function produceExternalRetrievalPredictions(profile, options) {
  if (!nonEmpty(options.dataset_id) || !nonEmpty(options.dataset_revision)) throw new Error("External retrieval dataset identity and revision are required");
  const datasetPath = resolve(options.dataset);
  const corpusRoot = realpathSync(resolve(options.corpus_dir));
  const datasetBytes = readFileSync(datasetPath);
  const samples = parseJsonl(datasetBytes, datasetPath);
  const ids = new Set();
  for (const [index, sample] of samples.entries()) {
    if (!nonEmpty(sample.id) || !nonEmpty(sample.repo) || !nonEmpty(sample.base_commit) || !nonEmpty(sample.task_type) || typeof sample.query !== "object" || sample.query === null) throw new Error(`${datasetPath}:${index + 1}: invalid retrieval sample`);
    if (ids.has(sample.id)) throw new Error(`${datasetPath}:${index + 1}: duplicate sample ${sample.id}`);
    ids.add(sample.id);
  }
  const {manifestPath, bytes: manifestBytes, entries} = loadManifest(corpusRoot);
  const settings = profile.external_retrieval.producer;
  for (const key of ["maximum_ranked_files", "maximum_files_per_snapshot", "maximum_content_characters"]) {
    if (!Number.isSafeInteger(settings[key]) || settings[key] < 1) throw new Error(`Invalid external retrieval producer setting: ${key}`);
  }
  for (const key of ["minimum_score", "minimum_margin", "anchor_token_bonus", "explicit_path_bonus", "task_path_bonus", "task_path_penalty", "noise_penalty"]) {
    if (!Number.isFinite(settings[key]) || settings[key] < 0) throw new Error(`Invalid external retrieval producer setting: ${key}`);
  }
  const dependencies = [];
  const groups = new Map();
  samples.forEach((sample, sampleIndex) => {
    const key = `${sample.repo}\0${sample.base_commit}`;
    groups.set(key, [...(groups.get(key) ?? []), {sample, sampleIndex}]);
  });
  const predictions = new Array(samples.length);
  for (const [key, pending] of groups) {
    const {sample: representative} = pending[0];
    const chunksPath = entries.get(key);
    const sampleIds = pending.map(({sample}) => sample.id).join(",");
    if (!chunksPath) throw new Error(`${sampleIds}: missing exact corpus snapshot`);
    const loaded = loadFiles(chunksPath, representative.repo, representative.base_commit, settings.maximum_files_per_snapshot);
    const index = prepareIndex(loaded.files, settings);
    dependencies.push({repo: representative.repo, base_commit: representative.base_commit, chunks_sha256: loaded.digest});
    for (const {sample, sampleIndex} of pending) predictions[sampleIndex] = produceOne(sample, index, settings);
  }
  dependencies.sort((left, right) => left.repo.localeCompare(right.repo) || left.base_commit.localeCompare(right.base_commit));
  const predictionBytes = Buffer.from(`${predictions.map((prediction) => JSON.stringify(prediction)).join("\n")}\n`);
  return {
    prediction_bytes: predictionBytes,
    predictions,
    receipt: {
      schema_version: "are.external-retrieval-production/v1",
      producer: "are-hybrid-lexical-v1",
      dataset_id: options.dataset_id,
      dataset_revision: options.dataset_revision,
      dataset_sha256: sha256(datasetBytes),
      corpus_manifest: manifestPath,
      corpus_manifest_sha256: sha256(manifestBytes),
      selected_snapshot_count: dependencies.length,
      selected_dependencies_sha256: sha256(Buffer.from(JSON.stringify(dependencies))),
      predictions_sha256: sha256(predictionBytes),
      samples: predictions.length,
      retrieved: predictions.filter((prediction) => prediction.decision === "retrieve").length,
      abstained: predictions.filter((prediction) => prediction.decision === "abstain").length,
      tokenizer: "regex_code_tokenizer_v1",
      gold_access: "forbidden-and-unused",
      authority_effect: "none",
    },
  };
}
