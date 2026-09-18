// Exact tracked-source tools for an isolated checkout. No repository code execution.
// Open questions: README.md. Base and current observations carry distinct hashes.
import Ajv from '../external-context-v1/node_modules/ajv/dist/ajv.js';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const obj=p=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false});
const string={type:'string',minLength:1,maxLength:4096},query={type:'string',maxLength:4096};
const nat={type:'integer',minimum:0},revision={enum:['base','current']};
export const schemas={
  list_files:obj({query,offset:nat,limit:{type:'integer',minimum:1,maximum:100}}),
  read_file:obj({path:string,start_line:{type:'integer',minimum:1},line_count:{type:'integer',minimum:1,maximum:100},revision}),
  search:obj({query:string,path_prefix:query,offset:nat,limit:{type:'integer',minimum:1,maximum:30},revision}),
  apply_edits:obj({edits:{type:'array',minItems:1,maxItems:10,items:obj({path:string,source_sha256:{type:'string',pattern:'^[a-f0-9]{64}$'},old_text:string,new_text:{type:'string',maxLength:65536}})}}),
  get_patch:obj({})
};
const ajv=new Ajv({strict:true,allErrors:true});
const validators=Object.fromEntries(Object.entries(schemas).map(([k,s])=>[k,ajv.compile(s)]));
const descriptions={list_files:'Page tracked source paths containing query. Use next_offset until null.',
  read_file:'Read exact whole source lines from base or current revision. source_sha256 identifies the full file; use current hash for edits.',
  search:'Page literal matches as exact whole-line source observations; base/current revision is explicit.',
  apply_edits:'Apply an atomic validated batch of unique exact replacements to current tracked files; every expected full-file hash must match.',
  get_patch:'Get the current source patch against the pinned base commit.'};
export const tools=Object.entries(schemas).map(([name,parameters])=>({type:'function',function:{name,description:descriptions[name],parameters}}));

export function createRepositoryTools({root,base_commit,record_source=()=>{}}){
  const repo=realpathSync(root);
  const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:repo,maxBuffer:16000000,timeout:120000});
  if(!/^[a-f0-9]{40}$/.test(base_commit)||git(['rev-parse','HEAD']).toString().trim()!==base_commit)throw Error('repository.base-mismatch');
  const paths=git(['ls-files','-z']).toString().split('\0').filter(Boolean).sort();
  const grepPaths=(literal,rev)=>{
    const args=['grep','-F','-l','-z','--',literal];
    if(rev==='base')args.push(base_commit);
    let bytes;
    try{bytes=git(args);}catch(error){if(error?.status===1)bytes=error.stdout??Buffer.alloc(0);else throw error;}
    const prefix=rev==='base'?base_commit+':':'';
    return bytes.toString().split('\0').filter(Boolean).map(value=>value.startsWith(prefix)?value.slice(prefix.length):value).filter(path=>paths.includes(path));
  };
  const safe=path=>{
    if(!paths.includes(path)||isAbsolute(path)||path.includes('\\')||path.split('/').some(x=>['..','.',''].includes(x)))throw Error('repository.invalid-path');
    const abs=realpathSync(resolve(repo,path)),rel=relative(repo,abs);
    if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw Error('repository.path-escape');return abs;
  };
  const source=(path,rev)=>{
    const abs=safe(path),bytes=rev==='base'?git(['show',`${base_commit}:${path}`]):readFileSync(abs);
    if(bytes.length>2000000)throw Error('repository.file-too-large');
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    const sha256=hash(bytes);
    return {text,sha256};
  };
  const observation=(path,rev,start,count)=>{
    const s=source(path,rev),lines=s.text.split('\n');
    if(s.text.endsWith('\n'))lines.pop();
    if(start>lines.length)throw Error('repository.start-after-eof');
    const end=Math.min(lines.length,start+count-1),utf8=lines.slice(start-1,end).join('\n');
    if(Buffer.byteLength(utf8)>32768)throw Error('repository.read-too-large-use-smaller-range');
    record_source({path,source_sha256:s.sha256,utf8:s.text});
    return {path,start_line:start,end_line:end,total_lines:lines.length,utf8,byte_count:Buffer.byteLength(utf8),source_sha256:s.sha256,source_revision:rev,base_commit};
  };
  return async(name,args)=>{
    const v=validators[name];
    if(!v)return {ok:false,issues:[{path:'',message:'unknown tool'}]};
    if(!v(args))return {ok:false,issues:v.errors.map(e=>({path:e.instancePath,keyword:e.keyword,message:e.message,params:e.params}))};
    try{
      let output;
      if(name==='list_files'){
        const all=paths.filter(p=>p.includes(args.query)),page=all.slice(args.offset,args.offset+args.limit);
        output={paths:page,total:all.length,next_offset:args.offset+page.length<all.length?args.offset+page.length:null};
      }else if(name==='read_file')output=observation(args.path,args.revision,args.start_line,args.line_count);
      else if(name==='search'){
        const matches=[],skipped=[];
        const candidates=grepPaths(args.query,args.revision).filter(path=>path.startsWith(args.path_prefix));
        for(const path of candidates){
          let s;try{s=source(path,args.revision);}catch(e){skipped.push({path,reason:String(e.message)});continue;}
          const lines=s.text.split('\n');
          for(let i=0;i<lines.length;i++)if(lines[i].includes(args.query))matches.push({path,line:i+1});
        }
        const page=matches.slice(args.offset,args.offset+args.limit);
        output={observations:page.map(x=>observation(x.path,args.revision,x.line,1)),total:matches.length,
          next_offset:args.offset+page.length<matches.length?args.offset+page.length:null,skipped,
          search_engine:'git-grep-literal',scanned_matching_files:candidates.length};
      }else if(name==='get_patch')output={base_commit,patch:git(['diff','--no-ext-diff','--no-textconv','--binary',base_commit,'--']).toString()};
      else{
        const staged=new Map(),originals=new Map();
        for(const e of args.edits){
          const abs=safe(e.path),s=source(e.path,'current');
          if(s.sha256!==e.source_sha256)throw Error('repository.stale-edit-source');
          if(!originals.has(abs))originals.set(abs,s.text);
          const text=staged.get(abs)??s.text;
          if(text.split(e.old_text).length!==2)throw Error('repository.old-text-not-unique');
          staged.set(abs,text.replace(e.old_text,()=>e.new_text));
        }
        // Entire batch validated before first write; restore prior bytes on I/O failure.
        try{for(const [path,text] of staged)writeFileSync(path,text);}catch(e){for(const [path,text] of originals)writeFileSync(path,text);throw e;}
        output={changed_paths:args.edits.map(e=>e.path),base_commit};
      }
      return {ok:true,output};
    }catch(e){return {ok:false,error:String(e.message)};}
  };
}
