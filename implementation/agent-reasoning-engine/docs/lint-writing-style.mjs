#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const policyPath = resolve(docsRoot, "writing-style-policy.json");
const reviewPath = resolve(docsRoot, "writing-style-review.json");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const stableJson = value => `${JSON.stringify(value, null, 2)}\n`;

const lexicalRules = [
  ["no-marketing-adjective", /\b(?:seamless|robust|powerful|cutting-edge|effortless|blazing-fast)\b/iu],
  ["no-soft-phrasal-verb", /\b(?:spin up|reach out|dive into|kick off|set up|tear down|shut down|look up|carry out)\b/iu],
  ["prefer-verb-over-nominalization", /\b(?:perform|conduct|make|provide)\s+(?:an?\s+)?(?:analysis|assessment|evaluation|review|verification|validation|implementation|investigation|inspection|decision|selection|configuration|assistance)\b/iu],
  ["no-hedge-stack", /\b(?:may|might|could|potentially|possibly|perhaps)(?:\s+\w+){0,3}\s+(?:may|might|could|potentially|possibly|perhaps)\b/iu],
];

const instructionVerbs = new Set([
  "add", "analyze", "apply", "bind", "build", "call", "check", "choose",
  "classify", "clean", "close", "compare", "complete", "configure", "confirm",
  "contact", "copy", "create", "define", "delete", "deploy", "disable",
  "document", "enable", "ensure", "execute", "export", "extract", "follow",
  "freeze", "generate", "identify", "inspect", "install", "keep", "limit",
  "load", "mark", "measure", "move", "open", "preserve", "publish", "read",
  "record", "remove", "repeat", "replace", "report", "resolve", "restore",
  "retain", "review", "rotate", "run", "save", "select", "set", "sign",
  "start", "stop", "store", "test", "update", "use", "validate", "verify",
  "wait", "write"
]);

const passiveVoice = /\b(?:is|are|was|were|be|been|being)\s+(?:not\s+)?(?:\w+ly\s+)?(?:[a-z]+ed|built|bound|brought|done|found|given|held|kept|known|made|read|run|sent|set|shown|taken|written)\b/iu;
const compoundTense = /\b(?:has|have|had)\s+(?:not\s+)?(?:been\s+)?(?:[a-z]+ed|built|bound|brought|done|found|given|held|kept|known|made|read|run|sent|set|shown|taken|written)\b/iu;

function visibleText(source) {
  return source
    .replace(/`[^`]*`/gu, "CODE")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replace(/<https?:\/\/[^>]+>/gu, "URL")
    .replace(/https?:\/\/\S+/gu, "URL")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\*\*|__/gu, "");
}

function wordCount(source) {
  return source.match(/\b[A-Za-z0-9][\w'/-]*\b/gu)?.length ?? 0;
}

function sentenceParts(source) {
  return source.split(/(?<=[.!?])(?:["”’)]*)\s+(?=[A-Z0-9`[])/gu).filter(Boolean);
}

export function selectDocumentationFiles({manifestPath = resolve(docsRoot, "manifest.json")} = {}) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const declared = manifest.documents
    .map(document => resolve(docsRoot, document))
    .filter(path => path.endsWith(".md") && existsSync(path));
  const entries = ["DOCUMENTATION.md"]
    .map(path => resolve(productRoot, path))
    .filter(existsSync);
  return [...new Set([...declared, ...entries])].sort();
}

