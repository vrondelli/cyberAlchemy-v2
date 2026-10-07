// Private frozen archive adapter + one bounded JSON stdin request. No source roots in tool input.
// Open Questions: evidence/G01-CANONICAL-METHOD-VIEWS-R1.json.
import {createHash} from 'node:crypto';import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {createMethodViewHandler,REQUEST_CAP} from './canonical-method-view-policy-r1.mjs';
const ROOT='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const INPUT='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const PINS={'FREEZE.json':'e0fd0508c0092a6f8800b62e68cdb9cb2db0c6725f3d95a39914053c44c0904f',
 'RESULT.json':'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56',
 'AUDIT.json':'040b7af9ffa1ec7b8df6514be0f864fc1f51063dc6cc2fe626af7b860fe5c640',
 'SOURCE-MANIFEST.json':'173f8f782edaa3ddbcda00e4e8499bef5aa91342667e7a544cc3f8090e41ca73'};
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,c)=>{if(!v)throw Error('method-view.'+c);};
export function createFrozenCanonicalMethodViews(){
 const validateBasis=()=>{for(const[n,pin]of Object.entries(PINS))need(sha(readFileSync(join(ROOT,n)))===pin,'index-basis-drift');};
 validateBasis();
 const result=JSON.parse(readFileSync(join(ROOT,'RESULT.json'))),audit=JSON.parse(readFileSync(join(ROOT,'AUDIT.json')));
 need(result.status==='all16-canonical-method-index-qualified'&&result.qualified_cases===16&&audit.status==='all16-method-source-coordinate-audit-passed','qualified-index');
 const rows=new Map(result.rows.map(r=>[r.case_id,r]));let cachedId=null,cachedRecords=null;
 function loadCase(caseId){
  if(cachedId!==caseId){
   const bytes=readFileSync(join(ROOT,caseId,'PARSER-OUTPUT.jsonl'));need(sha(bytes)===rows.get(caseId).parser_output_sha256,'case-index-drift');
   cachedRecords=bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);cachedId=caseId;
  }
  return cachedRecords;
 }
 function readSource(caseId,path){
  const corpus=join(INPUT,caseId,'buggy-java-only/corpus'),file=join(corpus,path);
  need(lstatSync(file).isFile()&&!lstatSync(file).isSymbolicLink()&&realpathSync(file).startsWith(realpathSync(corpus)+'/'),'canonical-source-boundary');
  return readFileSync(file);
 }
 return createMethodViewHandler({caseIds:[...rows.keys()],loadCase,readSource,validateBasis});
}
async function main(){
 let size=0;const chunks=[];
 for await(const chunk of process.stdin){size+=chunk.length;need(size<=REQUEST_CAP,'request-byte-cap');chunks.push(chunk);}
 const request=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks)));
 console.log(JSON.stringify(createFrozenCanonicalMethodViews()(request)));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(error=>{const code=/^method-view\.[a-z-]+$/.test(error?.message)?error.message:'method-view.validation-or-input-failed';
  console.log(JSON.stringify({schema:'are.canonical-method-view/v1',status:'failed-closed',failure_code:code,authority_effect:'none'}));process.exitCode=2;});
}
