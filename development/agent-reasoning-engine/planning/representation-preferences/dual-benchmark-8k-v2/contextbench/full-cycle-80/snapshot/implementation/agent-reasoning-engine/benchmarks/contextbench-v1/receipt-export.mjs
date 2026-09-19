// Bridge exact confirmed request reads to ContextBench export. Open questions: README.md.
import {bindDelivery} from './delivery.mjs';import {exportTrajectory} from './export.mjs';
import {projectObservationsToBase} from './source-map.mjs';
export function exportCapturedContext({captures,receipts,task,final_read_ids,source_snapshots},repoRoot){
 const binding=bindDelivery({captures,receipts});
 if(binding.unmapped.length)throw Error('instrument.unmapped-read-evidence');
 if(!Array.isArray(final_read_ids))throw Error('instrument.final-selection-required');
 if(!final_read_ids.every(id=>binding.read_observations.some(r=>r.id===id)))throw Error('instrument.undelivered-final-selection');
 const projection=source_snapshots===undefined?null:projectObservationsToBase(binding.read_observations,source_snapshots,repoRoot);
 // Dropping selected changed lines would shrink precision's denominator. Keep
 // this outcome explicitly unscorable, never evaluate just its favorable fragments.
 if(projection?.projections.some(p=>final_read_ids.includes(p.read_id)&&p.unmapped_current_lines.length))throw Error('instrument.final-context-unmapped-current-lines');
 const events=projection?.events??binding.read_observations.map(r=>({id:r.id,path:r.path,start_line:r.start_line,end_line:r.end_line,body:r.body,body_encoding:'legacy-line-join',source_sha256:r.source_sha256,delivered:true,turn:r.first_confirmed_receipt}));
 const final_event_ids=projection?projection.projections.filter(p=>final_read_ids.includes(p.read_id)).flatMap(p=>p.event_ids):final_read_ids;
 const ledger={schema_version:'are.context-delivery-ledger/v1',instance_id:task.instance_id,repo_url:task.repo_url,commit:task.base_commit,events,final_event_ids};
 const exported=exportTrajectory(ledger,repoRoot);
 return {...exported,...(projection?{source_projection:projection,trajectory_projection_complete:projection.projections.every(p=>!p.unmapped_current_lines.length)}:{}),delivery_binding:binding,selection_posture:'Caller-provided explicit selection; runner must bind to model response or declared final-view instrumentation. Never inferred from archive union.'};
}
