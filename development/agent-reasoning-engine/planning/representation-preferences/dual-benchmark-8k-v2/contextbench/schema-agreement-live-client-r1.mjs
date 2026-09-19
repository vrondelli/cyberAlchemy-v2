// Schema-agreement candidate. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Candidate-only descendant of comparison-compact-live-client.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Strict campaign binding around the existing production factory. Open questions: COMPARISON-LIVE-CLIENT.md.
import {liveClientFactory} from './packet-diversity-v1/live-client-admission-v5.mjs';
const need=(v,m)=>{if(!v)throw Error('comparison-client.'+m);};
export function comparisonLiveClientFactory({credential_path,signal,persistence,before_dispatch}){
 need(signal instanceof AbortSignal&&!signal.aborted,'active-shared-signal');
 need(typeof before_dispatch==='function','dispatch-admission-required');
 const checkedDispatch=async()=>{
  need(!signal.aborted,'cancelled');need(await before_dispatch()===true,'dispatch-denied');need(!signal.aborted,'cancelled');
 };
 const factory=liveClientFactory({credential_path,signal,persistence,before_dispatch:checkedDispatch});
 return Object.freeze({
  create_client(args){
   need(args?.signal===signal,'signal-identity');const cell=args.cell;
   need(['schema-agreement'].includes(cell?.comparison_arm),'arm');
   need(cell.context_limit===8000&&cell.limits?.total_tokens===96000&&cell.limits.maximum_calls===96,'common-budget');
   need(cell.provider_profile?.request_tokenizer_transport_attempts===1&&cell.provider_profile.index_tokenizer_transport_attempts===1,'single-attempt-policy');
   return factory.create_client(args);
  },
  measure_index_tokens:factory.measure_index_tokens
 });
}
