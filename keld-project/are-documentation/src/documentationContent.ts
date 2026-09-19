import content from './generated/documentation-index.json';
let bodies:Record<string,string>|null=null;
let pending:Promise<void>|null=null;
export const documents=content.documents.map(d=>({...d,get markdown(){return bodies?.[d.id]??'';}}));
export function loadDocumentation(){if(bodies)return Promise.resolve();return pending??(pending=import('./generated/documentation.json').then(m=>{bodies=Object.fromEntries(m.default.documents.map(d=>[d.id,d.markdown]));}).catch(e=>{pending=null;throw e;}));}
export const documentationLoaded=()=>bodies!==null;
export const documentationVersion=content.version;
export const findDocument=(id:string)=>documents.find(d=>d.id===id);
export const documentForNode=(node:string)=>documents.find(d=>d.nodes.includes(node));
export const articleHref=(id:string,anchor='',origin='')=>'#'+new URLSearchParams({view:'article',doc:id,...(anchor?{anchor}:{}),...(origin?{origin}:{})}).toString();
export function slug(text:string){return text.toLowerCase().replace(/[`*_]/g,'').replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-');}
export function headings(markdown:string){return [...markdown.matchAll(/^## (.+)$/gm)].map(m=>({title:m[1],id:slug(m[1])}));}
export function resolveLink(href:string,currentId:string,origin=''):string|null{
 if(/^https?:\/\//i.test(href)||/^mailto:/i.test(href))return href;
 const [file,anchor='']=href.split('#');
 const current=findDocument(currentId);
 const base=new URL(current?.file??'', 'https://documentation.invalid/');
 const resolved=new URL(file,base);
 const doc=file?documents.find(d=>new URL(d.file,'https://documentation.invalid/').href===resolved.href):current;
 if(!doc)return null;
 if(anchor&&!doc.headings.some(h=>h.id===anchor))return null;
 return articleHref(doc.id,anchor,origin);
}

export const canvasHref=(id:string)=>'#'+new URLSearchParams({view:'continuity',feature:id}).toString();
export const readingPaths=[
 {title:'Understand a request',description:'Follow the engine from a goal to a decision.',guides:['concepts','workflows']},
 {title:'Connect your agent',description:'Check the gateway, configuration, and supported integrations.',guides:['gateway','configuration','compatibility']},
 {title:'Manage memory and corrections',description:'Learn where ARE can reuse a lesson and control what it stores.',guides:['working-memory','interaction-learning','privacy']},
 {title:'Operate the engine',description:'Prepare to recover from failures and handle tool actions with unknown outcomes.',guides:['operations','privacy']},
];

export const manualGroups=[
 {label:'Start here',guides:['concepts','workflows']},
 {label:'Connect an agent',guides:['gateway','configuration','compatibility']},
 {label:'Memory and learning',guides:['working-memory','interaction-learning']},
 {label:'Operations and privacy',guides:['operations','privacy']},
];
export const manualOrder=manualGroups.flatMap(group=>group.guides);
