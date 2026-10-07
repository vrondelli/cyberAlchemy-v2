// Opt-in G02 hypothesis: give independent issue clauses code and non-code hints.
// The underlying pinned-file index, query ranking and rank_sources tool stay fixed.
import {createRankedSourceAcquisition as createBase,rankSourcesTool} from './ranked-source-acquisition-base.mjs';

export {rankSourcesTool};

const CODE=/\.(?:js|jsx|ts|tsx|go|py|rs|c|cc|cpp|h|hpp)$/i;

export function boundedClauses(text,maximumBytes=1024){
 if(typeof text!=='string'||!text.length)throw Error('ranked-source.invalid-problem');
 const cleaned=text.replace(/<!--[\s\S]*?-->/g,' ').replace(/https?:\/\/\S+/g,' ');
 const lines=cleaned.split(/\n+/).map(line=>line.replace(/^\s*(?:[*-]|\d+[.)])\s*/,'').trim())
  .filter(line=>line.length>=40&&!/^#{1,6}\s/.test(line));
 const clauses=[];
 for(const line of lines){
  let clause='';
  for(const character of line){
   if(Buffer.byteLength(clause+character)>maximumBytes)break;
   clause+=character;
  }
  if(clause&&!clauses.includes(clause))clauses.push(clause);
  if(clauses.length===4)break;
 }
 if(clauses.length)return clauses;
 let fallback='';
 for(const character of cleaned.trim()){
  if(Buffer.byteLength(fallback+character)>maximumBytes)break;
  fallback+=character;
 }
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
 for(let round=0;round<2&&hints.length<5;round++){
  for(const result of queries){
   if(hints.length===5)break;
   add(result.hints.find(hint=>CODE.test(hint.path)&&!seen.has(hint.path)));
  }
 }
 for(const result of queries){
  if(hints.length===8)break;
  add(result.hints.find(hint=>!CODE.test(hint.path)&&!codeExcluded(hint.path)&&!seen.has(hint.path)));
 }
 for(const result of queries){
  for(const hint of result.hints){if(hints.length===8)break;add(hint);}
 }
 const primer={...base.primer,hints:hints.slice(0,8)};
 const summary='Deterministic pinned-base source hints from distinct issue clauses; hints are not evidence. '+
  'Use read_file before relying on them: '+JSON.stringify(primer.hints.map(
   ({path,start_line,end_line,matched_terms})=>({path,start_line,end_line,matched_terms})));
 return Object.freeze({query:base.query,primer,summary});
}

function codeExcluded(path){return /\.md$/i.test(path);}