function markdownBlocks(source) {
  const blocks = [];
  let current = null;
  let fenced = false;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };
  source.split(/\r?\n/u).forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(?:```|~~~)/u.test(trimmed)) {
      flush();
      fenced = !fenced;
      return;
    }
    if (fenced || !trimmed || trimmed.startsWith("|") || trimmed.startsWith("<!--") || trimmed.startsWith(">")) {
      flush();
      return;
    }
    const startsBlock = /^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/u.test(trimmed);
    if (startsBlock) flush();
    if (!current) current = {line: index + 1, text: trimmed};
    else current.text += ` ${trimmed}`;
  });
  flush();
  return blocks;
}

function finding(rule, severity, file, line, text, details = {}) {
  return {rule, severity, file, line, text, ...details};
}

export function lintWritingStyle({files = selectDocumentationFiles(), policy = JSON.parse(readFileSync(policyPath, "utf8"))} = {}) {
  const findings = [];
  let proseWords = 0;
  let sentenceCount = 0;
  for (const absolute of files) {
    const file = relative(productRoot, absolute).replaceAll("\\", "/");
    for (const block of markdownBlocks(readFileSync(absolute, "utf8"))) {
      const text = visibleText(block.text.replace(/^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/u, ""));
      proseWords += wordCount(text);
      if (text.includes(";")) findings.push(finding("no-semicolon", "hard", file, block.line, text));
      if (/\b(?:And|Or)\s*\.?$/u.test(text)) findings.push(finding("no-dangling-list-conjunction", "hard", file, block.line, text));
      for (const [rule, pattern] of lexicalRules) {
        if (pattern.test(text)) findings.push(finding(rule, "hard", file, block.line, text));
      }
      const sentences = sentenceParts(text);
      if (sentences.length > policy.limits.paragraph_sentences) {
        findings.push(finding("paragraph-length", "hard", file, block.line, text, {actual: sentences.length, limit: policy.limits.paragraph_sentences}));
      }
      for (const sentence of sentences) {
        const words = wordCount(sentence);
        if (!words) continue;
        sentenceCount += 1;
        const first = sentence.match(/[A-Za-z]+/u)?.[0]?.toLowerCase();
        const instruction = instructionVerbs.has(first);
        const limit = instruction ? policy.limits.instruction_sentence_words : policy.limits.description_sentence_words;
        if (words > limit) {
          findings.push(finding(instruction ? "instruction-sentence-length" : "description-sentence-length", "hard", file, block.line, sentence, {actual: words, limit}));
        }
        if (passiveVoice.test(sentence)) findings.push(finding("prefer-active-voice", "review", file, block.line, sentence));
        if (compoundTense.test(sentence)) findings.push(finding("simple-tense-review", "review", file, block.line, sentence));
      }
    }
  }
  const hard = findings.filter(item => item.severity === "hard");
  const review = findings.filter(item => item.severity === "review");
  const reviewFindingDigest = sha256(stableJson(review));
  return {
    schema_version: "are.writing-style-report/v1",
    status: hard.length === 0 ? "PASS" : "FAIL",
    mode: policy.scope.mode,
    files_checked: files.length,
    prose_words: proseWords,
    sentences_checked: sentenceCount,
    hard_finding_count: hard.length,
    review_finding_count: review.length,
    review_finding_digest: reviewFindingDigest,
    hard_findings: hard,
    review_findings: review,
    compliance_claim: policy.compliance_claim,
    authority_effect: "none"
  };
}

export function buildWritingStyleReview(report) {
  const rules = [...new Set(report.review_findings.map(item => item.rule))].sort();
  const counts = Object.fromEntries(rules.map(rule => [
    rule,
    report.review_findings.filter(item => item.rule === rule).length
  ]));
  return {
    schema_version: "are.writing-style-review/v1",
    status: report.status === "PASS" ? "REVIEWED" : "BLOCKED",
    reviewed_on: "2026-09-18",
    files_checked: report.files_checked,
    prose_words: report.prose_words,
    sentences_checked: report.sentences_checked,
    hard_finding_count: report.hard_finding_count,
    review_finding_count: report.review_finding_count,
    review_finding_counts: counts,
    review_finding_digest: report.review_finding_digest,
    disposition: "Retain passive forms when the actor is unknown or irrelevant, when the text names a lifecycle state, or when the object or constraint is the subject. Retain compound forms when they express current relevance. The mechanical detector also matches possession and adjectival forms, which require no rewrite.",
    claim_limit: "REVIEWED proves a bounded manual review of the detector findings for these exact document bytes. It does not prove official or certified ASD-STE100 compliance.",
    authority_effect: "none"
  };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const report = lintWritingStyle();
  const [mode = "--check"] = process.argv.slice(2);
  if (!["--check", "--check-review", "--write-review"].includes(mode)) throw new Error("usage:lint-writing-style [--check|--check-review|--write-review]");
  if (mode !== "--check") {
    const expected = stableJson(buildWritingStyleReview(report));
    if (mode === "--write-review") writeFileSync(reviewPath, expected);
    else if (!existsSync(reviewPath) || readFileSync(reviewPath, "utf8") !== expected) {
      process.stderr.write("writing-style.review-drift\n");
      process.exitCode = 1;
    }
  }
  process.stdout.write(`${JSON.stringify({...report, mode}, null, 2)}\n`);
  if (report.status !== "PASS") process.exitCode = 1;
}
