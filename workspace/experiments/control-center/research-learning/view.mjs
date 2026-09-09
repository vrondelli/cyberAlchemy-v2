import {canonicalJson, digest} from '../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork,transitionResearchWork} from '../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {assessInput,materializeRegistration,verifyRegistration,profile} from './adapter.mjs';

export function buildView(input) {
  const registration=materializeRegistration(input), registrations=[registration], verify_registration=verifyRegistration;
  const research_dag=materializeResearchDag({registrations,verify_registration});
  const task=(task_id,title,depends_on,criterion,lane='product-construction',stage='research')=>({task_id,title,depends_on,
    question_ref:registration.question.record_id,owner:lane==='product-construction'?'Workspace research owner':'Workspace test operator',
    lane,stage,completion_criteria:[criterion],validator_ref:'workspace.research-evidence/v1'});
  const tasks=[
    task('evidence.inspect','Verify historical CC006 evidence',[],'verified-cc006-evidence'),
    task('latency.inspect','Map startup timing boundaries',['evidence.inspect'],'timing-boundary-report'),
    task('latency.hypothesize','Declare causal alternatives and falsifiers',['latency.inspect'],'controlled-hypotheses'),
    task('experiment.register','Freeze a controlled comparison',['latency.hypothesize'],'exact-experiment-manifest'),
    task('host.qualify','Qualify host for the selected future run',[],'qualified-host','operational-support','product-test'),
    task('experiment.run','Run exact selected comparison',['experiment.register','host.qualify'],'qualified-comparison','product-construction','product-test'),
    task('experiment.assess','Assess retained results',['experiment.run'],'comparison-assessment'),
  ];
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration});
  const inspection={schema_version:'workspace.cc006-evidence-inspection/v1',report_digest:profile.report.sha256,
    registration_digest:registration.registration_digest,assessment:assessInput(input),authority_effect:'none'};
  const artifact_ref='workspace-evidence-inspection:'+digest(inspection);
  const verify_evidence=b=>{
    try {
      // Resolve exactly one supported criterion. Future criteria have no permissive default.
      const current={...inspection,assessment:assessInput(input)};
      const ok=b.plan_digest===plan.plan_digest && b.task_id==='evidence.inspect'
        && b.validator_ref==='workspace.research-evidence/v1' && b.criterion_id==='verified-cc006-evidence'
        && b.artifact_ref===artifact_ref && b.artifact_digest===digest(current);
      return {ok,binding:b};
    } catch {return {ok:false};}
  };
  const initial=replayResearchWork({plan,registrations,verify_registration});
  const running=transitionResearchWork({plan,registrations,verify_registration,state:initial,expected_state_digest:initial.state_digest,
    event:{event_id:'inspect-start',task_id:'evidence.inspect',action:'start'}});
  const state=transitionResearchWork({plan,registrations,verify_registration,verify_evidence,state:running,expected_state_digest:running.state_digest,
    event:{event_id:'inspect-complete',task_id:'evidence.inspect',action:'complete',evidence:[{
      criterion_id:'verified-cc006-evidence',artifact_ref,artifact_digest:digest(inspection)}]}});
  const material={schema_version:'workspace.research-view/v1',registration_digest:registration.registration_digest,
    assessment:registration.assessment,research_dag,plan,state,inspection,
    limitations:['Research DAG is logical dependency, not proven causality or dispatch permission.',
      'Evidence inspection complete does not mean benchmark success.',
      'Future completion criteria require separately implemented substantive verifiers.',
      'Historical process receipts are not independent process attestation.'],authority_effect:'none'};
  return {registration,view:{...material,view_digest:digest(material)},verify_evidence};
}

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderHtml(view) {
  const d=view.research_dag;
  const cards=d.dependency_layers.map((layer,i)=>`<section><h2>Layer ${i+1}</h2>${layer.map(id=>{
    const n=d.nodes.find(n=>n.node_id===id);
    return `<article><small>${escape(n.kind)}</small><h3>${escape(n.label)}</h3><p>${escape(n.outcome??n.disposition??n.state)}</p><details><summary>Source identity</summary><code>${escape(n.node_id)}</code><p>${escape(n.source_digest)}</p></details></article>`;
  }).join('')}</section>`).join('<span class="arrow" aria-hidden="true">→</span>');
  const rows=view.plan.tasks.map(t=>{
    const s=view.state.tasks.find(s=>s.task_id===t.task_id);
    return `<tr><td>${escape(t.title)}</td><td>${escape(t.lane)}</td><td>${escape(s.state)}</td><td>${escape(s.waiting_for.join(', ')||'none')}</td><td>${escape(t.owner)}</td></tr>`;
  }).join('');
  const edges=d.edges.map(e=>`<li>${escape(d.nodes.find(n=>n.node_id===e.from).kind)} → ${escape(d.nodes.find(n=>n.node_id===e.to).kind)}: ${escape(e.kind)}</li>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workspace research learning</title>
<style>body{font:16px system-ui;background:#111923;color:#e7edf4;margin:2rem;line-height:1.5}h1,h2,h3{line-height:1.2}h2{font-size:1rem}h3{font-size:1rem}main{max-width:1500px;margin:auto}.banner,article{padding:1rem;border:1px solid #586f86;border-radius:8px;background:#1b2937}.banner{border-color:#e3ae65}.dag{display:flex;gap:.7rem;overflow:auto;margin:2rem 0}.dag section{min-width:210px;flex:1}.dag article{margin:.6rem 0}.arrow{align-self:center}code,details p{overflow-wrap:anywhere;font-size:.75rem}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:.7rem;border-bottom:1px solid #586f86}.table{overflow:auto}small{color:#9cccf4}a{color:#9cccf4}</style>
<main><h1>Workspace research learning</h1><p>CC006 · retrospective evidence · read-only prototype</p>
<div class="banner"><strong>Smoke failed. Host rejected. Performance inference: not evaluable.</strong><p>Memory pressure invalidates a repair-benefit conclusion. Completing evidence inspection does not make the treatment pass.</p></div>
<h2>Derived research DAG</h2><p>Prerequisite layers, not execution history. Exact edges are listed below.</p><div class="dag">${cards}</div><details><summary>Dependency edges</summary><ul>${edges}</ul></details>
<h2>Derived work state</h2><div class="table"><table><thead><tr><th>Task</th><th>Lane</th><th>State</th><th>Waiting for</th><th>Owner</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Open question</h2><p>${escape(d.nodes.find(n=>n.kind==='question').label)}</p><h2>Evidence limits</h2><ul>${view.limitations.map(l=>'<li>'+escape(l)+'</li>').join('')}</ul>
<details><summary>View digest</summary><code>${escape(view.view_digest)}</code></details><p>No automatic dispatch, activation, product approval or publication.</p></main></html>\n`;
}
