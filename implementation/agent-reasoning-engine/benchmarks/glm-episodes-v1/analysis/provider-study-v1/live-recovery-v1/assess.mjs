// Pure predeclared pilot screen. Open questions: README.md.
export function assess(rows){
 const pairs=[];for(const block of [...new Set(rows.map(r=>r.block))]){const rs=rows.filter(r=>r.block===block);if(new Set(rs.map(r=>r.arm)).size!==rs.length)throw Error('duplicate arm');const b=rs.find(r=>r.arm==='baseline'),t=rs.find(r=>r.arm==='recovery');if(b&&t)pairs.push({block,condition:b.condition,net:Number(t.qualified)-Number(b.qualified)});}
 const count=(arm,condition)=>rows.filter(r=>r.arm===arm&&r.condition===condition&&r.qualified).length;
 const net=pairs.filter(p=>p.condition==='delayed').reduce((s,p)=>s+p.net,0),recovered=rows.filter(r=>r.arm==='recovery'&&r.condition==='delayed'&&r.exposure.decisive_recovery_present_at_final).length;
 const complete=rows.length===24&&pairs.length===12,known=rows.every(r=>r.attributable&&typeof r.raw_semantics==='boolean'&&r.safety&&r.exposure.revision_ever_delivered&&r.exposure.masked_at_first_submission_offer===(r.condition==='delayed'));
 const supporting=count('baseline','visible')===6&&count('recovery','visible')===6&&count('recovery','delayed')>=5&&net>=3&&recovered>=5;
 return {complete,known_exposure:known,kind:!complete||!known?'inconclusive':supporting?'supporting':'counterevidence',baseline_visible:count('baseline','visible'),candidate_visible:count('recovery','visible'),baseline_delayed:count('baseline','delayed'),candidate_delayed:count('recovery','delayed'),delayed_net_wins:net,candidate_decisive_recoveries:recovered,pairs};
}
