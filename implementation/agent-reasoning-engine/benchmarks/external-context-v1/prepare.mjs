// Open questions: README.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {asyncBufferFromFile,parquetReadObjects} from 'hyparquet';
import {hash} from './common.mjs';
const cache=process.argv[2];if(!cache)throw Error('cache directory required');
const rows=await parquetReadObjects({file:await asyncBufferFromFile(cache+'/js.parquet')});
const row=rows.find(r=>r.instance_id==='sveltejs__svelte-16666');if(!row)throw Error('selected instance absent');
mkdirSync(new URL('prepared/',import.meta.url),{recursive:true});
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
save(cache+'/evaluator-task.json',row);
save(new URL('prepared/task.json',import.meta.url),{instance_id:row.instance_id,repo:row.repo,base_commit:row.base_commit,problem_statement:row.problem_statement,docker_image:row.docker_image});
save(new URL('prepared/source.json',import.meta.url),{dataset:'SWE-bench-Live/MultiLang',revision:'22091f6ce331c5c60c241d76512d4be7ee1a555b',split:'js',parquet_sha256:hash(readFileSync(cache+'/js.parquet')),task_sha256:hash(readFileSync(new URL('prepared/task.json',import.meta.url))),evaluator_task_sha256:hash(readFileSync(cache+'/evaluator-task.json')),selection:'First Svelte compiler issue among initial js rows; preceding formatting-only stdlib and mixed-language MultiQC excluded by development scope, before model outcomes.',partition:'development-only',upstream_evaluator_commit:'a9c6b8aae9387f7a231d55b52da4b7ed0fd43bc3',open_questions_ref:'../README.md'});
console.log(JSON.stringify({instance:row.instance_id,rows:rows.length,hidden_fields_excluded:true}));
