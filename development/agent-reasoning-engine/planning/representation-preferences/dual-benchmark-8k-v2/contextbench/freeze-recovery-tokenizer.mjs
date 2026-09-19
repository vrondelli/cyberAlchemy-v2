// Prospective source manifest, not dispatch authority. Open questions: RECOVERY-TOKENIZER-PROTOCOL.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'../../../../../..'),dir=import.meta.dirname,seen=new Map();
function add(path){
 path=resolve(path);if(seen.has(path))return;
 if(!path.startsWith(root+'/'))throw Error('dependency outside repository');
 const raw=readFileSync(path);seen.set(path,{path:relative(root,path),sha256:createHash('sha256').update(raw).digest('hex')});
 if(path.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(raw.toString(),{identifier:path}).dependencySpecifiers){if(spec.startsWith('node:'))continue;if(!spec.startsWith('.'))throw Error('unbound bare dependency');add(resolve(dirname(path),spec));}
}
for(const name of ['run-recovery-tokenizer.mjs','run-recovery-tokenizer.test.mjs','recovery-tokenizer.test.mjs','recovery-wire.test.mjs','recovery-freshness.test.mjs','demand-recovery-fresh.test.mjs','register-recovery-tokenizer-r2.mjs','freeze-recovery-tokenizer.mjs','RECOVERY-TOKENIZER-PROTOCOL.md','RECOVERY-TOKENIZER-HYPOTHESES-R2.json','RECOVERY-TOKENIZER-EXPERIMENT-R2.json','RECOVERY-VISIBILITY.json','REQUEST-REPETITION.json','FRESHNESS-REPLAY-R2.json','FRESHNESS-REVIEW-R2.json','RECOVERY-TOKENIZER-DRYRUN.json','../storage-host-binding.json','../cleanup-20260918/HOST-STORAGE-CORRECTION.md'])add(resolve(dir,name));
const visibility=JSON.parse(readFileSync(resolve(dir,'RECOVERY-VISIBILITY.json')));
for(const binding of visibility.source_bindings){const p=binding.path.includes('/')?resolve(root,binding.path):resolve(dir,binding.path);add(p);if(seen.get(p).sha256!==binding.sha256)throw Error('retained source drift');}
const manifest={schema:'are.recovery-tokenizer-sources/v1',bindings:[...seen.values()].sort((a,b)=>a.path.localeCompare(b.path)),model_calls:0,maximum_tokenizer_calls:512,maximum_workers:2,planned_pairs:97,authority_effect:'none',open_questions_ref:'RECOVERY-TOKENIZER-PROTOCOL.md'};
writeFileSync(resolve(dir,'RECOVERY-TOKENIZER-SOURCES.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({bindings:seen.size,dispatch_admitted:false}));
