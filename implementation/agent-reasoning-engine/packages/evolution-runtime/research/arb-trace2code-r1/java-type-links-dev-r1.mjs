// Lexical type-navigation hypothesis, not compiler bindings.
// Open Questions: G01-DEFECTS4J-SYMBOL-NAV-DEV-R1.md.
export function maskNonCode(text){
  return text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,m=>m.replace(/[^\r\n]/g,' '));
}
export function buildTypeLinks(documents){
  const docs=documents.map(d=>{
    const code=maskNonCode([...d.text].slice(0,20000).join(''));
    const pkg=code.match(/\bpackage\s+([\w.]+)\s*;/)?.[1]??'';
    const name=d.path.split('/').at(-1).slice(0,-5);
    const imports=[...code.matchAll(/\bimport\s+(static\s+)?([\w.]+(?:\.\*)?)\s*;/g)].map(m=>({static:Boolean(m[1]),name:m[2]}));
    return {...d,code,pkg,name,fqn:pkg?pkg+'.'+name:name,imports};
  });
  const symbols=new Map();for(const d of docs){const paths=symbols.get(d.fqn)??[];paths.push(d.path);symbols.set(d.fqn,paths);}
  const edges=new Map(docs.map(d=>[d.path,new Set()]));const proofs=new Map();
  for(const d of docs){
    const used=new Set(d.code.match(/\b[A-Z][A-Za-z0-9_$]*\b/g)??[]);
    const names=new Set([...d.code.matchAll(/\b(?:[a-z_$][\w$]*\.)+[A-Z][\w$]*/g)].map(m=>m[0]));
    for(const token of used){
      names.add(d.pkg?d.pkg+'.'+token:token);
      for(const imp of d.imports){
        if(imp.static){const owner=imp.name.endsWith('.*')?imp.name.slice(0,-2):imp.name.slice(0,imp.name.lastIndexOf('.'));if(owner.split('.').at(-1)===token)names.add(owner);}
        else if(imp.name.endsWith('.*'))names.add(imp.name.slice(0,-1)+token);
        else if(imp.name.split('.').at(-1)===token)names.add(imp.name);
      }
    }
    // Static owners are source dependencies even if only an imported member is used.
    for(const imp of d.imports)if(imp.static)names.add(imp.name.endsWith('.*')?imp.name.slice(0,-2):imp.name.slice(0,imp.name.lastIndexOf('.')));
    for(const name of [...names].sort())for(const target of symbols.get(name)??[]){
      if(target===d.path)continue;
      edges.get(d.path).add(target);proofs.set(d.path+'\0'+target,name);
    }
  }
  const reverse=new Map(docs.map(d=>[d.path,new Set()]));
  for(const [from,targets] of edges)for(const target of targets)reverse.get(target).add(from);
  return {edges,reverse,proofs,files:docs.length,edge_count:[...edges.values()].reduce((n,x)=>n+x.size,0)};
}
export function navigateTypes(graph,seeds){
  const scores=new Map();const witnesses=new Map();
  for(const [i,seed] of seeds.entries()){
    let frontier=new Map([[seed,{mass:1/(i+1),trail:[]}]]);
    for(let depth=1;depth<=2;depth++){
      const next=new Map();
      for(const [from,state] of frontier)for(const [kind,weight,neighbors] of [['outgoing',.75,graph.edges.get(from)],['incoming',.25,graph.reverse.get(from)]]){
        if(!neighbors?.size)continue;
        for(const to of [...neighbors].sort()){
          const mass=state.mass*weight/neighbors.size;
          const score=mass*(depth===1?1:.5);scores.set(to,(scores.get(to)??0)+score);
          const symbol=graph.proofs.get(kind==='outgoing'?from+'\0'+to:to+'\0'+from);
          const trail=[...state.trail,{from,to,kind,symbol}];
          if(score>(witnesses.get(to)?.score??-1))witnesses.set(to,{score,seed,trail});
          const prior=next.get(to);next.set(to,{mass:(prior?.mass??0)+mass,trail:prior?.trail??trail});
        }
      }
      frontier=next;
    }
  }
  return {scores,witnesses};
}
