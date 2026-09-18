import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(root,'../../../implementation/agent-reasoning-engine/docs');
const manifest=JSON.parse(readFileSync(resolve(source,'manifest.json'),'utf8'));
const selection=[
 ['CONCEPTS.md','concepts','Understand the engine','Concepts','Learn how requests, context, decisions, and permissions fit together.',['objective','decision','boundary','outcome']],
 ['STATE-LEARNING-AND-CONVERSATION.md','working-memory','Keep useful progress','Guides','Understand saved state, context reuse, conversation, and failure learning.',['state','context','evidence']],
 ['PRIVACY-AND-RETENTION.md','privacy','Control what stays','Operations','Understand retained data, correction, revocation, and the limits of deletion.',['state','boundary']],
 ['CONFIGURATION.md','configuration','Configure your integration','Reference','Find the gateway options, profiles, and secret boundaries.',['agent']],
 ['COMPATIBILITY-AND-LIFECYCLE.md','compatibility','Check supported integrations','Reference','Check support and evidence boundaries before connecting a host or model.',['agent','outcome']],
 ['GATEWAY-AND-AGENTS.md','gateway','Connect an agent','Guides','Understand the local gateway, backend adapters, and session boundaries.',['agent','boundary']],
 ['WORKFLOWS.md','workflows','Follow an ARE workflow','Guides','Follow requests, corrections, and research through their evidence and decisions.',['objective','decision','evidence']],
 ['capabilities/MANAGE-INTERACTION-CONTEXT.md','interaction-learning','Learn from corrections','Capabilities','See how scoped lessons are recorded, reused, and revoked. This prototype is off by default.',['context','state']],
 ['OPERATIONS-AND-SECURITY.md','operations','Operate and recover safely','Operations','Manage retained state, credentials, recovery, and uncertain tool outcomes.',['boundary','evidence','state']],
];
const documents=selection.map(([file,id,title,section,summary,nodes])=>{const markdown=readFileSync(resolve(source,file),'utf8');return {id,title,section,summary,nodes,file,version:manifest.product_version,status:id==='interaction-learning'?'Prototype · off by default':'Development candidate',sha256:createHash('sha256').update(markdown).digest('hex'),markdown};});
const published=new Map(selection.map(([file,id])=>[file,id]));
const inventory=manifest.documents.map(file=>({file,disposition:published.has(file)?'local-preview':'withheld',document:published.get(file)??null,reason:published.has(file)?'Reviewed explanatory content; candidate status retained. Unpublished source links are explicitly unavailable.':file==='GETTING-STARTED.md'||file==='DEPLOYMENT.md'?'Requires standalone package prerequisites and validated delivery instructions before public use.':'Not included in the reviewed public allowlist; internal references, version claims, or publication suitability need review.'}));
const unavailableReferences=[];
const slug=s=>s.toLowerCase().replace(/[`*_]/g,'').replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-');
for(const doc of documents){
 if(/^(?:>|\s*<|!\[|\s*[-*] \[| {4}[^ ])/m.test(doc.markdown.replace(/^(?:```|~~~)[\s\S]*?^(?:```|~~~).*$/gm,'')))throw Error(`Unsupported Markdown block in ${doc.file}`);
 const headings=[...doc.markdown.matchAll(/^## (.+)$/gm)].map(m=>slug(m[1]));
 if(new Set(headings).size!==headings.length)throw Error(`Duplicate headings in ${doc.file}`);
 for(const [,label,href] of doc.markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)){
  if(/^https?:\/\//.test(href))continue;
  if(/^[a-z]+:/i.test(href))throw Error(`Unsupported link scheme: ${doc.file}`);
  const [file,anchor]=href.split('#');
  const absolute=resolve(dirname(resolve(source,doc.file)),file||doc.file);
  if(file&&!existsSync(absolute))throw Error(`Missing source link: ${doc.file} -> ${file}`);
  const target=file?documents.find(d=>resolve(source,d.file)===absolute):doc;
  if(!target){unavailableReferences.push({document:doc.id,label,reason:'Reference outside reviewed public allowlist'});continue;}
  if(anchor&&![...target.markdown.matchAll(/^## (.+)$/gm)].some(m=>slug(m[1])===anchor))throw Error(`Missing public anchor: ${href}`);
 }
}
const output=JSON.stringify({version:manifest.product_version,documents,inventory,unavailableReferences},null,2)+'\n';
const target=resolve(root,'src/generated/documentation.json');
if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==output)throw Error('Documentation projection is stale; run npm run docs:generate');console.log(`${documents.length} reviewed documents; ${inventory.length} inventory entries; projection current`);}else{mkdirSync(dirname(target),{recursive:true});writeFileSync(target,output);console.log(`Generated ${documents.length} reviewed documents and ${inventory.length} inventory dispositions`);}
