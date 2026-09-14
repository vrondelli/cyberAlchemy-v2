import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

test('sealed oracle availability scorer selects only delivered handles with positive gold overlap',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-oracle-availability-')),input=join(root,'input.json'),out=join(root,'out.json');
  try{
    writeFileSync(input,JSON.stringify({rows:[{cell_id:'fixture',instance_id:'Multi-SWE-Bench__c__maintenance__bugfix__39769692',state_arm:'state',status:'final_context_selected',observations:[{id:'a'.repeat(64),path:'README.md',start_line:1,end_line:2,source_sha256:'b'.repeat(64)},{id:'c'.repeat(64),path:'src/libponyc/expr/array.c',start_line:1,end_line:100,source_sha256:'d'.repeat(64)}]}]}));
    const run=spawnSync('/tmp/are-contextbench-venv-117/bin/python',['implementation/agent-reasoning-engine/benchmarks/contextbench-v1/oracle-availability.py','--upstream','/tmp/are-contextbench-upstream-117','--gold','/tmp/are-contextbench-upstream-117/data/full.parquet','--input',input,'--cache','/tmp/are-contextbench-native-score-cache-v1','--out',out],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);const row=JSON.parse(readFileSync(out)).rows[0];assert.deepEqual(row.selected_read_ids,['c'.repeat(64)]);assert.equal(row.selected_handles,1);assert.ok(row.span_f1>0);assert.ok(row.file_f1>0);
  }finally{rmSync(root,{recursive:true,force:true});}
});
