// Source-only, exposed-development addition to the initial ContextBench packet.
// Issue text, ranked hints and already chosen packet paths are the only inputs.
const STOP=new Set(['about','after','against','also','cause','does','error','errors','from','have',
  'include','instead','into','message','messages','more','not','note','only','present','raise',
  'result','run','that','their','them','there','this','type','values','when','with','without']);
const terms=text=>new Set((String(text).match(/[A-Za-z_][A-Za-z_0-9]{2,}/g)??[])
  .map(part=>part.toLowerCase()).filter(part=>!STOP.has(part)));
const overlap=(a,b)=>[...a].filter(item=>b.has(item)).sort();

export function numberedSteps(problemStatement){
  let issue=problemStatement;
  if(typeof issue!=='string')throw Error('numbered-packet.issue-type');
  if(issue.startsWith('"'))try{const parsed=JSON.parse(issue);if(typeof parsed==='string')issue=parsed;}catch{}
  const lines=issue.split(/\r?\n/);
  const heading=lines.findIndex(line=>/^\s*#{1,6}\s*steps to reproduce\s*:?\s*$/i.test(line));
  if(heading<0)return [];
  const steps=[];let active=null;
  for(const line of lines.slice(heading+1)){
    if(/^\s*#{1,6}\s+/.test(line))break;
    const match=line.match(/^\s*(\d+)\.\s+(.+)$/);
    if(match){if(active)steps.push(active);active={number:Number(match[1]),body:match[2]};}
    else if(active&&line.trim())active.body+=' '+line.trim();
  }
  if(active)steps.push(active);
  return steps;
}

export function addNumberedRequirementHints({hints,selected,problem_statement,maximum=2}){
  if(!Array.isArray(hints)||!Array.isArray(selected)||!Number.isSafeInteger(maximum)||maximum<0||maximum>2)
    throw Error('numbered-packet.arguments');
  const steps=numberedSteps(problem_statement);
  if(steps.length<3)return {selected,proposals:[],steps:steps.length};
  const chosen=new Set(selected.map(hint=>hint.path)),proposals=[];
  for(const step of steps){
    const wanted=terms(step.body);
    const matched=hint=>overlap(wanted,new Set((hint.matched_terms??[]).map(term=>term.toLowerCase())
      .filter(term=>!STOP.has(term))));
    if(hints.some(hint=>chosen.has(hint.path)&&matched(hint).length>=2))continue;
    const candidates=hints.map((hint,rank)=>({hint,rank,matched:matched(hint)}))
      .filter(({hint,matched})=>hint.path?.startsWith('lib/')&&!chosen.has(hint.path)&&
        matched.length>=2&&overlap(wanted,terms(hint.path)).length>0)
      .sort((a,b)=>b.matched.length-a.matched.length||a.rank-b.rank||a.hint.path.localeCompare(b.hint.path));
    if(!candidates.length)continue;
    const picked=candidates[0];
    const additional={...picked.hint,packet_role:'numbered-step'};
    selected.push(additional);chosen.add(additional.path);
    proposals.push({step:step.number,path:additional.path,matched_terms:picked.matched});
    if(proposals.length>=maximum)break;
  }
  return {selected,proposals,steps:steps.length};
}
