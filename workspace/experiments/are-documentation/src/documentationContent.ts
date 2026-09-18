import content from './generated/documentation.json';
export const documents=content.documents;
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
 if(anchor&&!headings(doc.markdown).some(h=>h.id===anchor))return null;
 return articleHref(doc.id,anchor,origin);
}

export const canvasHref=(id:string)=>'#'+new URLSearchParams({view:'continuity',guide:id}).toString();
export const readingPaths=[
 {title:'Understand a request',description:'Follow the engine from a goal to a decision.',guides:['concepts','workflows']},
 {title:'Connect your agent',description:'Check the gateway, configuration, and supported boundaries.',guides:['gateway','configuration','compatibility']},
 {title:'Manage memory and corrections',description:'Understand scoped learning and control what is retained.',guides:['working-memory','interaction-learning','privacy']},
 {title:'Operate the engine',description:'Prepare for recovery and uncertain tool outcomes.',guides:['operations','privacy']},
];

export const manualGroups=[
 {label:'Start here',guides:['concepts','workflows']},
 {label:'Connect an agent',guides:['gateway','configuration','compatibility']},
 {label:'Memory and learning',guides:['working-memory','interaction-learning']},
 {label:'Operations and privacy',guides:['operations','privacy']},
];
export const manualOrder=manualGroups.flatMap(group=>group.guides);
