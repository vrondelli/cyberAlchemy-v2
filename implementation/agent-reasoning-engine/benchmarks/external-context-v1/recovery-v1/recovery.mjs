// Candidate recovery interface. Open questions: PLAN.md.
const digestOK=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function createRecoveryController(){
 let generation=0,active=null,omitted=0;const handles=new Map(),ranges=new Map(),transitions=[],reads=[];
 const progress=()=>active?{digest:active,...handles.get(active)}:null;
 const correction=reason=>({ok:false,error:reason,recovery:progress(),instruction:'Use the active digest and next_offset exactly, or reread inspected source with read_file.'});
 return {
  notice(meta){
   if(!Number.isInteger(meta.generation)||meta.generation<generation)throw Error('invalid recovery generation');
   if(meta.generation>generation){
    if(!digestOK(meta.history_ref))throw Error('invalid recovery digest');
    generation=meta.generation;active=meta.history_ref;
    if(!handles.has(active))handles.set(active,{next_offset:0,total_chars:null});
    transitions.push({generation,digest:active});
   }
   return active?JSON.stringify({instruction:'Earlier history was archived. Prefer rereading needed inspected source ranges with read_file. For sequential archive retrieval use this stable digest and next_offset; do not repeat earlier pages.',generation,recovery:progress(),inspected_source_ranges:[...ranges.values()],omitted_ranges:omitted}):null;
  },
  observe(event){
   const v=event.result?.output;
   if(event.tool!=='read_file'||event.result?.ok!==true||!v||v.path!==event.arguments?.path||!digestOK(v.source_sha256)||typeof v.path!=='string'||v.path.length>500||!Number.isInteger(v.start_line)||!Number.isInteger(v.end_line)||v.start_line<1||v.end_line<v.start_line)return;
   const item={path:v.path,start_line:v.start_line,end_line:v.end_line,source_sha256:v.source_sha256};
   const key=JSON.stringify(item);ranges.delete(key);ranges.set(key,item);
   if(ranges.size>16){ranges.delete(ranges.keys().next().value);omitted++;}
  },
  read(args,backend){
   if(!active||args.digest!==active){reads.push({accepted:false,reason:'inactive handle'});return correction('inactive archive handle');}
   const state=handles.get(active);
   if(args.offset!==state.next_offset){reads.push({accepted:false,reason:'unexpected offset',offset:args.offset});return correction('unexpected archive offset');}
   if(!Number.isInteger(args.max_chars)||args.max_chars<1||args.max_chars>1024)return correction('invalid page size');
   if(state.total_chars!==null&&state.next_offset===state.total_chars)return {ok:true,output:{digest:active,offset:state.next_offset,next_offset:state.next_offset,total_chars:state.total_chars,text:'',eof:true}};
   const result=backend(args);if(result?.ok!==true)return result;
   const p=result.output;
   if(!p||p.digest!==active||p.offset!==args.offset||!Number.isInteger(p.next_offset)||!Number.isInteger(p.total_chars)||p.total_chars<0||p.next_offset<p.offset||p.next_offset>p.total_chars||p.next_offset-p.offset>args.max_chars||typeof p.text!=='string'||p.text.length!==p.next_offset-p.offset||(p.next_offset===p.offset&&p.next_offset!==p.total_chars)||(state.total_chars!==null&&p.total_chars!==state.total_chars))throw Error('invalid archive backend page');
   state.next_offset=p.next_offset;state.total_chars=p.total_chars;reads.push({accepted:true,digest:active,offset:p.offset,next_offset:p.next_offset});
   return {ok:true,output:{...p,eof:p.next_offset===p.total_chars}};
  },
  snapshot(){return {generation,recovery:progress(),transitions:structuredClone(transitions),reads:structuredClone(reads),inspected_source_ranges:[...ranges.values()],omitted_ranges:omitted};}
 };
}
