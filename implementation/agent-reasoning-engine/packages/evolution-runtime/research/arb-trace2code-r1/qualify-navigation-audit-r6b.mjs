// Freeze separate evaluator repair against immutable completed public cells.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R6-SUPPLEMENTAL-AUDIT.json.
import assert from 'node:assert/strict';import {readFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {checkSavedExchange} from './audit-native-method-live-r6.mjs';
import {auditNavigationPresentations as originalAudit} from './audit-navigation-state-r6.mjs';
import {auditNavigationPresentations,navigationMeasurement} from './audit-navigation-state-r6b.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r6-20261007';
const OUT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r6-supplemental-audit-r1-20261007';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const campaignBytes=readFileSync(join(ROOT,'FREEZE.json')),campaign=JSON.parse(campaignBytes);
assert.equal(sha(campaignBytes),'44c69a85c38e08fc0a8909a7cffcb0c982dc50d34eed164102a53ac62f1427fc');
const pins={...campaign.source_pins};
for(const name of ['audit-navigation-state-r6b.mjs','audit-native-method-live-r6b.mjs','audit-navigation-state-r6b.test.mjs','audit-navigation-state-r6b-equivalence.test.mjs','qualify-navigation-audit-r6b.mjs']){
 const p=join(HERE,name);pins[p]=sha(readFileSync(p));
}
const protocol=join(HERE,'../../evidence/G01-NATIVE-METHOD-LIVE-R6-SUPPLEMENTAL-AUDIT.json');pins[protocol]=sha(readFileSync(protocol));
for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h);
const cells=readdirSync(ROOT).filter(cell=>existsSync(join(ROOT,cell,'RESULT.json'))).sort();
assert.ok(cells.length>0);const completed=cells.map(cell=>({cell,result_sha256:sha(readFileSync(join(ROOT,cell,'RESULT.json')))}));
mkdirSync(OUT,{mode:0o700});const save=(p,x)=>{createReceipt(p,x);return sha(readFileSync(p));};
const freezeHash=save(join(OUT,'FREEZE.json'),{status:'supplemental-audit-frozen-before-public-reconstruction',campaign_freeze_sha256:sha(campaignBytes),source_pins:pins,completed_public_cells:completed,tests_passed:3,labels_read:false,provider_calls:0,authority_effect:'none',open_questions_owner:'G01-NATIVE-METHOD-LIVE-R6-SUPPLEMENTAL-AUDIT.json'});
try{
 const rows=[];let failuresReproduced=0,navigation=0;
 for(const row of completed){const cell=join(ROOT,row.cell),s=read(join(cell,'RESULT.json'));assert.equal(sha(readFileSync(join(cell,'RESULT.json'))),row.result_sha256);
  const numbers=readdirSync(join(cell,'requests')).filter(n=>/^\d+-STARTED\.json$/.test(n)).map(n=>Number(n.split('-')[0])).sort((a,b)=>a-b);
  assert.equal(numbers.length,s.receipts.length);const measurements=[];
  for(const[n,i]of numbers.map((n,i)=>[n,i])){const start=read(join(cell,'requests',n+'-STARTED.json')),reply=read(join(cell,'requests',n+'-REPLY.json')),receipt=read(join(cell,'requests',n+'-RECEIPT.json'));
   assert.deepEqual(receipt,s.receipts[i]);checkSavedExchange(start,reply,receipt);
   if(start.input.operation==='tokenize'&&start.index_measurement)measurements.push(navigationMeasurement(start,reply,receipt,i));
  }
  if(!s.result){rows.push({...row,episode_unavailable:true});continue;}
  assert.deepEqual(s.result.receipts,s.receipts);
  const input={caseId:s.prediction.case_id,arm:s.prediction.arm,episode:s.result,measurements};
  if(s.result.task_state_presentations.some(p=>p.projection_mode==='confirmed-native-navigation')){
   await assert.rejects(originalAudit(input),{code:'ERR_ASSERTION',message:/state must reconstruct from prior confirmed delivery/});failuresReproduced++;
  }
  const result=await auditNavigationPresentations(input);navigation+=result.confirmed_navigation_presentations;
  rows.push({...row,...result,states:s.result.task_state_presentations.map(p=>({generation:p.generation,projection_mode:p.projection_mode,measured_tokens:p.measured_tokens,fit:p.fit}))});
 }
 assert.ok(failuresReproduced>0&&navigation>0,'real serialized navigation required');
 for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h);
 const result={status:'supplemental-serialized-json-audit-qualified',freeze_sha256:freezeHash,rows,original_failures_reproduced:failuresReproduced,confirmed_navigation_presentations:navigation,source_pins_verified:Object.keys(pins).length,tests_passed:3,full_campaign_audit:false,labels_read:false,provider_calls:0,authority_effect:'none',claim_ceiling:'Completed public episode audit repair only, not full campaign or quality',open_questions_owner:'G01-NATIVE-METHOD-LIVE-R6-SUPPLEMENTAL-AUDIT.json'};
 console.log(JSON.stringify({freeze_sha256:freezeHash,result_sha256:save(join(OUT,'RESULT.json'),result),cells:rows.length,original_failures_reproduced:failuresReproduced,confirmed_navigation_presentations:navigation,pins:Object.keys(pins).length}));
}catch(e){save(join(OUT,'TERMINAL-FAILED.json'),{status:'supplemental-audit-qualification-failed',freeze_sha256:freezeHash,error:String(e.message).slice(0,240),labels_read:false,provider_calls:0,authority_effect:'none'});throw e;}
