import {readFileSync} from 'node:fs';
import {prepareHistory,verifyPreparedHistory} from './ledger.mjs';
import {chunkHistory} from './chunks.mjs';
export function prepareTasks(){
 const rows=JSON.parse(readFileSync(new URL('../longmemeval/inputs.json',import.meta.url)));
 return rows.filter(r=>r.split==='development').map(row=>{
  const history=prepareHistory(row);verifyPreparedHistory(history,row);
  const partition=chunkHistory(row);
  const visible=history.units.map(({source_digest,event_digest,...u})=>u);
  if(JSON.stringify(visible)!==JSON.stringify(partition.chunks.flat()))throw Error('ledger/partition source mismatch');
  const bound=new Map(history.units.map(u=>[u.source_id,u]));
  return {task_id:row.task_id,question:row.question,question_date:row.question_date,chunks:partition.chunks.map(c=>c.map(u=>{
   const source=bound.get(u.source_id);return {source_id:source.source_id,date:source.date,role:source.role,content:source.content};
  })),ledger:history,ledger_evidence:history.evidence,source_digest:partition.source_digest};
 });
}
