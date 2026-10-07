// Lexical witnessed navigation, not compiler/dataflow binding.
// Open Questions: G01-CANONICAL-ENTITY-OPERATOR-DEV-R1.md.
import {maskNonCode,buildTypeLinks,navigateTypes} from './java-type-links-dev-r1.mjs';
export function sourceSignals(documents,trace){
  const symbols=new Map(),aliases=[];
  for(const d of documents){
    const text=[...d.text].slice(0,20000).join(''),code=maskNonCode(text);
    const pkg=code.match(/\bpackage\s+([\w.]+)\s*;/)?.[1]??'';
    const name=d.path.split('/').at(-1).slice(0,-5);
    const declarations=[...code.matchAll(/\b(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/g)];
    const declaration=declarations.find(m=>m[1]===name);if(!declaration)continue;
    const fqn=pkg?pkg+'.'+name:name;
    const entry={path:d.path,fqn,source_decl_line:text.slice(0,declaration.index).split('\n').length,source_sha256:d.source_sha256};
    const matches=symbols.get(fqn)??[];matches.push(entry);symbols.set(fqn,matches);
    for(const m of code.matchAll(/\b(?:java\.lang\.)?String\s+getSymbol\s*\(\s*\)\s*\{/g)){
      const from=m.index+m[0].length;
      const tail=text.slice(from),body=tail.match(/^\s*return\s+"([^"\\\r\n]{1,8})"\s*;\s*\}/);
      if(!body)continue;
      const ret=from+body[0].indexOf('return');if(code.slice(ret,ret+6)!=='return')continue;
      aliases.push({...entry,kind:'operator-literal',symbol:body[1],source_decl_line:text.slice(0,m.index).split('\n').length});
    }
  }
  const qualified=[];const seen=new Set();
  for(const m of trace.matchAll(/\b(?:[a-z_$][\w$]*\.)+[A-Z][\w$]*(?:\$[\w$]+)?/g)){
    const fqn=m[0].split('$')[0],matches=symbols.get(fqn)??[];
    if(matches.length!==1||seen.has(fqn))continue;
    seen.add(fqn);qualified.push({...matches[0],kind:'qualified-entity',query_match:m[0],query_offset:m.index});
  }
  const expression=trace.match(/\bEvaluating <([^\r\n]*)> expected:/)?.[1];
  const operators=new Set();
  if(expression!==undefined){
    const unquoted=expression.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"/g,' ');
    for(const m of unquoted.matchAll(/>=|<=|!=|[=><+*/|\-]|\b(?:and|or|mod|div)\b/g))operators.add(m[0]);
  }
  const operator=aliases.filter(a=>operators.has(a.symbol)).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0).slice(0,8);
  return {operator,qualified:qualified.slice(0,8),operators:[...operators].sort()};
}
export function navigationRanking(documents,trace,framePaths,fallbackPaths,productionPath,queryOrder,variant='combined'){
  const signals=sourceSignals(documents,trace),graph=buildTypeLinks(documents);
  const direct=variant==='entity'?signals.qualified:variant==='operator'?signals.operator:[...signals.operator,...signals.qualified];
  const seeds=[...new Set([...direct.map(s=>s.path),...framePaths,...fallbackPaths.slice(0,5)])];
  const nav=navigateTypes(graph,seeds);
  const scores=new Map(nav.scores),witnesses=new Map(nav.witnesses);
  for(const [i,s] of direct.entries()){
    const mass=1/(i+1);scores.set(s.path,(scores.get(s.path)??0)+mass);
    witnesses.set(s.path,{kind:'direct-source-seed',signal:s,score:mass});
  }
  const order=new Map(queryOrder.map((p,i)=>[p,i]));
  const ranked=[...scores].filter(([path])=>productionPath(path)).sort((a,b)=>b[1]-a[1]||(order.get(a[0])??1e9)-(order.get(b[0])??1e9)||(a[0]<b[0]?-1:a[0]>b[0]?1:0)).map(r=>r[0]);
  return {ranked,signals,seeds,witnesses,graph_edges:graph.edge_count};
}
