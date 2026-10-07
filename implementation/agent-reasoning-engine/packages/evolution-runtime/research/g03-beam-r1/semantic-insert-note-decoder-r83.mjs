// Metadata-only presentation projection. Never repairs an answer or quotation.
// Open Questions: evidence/G03-SEMANTIC-INSERT-DECODER-R83.json.
import {validateAndBindNote} from './semantic-insert-note-r81.mjs';
function clip(text,cap){
 if(typeof text!=='string'||text.length<=cap)return text;
 let value=text.slice(0,cap),last=value.charCodeAt(value.length-1);
 if(last>=0xd800&&last<=0xdbff)value=value.slice(0,-1);
 return value;
}
export function decodeAndBindNote(packet,content){
 if(typeof content!=='string'||Buffer.byteLength(content)>32768)throw Error('semantic-decoder.public-content-cap');
 const text=content.trim(),fence=text.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*)\r?\n```$/);
 const raw=JSON.parse(fence?fence[1]:text);
 // Preserve closed-schema validation: extra keys, arrays and malformed values fail.
 const projected=raw&&typeof raw==='object'&&!Array.isArray(raw)?{...raw,title:clip(raw.title,120),summary:clip(raw.summary,600)}:raw;
 const bound=validateAndBindNote(packet,projected);
 return {...bound,metadata_projection:{enclosing_json_fence_removed:!!fence,
  title_truncated:raw.title!==projected.title,summary_truncated:raw.summary!==projected.summary,
  original_title_characters:raw.title.length,original_summary_characters:raw.summary.length,
  quotations_changed:false,original_raw_response_retained:true}};
}
