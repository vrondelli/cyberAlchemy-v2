#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

const TASK_IDS = Array.from({length: 6}, (_, index) => `MAP-${String(index + 1).padStart(3, '0')}`);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function invariant(condition, message) { if (!condition) throw new Error(message); }
function setOf(values) { return [...new Set(values)].sort(); }
function evidenceSet(card) { return setOf(card.evidence.map((item) => `${item.source_ref}\u0000${item.selector}\u0000${item.sha256 ?? ''}`)); }
function equal(a, b) { return stable(a) === stable(b); }

function indexCards(document, label) {
  const cards = Array.isArray(document) ? document : document.cards;
  invariant(Array.isArray(cards), `${label} must be an array or {cards: []}`);
  const index = new Map();
  for (const card of cards) {
    invariant(TASK_IDS.includes(card.task_id), `${label} contains unexpected task ${card.task_id}`);
    invariant(!index.has(card.task_id), `${label} duplicates ${card.task_id}`);
    index.set(card.task_id, card);
  }
  invariant(index.size === TASK_IDS.length, `${label} must contain exactly six task cards`);
  return index;
}

function scoreArm(actualDocument, goldDocument, label) {
  const actual = indexCards(actualDocument, label);
  const gold = indexCards(goldDocument, 'gold');
  const tasks = TASK_IDS.map((taskId) => {
    const a = actual.get(taskId);
    const g = gold.get(taskId);
    const components = {
      claim_id: a.claim_id === g.claim_id ? 20 : 0,
      disposition: a.disposition === g.disposition ? 20 : 0,
      proof_status: a.proof_status === g.proof_status ? 15 : 0,
      evidence_locators: equal(evidenceSet(a), evidenceSet(g)) ? 30 : 0,
      non_claims: equal(setOf(a.non_claims), setOf(g.non_claims)) ? 15 : 0,
    };
    return {task_id: taskId, score: Object.values(components).reduce((a, b) => a + b, 0), components};
  });
  return {label, score: tasks.reduce((sum, task) => sum + task.score, 0) / tasks.length, coverage: actual.size / TASK_IDS.length, tasks};
}

export function adjudicate({luna, sol, gold, lunaWallMs, deadlineMs = 300000, tolerance = 5}) {
  try {
    invariant(Number.isFinite(lunaWallMs) && lunaWallMs >= 0, 'luna wall timing is absent or negative');
    const lunaResult = scoreArm(luna, gold, 'luna');
    const solResult = scoreArm(sol, gold, 'sol');
    const falsifiers = [];
    if (lunaWallMs > deadlineMs) falsifiers.push('luna_deadline_exceeded');
    if (lunaResult.coverage < 1) falsifiers.push('luna_incomplete_coverage');
    if (lunaResult.score + tolerance < solResult.score) falsifiers.push('luna_quality_below_tolerance');
    return {
      schema_version: 'cav2.micro-swarm-parity-result.v1',
      verdict: falsifiers.length ? 'FALSIFIED' : 'SURVIVED',
      falsifiers,
      deadline_ms: deadlineMs,
      luna_wall_ms: lunaWallMs,
      parity_tolerance_points: tolerance,
      luna: lunaResult,
      sol: solResult,
      input_sha256: {luna: sha256(stable(luna)), sol: sha256(stable(sol)), gold: sha256(stable(gold))},
    };
  } catch (error) {
    return {schema_version: 'cav2.micro-swarm-parity-result.v1', verdict: 'INVALID', blockers: [error.message]};
  }
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => index % 2 ? pairs : [...pairs, [value.replace(/^--/, ''), all[index + 1]]], []));
  invariant(args.luna && args.sol && args.gold && args['luna-wall-ms'] && args.output, 'usage: score_parity.mjs --luna FILE --sol FILE --gold FILE --luna-wall-ms N --output FILE');
  const [luna, sol, gold] = await Promise.all([args.luna, args.sol, args.gold].map(async (file) => JSON.parse(await readFile(file, 'utf8'))));
  const result = adjudicate({luna, sol, gold, lunaWallMs: Number(args['luna-wall-ms'])});
  await writeFile(args.output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`EXPERIMENT_VERDICT=${result.verdict}`);
  return result.verdict === 'INVALID' ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main().then((code) => process.exitCode = code).catch((error) => { console.error(error.message); process.exitCode = 1; });

