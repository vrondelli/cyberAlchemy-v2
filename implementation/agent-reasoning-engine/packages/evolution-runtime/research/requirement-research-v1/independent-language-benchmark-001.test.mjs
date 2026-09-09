import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildIndependentLanguageManifest001,runIndependentLanguageBenchmark001,verifyIndependentHoldout001,verifyIndependentLanguageManifest001,verifyIndependentLanguageResult001} from './run-independent-language-benchmark-001.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));

test('blind independent holdout is balanced, unique, and internally consistent',()=>{assert.equal(verifyIndependentHoldout001(read('independent-expanded-grammar-holdout-001.json')),true);});
test('manifest exact-binds the unchanged holdout and current implementation',()=>{const saved=read('independent-language-manifest-001.json');assert.deepEqual(saved,buildIndependentLanguageManifest001());assert.equal(verifyIndependentLanguageManifest001(saved),true);});
test('saved result is deterministic, recomputed, and tamper evident',()=>{const manifest=read('independent-language-manifest-001.json'),saved=read('independent-language-result-001.json');
  assert.deepEqual(saved,runIndependentLanguageBenchmark001(manifest));assert.equal(verifyIndependentLanguageResult001(saved,manifest),true);
  assert.equal(verifyIndependentLanguageResult001({...saved,summary:{...saved.summary,simple_recall:1}},manifest),false);});
