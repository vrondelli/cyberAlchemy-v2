import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const PYTHON='/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python';
const UPSTREAM='/home/vrondelli/.local/share/are/contextbench-upstream-117';
const GOLD=`${UPSTREAM}/data/full.parquet`;
const SCRIPT='implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py';

test('sealed scoreability exposes decisions and reason codes without gold content',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-scoreability-')),input=join(root,'input.json'),out=join(root,'out.json');
  try{
    writeFileSync(input,JSON.stringify({instance_ids:[
      'Multi-SWE-Bench__c__maintenance__bugfix__39769692',
      'Multi-SWE-Bench__cpp__maintenance__bugfix__0fd29e35',
      'missing-fixture'
    ]}));
    const run=spawnSync(PYTHON,[SCRIPT,'--upstream',UPSTREAM,'--gold',GOLD,'--input',input,'--out',out],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const raw=readFileSync(out,'utf8'),result=JSON.parse(raw);
    assert.equal(result.rows[0].scoreable,true);
    assert.deepEqual(result.rows[1],{instance_id:'Multi-SWE-Bench__cpp__maintenance__bugfix__0fd29e35',scoreable:false,reason_codes:['gold.empty-context']});
    assert.deepEqual(result.rows[2],{instance_id:'missing-fixture',scoreable:false,reason_codes:['gold.instance-not-found']});
    for(const forbidden of ['gold_context','start_line','end_line','src/libponyc'])assert.equal(raw.includes(forbidden),false);
  }finally{rmSync(root,{recursive:true,force:true});}
});
