// Fixed prospective screen. Open questions: README.md.
export function assess(rows){
 const pairs=[];for(const block of [...new Set(rows.map(r=>r.block))]){const rs=rows.filter(r=>r.block===block);if(new Set(rs.map(r=>r.arm)).size!==rs.length)throw Error('duplicate arm');const b=rs.find(r=>r.arm==='baseline'),t=rs.find(r=>r.arm==='admission');if(b&&t)pairs.push({block,condition:b.condition,net:Number(t.qualified)-Number(b.qualified)});}
 const count=(arm,condition)=>rows.filter(r=>r.arm===arm&&r.condition===condition&&r.qualified).length;
 const net=pairs.filter(p=>p.condition==='delayed').reduce((s,p)=>s+p.net,0),preserved=rows.filter(r=>r.arm==='admission'&&r.condition==='delayed'&&r.exposure.decisive_source_present_at_final).length;
 const cost=arm=>rows.filter(r=>r.arm===arm).reduce((n,r)=>n+r.counts.models,0);
 const complete=rows.length===24&&pairs.length===12;
 const known=rows.every(r=>r.attributable&&typeof r.raw_semantics==='boolean'&&r.safety&&r.exposure.revision_ever_delivered&&r.exposure.recycles===0&&r.exposure.masked_at_first_submission_offer===(r.arm==='baseline'&&r.condition==='delayed'));
 const supporting=count('baseline','visible')===6&&count('admission','visible')===6&&count('admission','delayed')>=5&&net>=3&&preserved>=5&&cost('admission')<=cost('baseline');
 return {complete,known_exposure:known,kind:!complete||!known?'inconclusive':supporting?'supporting':'counterevidence',baseline_visible:count('baseline','visible'),candidate_visible:count('admission','visible'),baseline_delayed:count('baseline','delayed'),candidate_delayed:count('admission','delayed'),delayed_net_wins:net,candidate_decisive_sources:preserved,baseline_model_attempts:cost('baseline'),candidate_model_attempts:cost('admission'),pairs};
}
