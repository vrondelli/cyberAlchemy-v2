import type {RunProjection, RunView} from './run-contract.ts';
// Open questions: README.md#open-questions.
export function resultHash(viewId: string): string { return '#/dashboard/result/'+encodeURIComponent(viewId); }
export function resultFromHash(hash: string): string | null {
  const prefix=hash.startsWith('#/runs/')?'#/runs/':hash.startsWith('#/dashboard/result/')?'#/dashboard/result/':null;
  if(!prefix)return null;
  try{return decodeURIComponent(hash.slice(prefix.length));}catch{return null;}
}
export function dashboardGroups(runs: readonly RunView[]) {
  return {attention:runs.filter(r=>r.attention.length>0||['blocked','failed','uncertain'].includes(r.execution)),active:runs.filter(r=>['preparing','queued','running','cancelling'].includes(r.execution)),completed:runs.filter(r=>!['preparing','queued','running','cancelling'].includes(r.execution))};
}
export function offlineProjection(last: RunProjection): RunProjection {
  return {...last,sources:last.sources.map(s=>({...s,freshness:'offline'})),runs:last.runs.map(r=>({...r,actions:[],source:{...r.source,freshness:'offline'},attention:[...new Set([...r.attention,'source-offline'])]}))};
}
