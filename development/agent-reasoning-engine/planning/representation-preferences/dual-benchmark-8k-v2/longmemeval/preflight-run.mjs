// One exact tokenizer-only preflight. No automatic retries. Open questions: RUNNER.md.
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {buildPairs,preflight} from './runner.mjs';
import {createProvider} from './provider.mjs';
import {assertStorageCapacity} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
const directory=join(import.meta.dirname,'preflight');
if(existsSync(directory))throw Error('existing preflight; no automatic repeat');
assertStorageCapacity({outRoot:import.meta.dirname});
mkdirSync(directory);
const save=(name,value)=>writeFileSync(join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const pairs=buildPairs();save('pairs.json',pairs);
try{const result=await preflight(pairs,createProvider({directory:join(directory,'provider')}));save('result.json',result);console.log(JSON.stringify({admitted:result.admitted,maximum_request_tokens:Math.max(...result.calls.map(c=>c.input_tokens+c.output_reserve)),generation_calls:0,tokenizer_calls:result.tokenizer_calls}));}
catch(error){save('failure.json',{status:'failed',message:String(error.message),receipt:error.receipt??null,generation_calls:0});throw error;}
