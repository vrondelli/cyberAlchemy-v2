import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(root,'../../implementation/agent-reasoning-engine/docs');
const manifest=JSON.parse(readFileSync(resolve(source,'manifest.json'),'utf8'));
const selection=[
 ['CONCEPTS.md','concepts','Understand the engine','Concepts','Learn how ARE uses requests, context, decisions, and permissions.',['objective','decision','boundary','outcome']],
 ['STATE-LEARNING-AND-CONVERSATION.md','working-memory','Keep useful progress','Guides','Learn how ARE stores progress, reuses context, manages conversations, and learns from failures.',['state','context','evidence']],
 ['PRIVACY-AND-RETENTION.md','privacy','Control what stays','Operations','Learn what ARE stores, how to correct or revoke records, and what deletion cannot remove.',['state','boundary']],
 ['CONFIGURATION.md','configuration','Configure your integration','Reference','Find gateway settings, configuration profiles, and rules for credentials.',['agent']],
 ['COMPATIBILITY-AND-LIFECYCLE.md','compatibility','Check supported integrations','Reference','Check supported integrations and test limits before you connect a host or model.',['agent','outcome']],
 ['GATEWAY-AND-AGENTS.md','gateway','Connect an agent','Guides','Learn how the local gateway connects agents and preserves sessions.',['agent','boundary']],
 ['WORKFLOWS.md','workflows','Follow an ARE workflow','Guides','Follow the steps to process requests, record corrections, and run research.',['objective','decision','evidence']],
 ['capabilities/MANAGE-INTERACTION-CONTEXT.md','interaction-learning','Learn from corrections','Capabilities','Learn how ARE records, reuses, and revokes lessons within a defined scope. This prototype is off by default.',['context','state']],
 ['OPERATIONS-AND-SECURITY.md','operations','Operate and recover safely','Operations','Manage stored state and credentials. Recover after failures. Handle tool actions with unknown outcomes.',['boundary','evidence','state']],
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

const metadata=JSON.stringify({version:manifest.product_version,documents:documents.map(({markdown,...doc})=>({...doc,headings:[...markdown.matchAll(/^## (.+)$/gm)].map(m=>({title:m[1],id:slug(m[1])}))}))},null,2)+'\n';
const metadataTarget=resolve(root,'src/generated/documentation-index.json');
if(process.argv.includes('--check')){if(readFileSync(metadataTarget,'utf8')!==metadata)throw Error('Documentation index is stale');}else writeFileSync(metadataTarget,metadata);
