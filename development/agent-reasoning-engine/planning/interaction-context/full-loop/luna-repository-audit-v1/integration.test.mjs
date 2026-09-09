import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,copyFileSync,symlinkSync,rmSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../../../../../..'),packagePath=relative(root,import.meta.dirname);
for(const scenario of ['complete','unknown','no-key'])test(`isolated mocked API lifecycle: ${scenario}`,()=>{
 const temp=mkdtempSync(resolve(tmpdir(),'luna-audit-test-'));
 try{
  const manifest=JSON.parse(readFileSync(resolve(import.meta.dirname,'MANIFEST.json')));
  for(const e of [...manifest.files,{path:`${packagePath}/MANIFEST.json`}]){
   const target=resolve(temp,e.path);mkdirSync(dirname(target),{recursive:true});
   if(e.path.startsWith(packagePath+'/'))copyFileSync(resolve(root,e.path),target);else symlinkSync(resolve(root,e.path),target);
  }
  const mock=resolve(temp,'mock.mjs');
  writeFileSync(mock,`import {readFileSync} from 'node:fs';\nconst base=${JSON.stringify(resolve(temp,packagePath))};\nconst oracle=JSON.parse(readFileSync(base+'/rubric.json'));\nglobalThis.fetch=async(url,options)=>{\n if(url!=='https://api.openai.com/v1/responses')throw Error('unexpected URL');\n if(${JSON.stringify(scenario)}==='unknown')throw Error('simulated delivery unknown');\n const payload=JSON.parse(options.body),prompt=JSON.parse(payload.input);\n if(payload.model!=='gpt-5.6-luna'||payload.store!==false||payload.service_tier!=='default'||payload.tools)throw Error('unexpected request');\n const id=prompt.request.split(':')[0].replace('Audit ','');const entry=prompt.evidence[0];const line=entry.lines.split('\\n').find(s=>s.slice(s.indexOf(': ')+2).trim());const split=line.indexOf(': ');\n const answer={verdict:oracle[id].verdict,analysis:'Mock response; no model execution.',citations:[{path:entry.path,line:Number(line.slice(0,split)),quote:line.slice(split+2)}],carry_forward:'Mock notes'};\n return {ok:true,status:200,json:async()=>({id:'mock:'+id,model:payload.model,status:'completed',usage:{input_tokens:1000,output_tokens:100,input_tokens_details:{cached_tokens:0},output_tokens_details:{reasoning_tokens:10}},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}]})};\n};\n`);
  const proc=spawnSync(process.execPath,['--import',mock,resolve(temp,packagePath,'run.mjs'),'--live'],{encoding:'utf8',env:{...process.env,OPENAI_API_KEY:scenario==='no-key'?'':'fixture-not-a-key'},timeout:30000});
  const out=resolve(temp,packagePath,'RESULT.json');
  if(scenario==='no-key'){assert.notEqual(proc.status,0);assert.equal(existsSync(out),false);assert.equal(existsSync(resolve(temp,packagePath,'RUN.lock')),false);return;}
  const result=JSON.parse(readFileSync(out));
  if(scenario==='complete'){assert.equal(proc.status,0,proc.stderr);assert.equal(result.model_calls,48);assert.equal(result.arms.are.review_passes,12);assert.equal(result.arms.summary.review_passes,12);assert.ok(result.reservations_usd<8);}
  else {assert.notEqual(proc.status,0);assert.equal(result.model_calls,1);assert.equal(result.status,'STOPPED');assert.ok(result.reservations_usd>0);assert.equal(result.records[0].status,'delivery-unknown');}
 }finally{rmSync(temp,{recursive:true,force:true});}
});
