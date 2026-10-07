// Additive ranked-source-hints production candidate. Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
// Candidate-only descendant of comparison-compact-live-client.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Strict campaign binding around the existing production factory. Open questions: COMPARISON-LIVE-CLIENT.md.
import {liveClientFactory} from './packet-diversity-v1/live-client-admission-v5.mjs';
const need=(v,m)=>{if(!v)throw Error('comparison-client.'+m);};
const FORBIDDEN_INDETERMINATE_MODEL_REQUESTS=new Set([
 '301cc40e2766a5d91f75dabf5ce1894c442dc9b054fa4b0cf4405a024abd883b',
 '6f6865e326969a913e8ba7ffa3ffcca49fb2d1358b4dc1e4eecb45e2f499b636',
 '64b49959201a2d7f9d858497c64d5f9983a7dd7339fc812b3c731ec9f86507be',
 '427478c1bdfcd435e53f0f25f4084f65e004068327f12f00d7546750d6631f46'
]);
export function comparisonLiveClientFactory({credential_path,signal,persistence,before_dispatch,candidate_arm='ranked-source-hints',...transport}){
 need(signal instanceof AbortSignal&&!signal.aborted,'active-shared-signal');
 need(typeof before_dispatch==='function','dispatch-admission-required');
 need(['ranked-source-hints','intent-anchor-convergence-r3','intent-anchor-source-neighborhood-r1','intent-anchor-search-followthrough-r1','intent-anchor-objective-search-r1','intent-anchor-api-search-r1','intent-anchor-api-search-r2','intent-anchor-api-search-r3','intent-anchor-terminal-shortlist-r1','intent-anchor-terminal-shortlist-cap12-r1','intent-anchor-terminal-shortlist-adaptive-r1','intent-anchor-terminal-shortlist-objective-r1','intent-anchor-terminal-shortlist-distinctive-r1','intent-anchor-terminal-shortlist-distinctive-early-r1','intent-anchor-terminal-shortlist-distinctive-conditional-r1','intent-anchor-terminal-shortlist-distinctive-identifier-r1','intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1','intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1','intent-anchor-terminal-shortlist-uncovered-requirement-r1'].includes(candidate_arm),'candidate-arm');
 const checkedDispatch=async(attempt={})=>{
  need(!signal.aborted,'cancelled');need(await before_dispatch()===true,'dispatch-denied');need(!signal.aborted,'cancelled');
  need(attempt.kind!=='model'||!FORBIDDEN_INDETERMINATE_MODEL_REQUESTS.has(attempt.request_sha256),'indeterminate-request-replay-denied');
 };
 const factory=liveClientFactory({credential_path,signal,persistence,before_dispatch:checkedDispatch,...transport});
 return Object.freeze({
  create_client(args){
   need(args?.signal===signal,'signal-identity');const cell=args.cell;
   need(cell?.comparison_arm===candidate_arm,'arm');
   need(cell.context_limit===8000&&[96000,160000].includes(cell.limits?.total_tokens)&&cell.limits.maximum_calls===96,'common-budget');
   need(cell.provider_profile?.request_tokenizer_transport_attempts===1&&cell.provider_profile.index_tokenizer_transport_attempts===1,'single-attempt-policy');
   return factory.create_client(args);
  },
  measure_index_tokens:factory.measure_index_tokens
 });
}
