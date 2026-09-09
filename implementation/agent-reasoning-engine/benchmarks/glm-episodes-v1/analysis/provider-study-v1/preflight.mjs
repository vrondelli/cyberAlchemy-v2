// Two local container controls. Open questions: README.md#open-questions.
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createContainerPublicValidator} from '../../../../packages/coding-agent-runtime/container-public-validation.mjs';
import {save} from './controller.mjs';
const directory=resolve(process.argv[2]);mkdirSync(directory);
const fixture=new URL('../controlled-study-v1/prepared/fixtures/archive-start-v1/',import.meta.url);
const path=new URL('oracle.json',fixture).pathname,sha=b=>createHash('sha256').update(b).digest('hex');
const cases=JSON.parse(readFileSync(path));
const plan={schema_version:'are.public-case-plan/v1',sources:[{path,sha256:sha(readFileSync(path))}],checks:cases.map((c,i)=>({...c,evidence:[{path,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
const validator=createContainerPublicValidator(),results=[];
for(const [name,file,expected] of [['reference','reference.mjs',true],['mutant','subject.mjs',false]]){
 const result=validator.validate({subject:new URL(file,fixture).pathname,plan});save(join(directory,name+'.json'),result);
 if(result.ok!==expected||!result.worker_cleanup_verified||result.results.some(r=>!['matched','output-mismatch'].includes(r.reason)))throw Error('container control failed: '+name);
 results.push({name,passed:result.passed,total:result.total,cleanup_verified:true});
}
save(join(directory,'result.json'),{ok:true,backend_id:validator.id,results,model_calls:0,tokenizer_calls:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
console.log(JSON.stringify(results));
