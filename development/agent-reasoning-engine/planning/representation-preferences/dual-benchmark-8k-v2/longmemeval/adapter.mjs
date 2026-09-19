// Generic scope ablation; unchanged frozen evidence projection. Open questions: ../PLAN.md.
import {project,retrievalMessages} from '../../dual-benchmark-8k-v1/longmemeval/adapter.mjs';
export const SCOPE_POLICY='For recommendations, use the applicable preferences and constraints supported by the retained conversation. Preserve their scope: do not broaden to other categories, services, formats or criteria unless the current request asks for alternatives or the evidence supports the change. Distinguish explicit preferences from uncertain inferences. Treat a later explicit change as an update rather than combining conflicting preferences. If no suitable recommendation can be supported, state the limitation instead of inventing a preference.';
export function scopeMessages(row,projection=project(row)){
 const messages=retrievalMessages(row,projection);
 return [{...messages[0],content:messages[0].content+' '+SCOPE_POLICY},...messages.slice(1)];
}
