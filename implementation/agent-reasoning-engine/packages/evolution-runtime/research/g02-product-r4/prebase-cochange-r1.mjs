// Ancestor-only file relation; no messages, patches, labels or model memory.
// Open Questions: evidence/G02-PREBASE-COCHANGE-SOURCE-R1.json.
export function rankCochange({history,seeds,observed,eligible,maximum=3}){
 const allowed=new Set(eligible),seen=new Set(observed),seedList=[...new Set(seeds)].slice(0,12),seedSet=new Set(seedList),changes=new Map(),pairs=new Map(),latest=new Map();
 for(const [i,c]of history.entries()){
  if(!/^[a-f0-9]{40}$/.test(c.commit)||!Array.isArray(c.paths)||new Set(c.paths).size!==c.paths.length)throw Error('cochange.history');
  if(c.paths.length<2||c.paths.length>20)continue;
  const paths=c.paths.filter(p=>allowed.has(p));
  for(const p of paths){changes.set(p,(changes.get(p)??0)+1);if(!latest.has(p))latest.set(p,i);}
  for(const s of paths.filter(p=>seedSet.has(p)))for(const p of paths){if(p===s||seen.has(p))continue;
   const key=s+'\0'+p,proof=pairs.get(key)??{seed:s,path:p,commits:[]};proof.commits.push(c.commit);pairs.set(key,proof);
  }
 }
 const scores=new Map(),proofs=new Map();
 for(const p of pairs.values()){if(p.commits.length<2)continue;
  const value=p.commits.length/Math.sqrt(changes.get(p.seed)*changes.get(p.path))/(seedList.indexOf(p.seed)+1);
  scores.set(p.path,(scores.get(p.path)??0)+value);const rows=proofs.get(p.path)??[];rows.push({seed_path:p.seed,cochange_support:p.commits.length,seed_changes:changes.get(p.seed),candidate_changes:changes.get(p.path),cosine_association:value,support_commits:p.commits.slice(0,10)});proofs.set(p.path,rows);
 }
 const treatment=[...scores].sort((a,b)=>b[1]-a[1]||(latest.get(a[0])??Infinity)-(latest.get(b[0])??Infinity)||a[0].localeCompare(b[0])).slice(0,maximum).map(([path,score])=>({path,score,witnesses:proofs.get(path)}));
 const control=[...changes].filter(([p])=>!seen.has(p)).sort((a,b)=>b[1]-a[1]||latest.get(a[0])-latest.get(b[0])||a[0].localeCompare(b[0])).slice(0,treatment.length).map(([path,change_count])=>({path,change_count,last_history_index:latest.get(path)}));
 return{treatment,control,seed_paths:seedList,eligible_paths:allowed.size,history_commits:history.length,admitted_small_commits:history.filter(c=>c.paths.length>=2&&c.paths.length<=20).length,
  policy:'At least2 co-edits per seed/candidate pair in2–20-path base-ancestor commits, cosine-normalized support weighted by first12 observed seed order. Unseen code candidates only; equal-width historical churn control.'};
}
