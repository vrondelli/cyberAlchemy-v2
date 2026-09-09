#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {adjudicate} from './score_parity.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const cards = JSON.parse(await readFile(path.join(here, '../micro-swarm-harness/fixtures/cards/control-cards.json'), 'utf8'));
const survived = adjudicate({luna: cards, sol: cards, gold: cards, lunaWallMs: 299999});
assert.equal(survived.verdict, 'SURVIVED');

const slow = adjudicate({luna: cards, sol: cards, gold: cards, lunaWallMs: 300001});
assert.equal(slow.verdict, 'FALSIFIED');
assert.deepEqual(slow.falsifiers, ['luna_deadline_exceeded']);

const degraded = structuredClone(cards);
for (const card of degraded) {
  card.claim_id = `WRONG-${card.task_id}`;
  card.disposition = card.disposition === 'support' ? 'defer' : 'support';
  card.proof_status = card.proof_status === 'observed' ? 'unverified' : 'observed';
  card.evidence = [];
  card.non_claims = [];
}
const quality = adjudicate({luna: degraded, sol: cards, gold: cards, lunaWallMs: 1000});
assert.equal(quality.verdict, 'FALSIFIED');
assert.ok(quality.falsifiers.includes('luna_quality_below_tolerance'));

const invalid = adjudicate({luna: cards.slice(1), sol: cards, gold: cards, lunaWallMs: 1000});
assert.equal(invalid.verdict, 'INVALID');

console.log('SCORE_PARITY_TESTS=4/4 pass');
