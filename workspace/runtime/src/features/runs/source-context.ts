// Explicit caller selection, bound as native task input; not source-owner attestation.
// Open questions: ../../../../plans/orchestrator-integration/T5B-SOURCE-CONTEXT.md.
export const SOURCE_CONTEXT_PREFIX='Workspace selected source v1\n';
export interface SelectedSource {kind:'chat'|'project'|'essay'|'knowledge';id:string;revision:string;selector:string}
export interface SourceContext {schema:'workspace-selected-source/v1';source:SelectedSource;text:string;text_sha256:string;authority_effect:'none'}
export interface RunOriginBinding {source:SelectedSource;textSha256:string;taskDigest:string;binding:'task-digest-bound';sourceVerification:'caller-declared'}
const bytes=(value:string)=>new TextEncoder().encode(value);
function fail():never {throw Error('SOURCE_CONTEXT_INVALID');}
function exact(value:unknown,keys:string[]):asserts value is Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!==[...keys].sort().join())fail();
}
function field(value:unknown,max:number):asserts value is string {
 if(typeof value!=='string'||!value.trim()||value.includes('\0')||bytes(value).length>max||new TextDecoder('utf-8',{ignoreBOM:true}).decode(bytes(value))!==value)fail();
}
function source(value:unknown):SelectedSource {
 exact(value,['kind','id','revision','selector']);
 if(typeof value.kind!=='string'||!['chat','project','essay','knowledge'].includes(value.kind))fail();
 field(value.id,512);field(value.revision,256);field(value.selector,512);
 return {kind:value.kind as SelectedSource['kind'],id:value.id,revision:value.revision,selector:value.selector};
}
export async function textSha256(value:string):Promise<string>{
 return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes(value))),b=>b.toString(16).padStart(2,'0')).join('');
}
function serialize(value:SourceContext):string{
 const input=SOURCE_CONTEXT_PREFIX+JSON.stringify({schema:value.schema,source:source(value.source),text:value.text,text_sha256:value.text_sha256,authority_effect:'none'});
 if(bytes(input).length>8192)throw Error('SOURCE_CONTEXT_INPUT_TOO_LARGE');
 return input;
}
export async function encodeSourceContext(selected:SelectedSource,text:string):Promise<string>{
 const selectedSource=source(selected);field(text,8192);
 return serialize({schema:'workspace-selected-source/v1',source:selectedSource,text,text_sha256:await textSha256(text),authority_effect:'none'});
}
export async function readSourceContext(input:unknown):Promise<SourceContext|null>{
 if(typeof input!=='string'||!input.startsWith(SOURCE_CONTEXT_PREFIX))return null;
 if(bytes(input).length>8192)throw Error('SOURCE_CONTEXT_INPUT_TOO_LARGE');
 let value:unknown;try{value=JSON.parse(input.slice(SOURCE_CONTEXT_PREFIX.length));}catch{return fail();}
 exact(value,['schema','source','text','text_sha256','authority_effect']);
 if(value.schema!=='workspace-selected-source/v1'||value.authority_effect!=='none')fail();
 const selected=source(value.source);field(value.text,8192);
 if(typeof value.text_sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.text_sha256))fail();
 const envelope:SourceContext={schema:'workspace-selected-source/v1',source:selected,text:value.text,text_sha256:value.text_sha256,authority_effect:'none'};
 if(serialize(envelope)!==input||await textSha256(envelope.text)!==envelope.text_sha256)fail();
 return envelope;
}
