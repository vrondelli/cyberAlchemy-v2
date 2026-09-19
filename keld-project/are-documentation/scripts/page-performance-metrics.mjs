export function percentile(values,p){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.max(0,Math.ceil(sorted.length*p)-1)];
}
export function clsScore(entries){
 let maximum=0,sum=0,start=0,last=0;
 for(const e of entries.filter(e=>!e.hadRecentInput).sort((a,b)=>a.startTime-b.startTime)){
  if(!sum||e.startTime-last>=1000||e.startTime-start>=5000){start=e.startTime;sum=0;}
  sum+=e.value;last=e.startTime;maximum=Math.max(maximum,sum);
 }return maximum;
}
export function frameSummary(frames,durationMs,tasks=[]){
 return {samples:frames.length,p50Ms:percentile(frames,.5),p95Ms:percentile(frames,.95),maxMs:frames.length?Math.max(...frames):null,
  over33Ratio:frames.length?frames.filter(v=>v>33.34).length/frames.length:null,
  blockingMsPerSecond:tasks.reduce((s,t)=>s+Math.max(0,t.duration-50),0)/(durationMs/1000)};
}
export function failuresFor(metrics,limits){
 return Object.entries(metrics).flatMap(([name,value])=>value===null||!Number.isFinite(value)?[`${name}: missing measurement`]:value>limits[name]?[`${name}: ${value.toFixed(3)} > ${limits[name]}`]:[]);
}
