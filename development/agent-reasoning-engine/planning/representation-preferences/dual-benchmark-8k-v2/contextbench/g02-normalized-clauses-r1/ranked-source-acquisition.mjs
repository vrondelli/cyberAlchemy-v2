// G02 development variant: decode double-encoded issue text before clause ranking.
import {createRankedSourceAcquisition as createBase,rankSourcesTool} from './ranked-source-acquisition-base.mjs';

export {rankSourcesTool};
const CODE=/\.(?:js|jsx|ts|tsx|go|py|rs|c|cc|cpp|h|hpp)$/i;

export function normalizeProblem(text){
  if(typeof text!=='string'||!text.length)throw Error('ranked-source.invalid-problem');
  if(text.startsWith('"')&&text.endsWith('"')){
    try{const decoded=JSON.parse(text);if(typeof decoded==='string')return decoded;}catch{}
  }
  // Some source-only rows contain literal escaped newlines without an outer
  // JSON string. Decode only when there are no real line breaks already.
  if(!text.includes('\n')&&text.includes('\\n'))return text.replace(/\\r\\n|\\n/g,'\n');
  return text;
}

export function boundedClauses(text,maximumBytes=1024){
  const cleaned=normalizeProblem(text).replace(/<!--[\s\S]*?-->/g,' ').replace(/https?:\/\/\S+/g,' ');
  const lines=cleaned.split(/\n+/).map(line=>line.replace(/^\s*(?:[*-]|\d+[.)])\s*/,'').trim())
    .filter(line=>line&&!/^#{1,6}\s/.test(line)&&(line.length>=24||/`|\/api\//.test(line)));
  const clauses=[];
  for(const line of lines){
    let clause='';
    for(const character of line){
      if(Buffer.byteLength(clause+character)>maximumBytes)break;
      clause+=character;
    }
    if(clause&&!clauses.includes(clause))clauses.push(clause);
    if(clauses.length===8)break;
  }
  if(clauses.length)return clauses;
  const fallback=cleaned.trim().slice(0,maximumBytes);
  if(!fallback)throw Error('ranked-source.empty-primer');
  return [fallback];
}

export function createRankedSourceAcquisition(options){
  const clauses=boundedClauses(options.problem_statement);
  const base=createBase({...options,problem_statement:clauses[0]});
  const queries=clauses.map(clause=>base.query(clause));
  const hints=[];
  const seen=new Set();
  const add=hint=>{if(hint&&!seen.has(hint.path)){hints.push(hint);seen.add(hint.path);}};
  for(const kind of [true,false]){
    for(let round=0;round<2;round++){
      for(const result of queries){
        if(hints.length>=20)break;
        add(result.hints.find(hint=>CODE.test(hint.path)===kind&&!seen.has(hint.path)));
      }
    }
  }
  for(const result of queries){
    for(const hint of result.hints){if(hints.length>=20)break;add(hint);}
  }
  const primer={...base.primer,hints:hints.slice(0,20)};
  const summary='Deterministic pinned-base leads for distinct issue clauses, not evidence. '+
    'Before patching, inspect likely code and non-code surfaces for each independent requirement using read_file. '+
    'Do not select a path solely because it is listed here: '+JSON.stringify(primer.hints.map(
      ({path,start_line,end_line,matched_terms})=>({path,start_line,end_line,matched_terms})));
  if(Buffer.byteLength(summary)>16384)throw Error('ranked-source.primer-too-large');
  return Object.freeze({query:base.query,primer,summary});
}
