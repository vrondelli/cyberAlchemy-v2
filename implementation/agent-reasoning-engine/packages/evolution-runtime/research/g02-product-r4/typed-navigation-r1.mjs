// Source-only discovery tool; actual evidence still uses existing read_file.
// Open Questions: evidence/G02-TYPED-NAVIGATION-R1.json.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const helper=fileURLToPath(new URL('./typed-source-structure-r1.py',import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
const extensions={py:'python',cpp:'cpp',cc:'cpp',cxx:'cpp',hpp:'cpp',hh:'cpp',hxx:'cpp'};
export const findDefinitionsTool={type:'function',function:{name:'find_definitions',
 description:'Discover typed class/function definitions only within an already observed pinned-base file. Query is a literal case-sensitive name/qualified-name substring; empty lists all. Results are discovery metadata, NOT acquired source evidence. Use the supplied read_file arguments to actually read a definition; paginate larger definitions with read_file. No final context is selected by this tool.',
 parameters:{type:'object',additionalProperties:false,required:['path','query','kind','offset','limit'],properties:{
 path:{type:'string',minLength:1,maxLength:4096},query:{type:'string',maxLength:256},kind:{enum:['any','class','function']},
 offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:10}}}}};
export function parseTypedSource(source,language){
 return JSON.parse(execFileSync('python3',[helper],{input:JSON.stringify({source,language}),encoding:'utf8',
  timeout:15000,maxBuffer:4*1024*1024,env:{PATH:process.env.PATH,HOME:process.env.HOME,PYTHONDONTWRITEBYTECODE:'1'}}));
}
export function createTypedNavigation({getObservedSnapshot,parse=parseTypedSource}){
 if(typeof getObservedSnapshot!=='function')throw Error('navigation.snapshot-function');
 const cache=new Map();
 return async args=>{
  if(!args||Object.keys(args).sort().join(',')!=='kind,limit,offset,path,query'||
   typeof args.path!=='string'||!args.path||args.path.length>4096||args.path.startsWith('/')||args.path.includes('\\')||
   args.path.split('/').some(p=>['','.','..'].includes(p))||typeof args.query!=='string'||args.query.length>256||
   !['any','class','function'].includes(args.kind)||!Number.isSafeInteger(args.offset)||args.offset<0||
   !Number.isSafeInteger(args.limit)||args.limit<1||args.limit>10)
   return {ok:false,error:'navigation.invalid-arguments'};
  const snapshot=getObservedSnapshot(args.path);
  if(!snapshot||snapshot.path!==args.path||typeof snapshot.utf8!=='string'||
   !/^[a-f0-9]{64}$/.test(snapshot.source_sha256??'')||sha(snapshot.utf8)!==snapshot.source_sha256)
   return {ok:false,error:'navigation.no-valid-observed-base-snapshot'};
  const language=extensions[args.path.split('.').at(-1)];
  if(!language)return {ok:false,error:'navigation.unsupported-language-use-existing-source-tools'};
  const key=args.path+'\0'+snapshot.source_sha256;
  let index=cache.get(key);
  if(!index){
   try{index=parse(snapshot.utf8,language);}catch{return {ok:false,error:'navigation.parser-failed'};}
   if(index.status!=='parsed'||index.source_sha256!==snapshot.source_sha256||!Array.isArray(index.definitions))
    return {ok:false,error:'navigation.parse-error-or-source-drift'};
   cache.set(key,index);
  }
  const matches=index.definitions.filter(d=>(args.kind==='any'||d.kind===args.kind)&&d.qualified_name.includes(args.query));
  const page=matches.slice(args.offset,args.offset+args.limit);
  return {ok:true,output:{discovery_only:true,path:args.path,source_sha256:snapshot.source_sha256,language,
   total:matches.length,next_offset:args.offset+page.length<matches.length?args.offset+page.length:null,
   definitions:page.map(d=>({...d,read_file_args:{path:args.path,start_line:d.start_line,
    line_count:Math.min(d.kind==='class'?10:100,d.end_line-d.start_line+1),revision:'base'}})),
   evidence_posture:'Definitions/signatures and suggested coordinates are navigation metadata only. Nothing is acquired or selected until an ordinary read_file result is confirmed delivered.'}};
 };
}
