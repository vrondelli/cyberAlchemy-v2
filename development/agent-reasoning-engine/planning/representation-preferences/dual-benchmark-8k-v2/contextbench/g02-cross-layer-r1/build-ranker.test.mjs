import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import test from 'node:test';

test('builds a syntactically valid, opt-in cross-layer successor from the pinned ranker',()=>{
  const dir=mkdtempSync(join(tmpdir(),'g02-cross-layer-ranker-'));
  try{
    const base=resolve(import.meta.dirname,'../g02-source-relations-1177-r1/ranked-source-acquisition-r6.mjs');
    const helper=resolve(import.meta.dirname,'../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/cross-layer-source-hints.mjs');
    const out=join(dir,'ranked-source-acquisition.mjs');
    execFileSync(process.execPath,[resolve(import.meta.dirname,'build-ranker.mjs'),base,helper,out]);
    execFileSync(process.execPath,['--check',out]);
    const source=readFileSync(out,'utf8');
    assert.match(source,/selectCrossLayerSourceHints/);
    assert.match(source,/focused_source_hints\.push\(hint\)/);
    assert.match(source,/maximum:Math\.min\(4,Math\.max\(0,6-focused_source_hints\.length\)\)/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
