// Local admission artifact only. Open Questions: G01-CANONICAL-ENTITY-READER-R1.md.
import {createHash} from 'node:crypto';
import {copyFileSync,constants,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const root='/home/vlad_/are-benchmark-archive/defects4j-canonical-entity-reader-r1';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const [name,source] of [['run-canonical-entity-reader-r1.mjs','run-canonical-entity-reader-r1.mjs'],['decoder.mjs','candidate-id-decoder-r1.mjs']]){
 const from=new URL(source,import.meta.url),to=join(root,name);
 if(existsSync(to)){if(hash(to)!==hash(from))throw Error('existing artifact drift');}
 else copyFileSync(from,to,constants.COPYFILE_EXCL);
}
const artifacts=Object.fromEntries(['PACKETS.jsonl','PROTOCOL.md','PACKET-SEAL.json','decoder.mjs'].map(name=>[name,hash(join(root,name))]));
const receipt={schema:'are.canonical-entity-reader-runner-admission/v1',artifacts,
 runner_sha256:hash(join(root,'run-canonical-entity-reader-r1.mjs')),provider_requests_approved:'standing private benchmark and all GLM requests authorization',
 open_questions_owner:'G01-CANONICAL-ENTITY-READER-R1.md'};
writeFileSync(join(root,'RUNNER-ADMISSION.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(receipt));
