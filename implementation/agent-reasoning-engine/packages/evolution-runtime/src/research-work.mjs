import {canonicalJson, digest, sealed, isRecord, text} from "../../request-intent-runtime/src/canonical.mjs";
import {verifyResearchDag} from "./research-dag.mjs";
const check = (ok, code) => {if (!ok) throw Error(code);};
const closed = (x, keys) => isRecord(x) && Object.keys(x).every(k => keys.includes(k));
function strings(xs) {
  check(Array.isArray(xs) && xs.every(text) && new Set(xs).size === xs.length, "research-work.invalid-set");
  return [...xs].sort();
}
export function materializeResearchPlan({research_dag, registrations, tasks, verify_registration}) {
  check(verifyResearchDag(research_dag, registrations, verify_registration), "research-work.source-drift");
  check(Array.isArray(tasks) && tasks.length > 0 && tasks.length <= 1000, "research-work.tasks-invalid");
  const ids = new Set(), questions = new Set(research_dag.nodes.filter(n => n.kind === "question").map(n => n.node_id));
  const normalized = tasks.map(t => {
    check(closed(t,["task_id","title","owner","lane","stage","question_ref","depends_on","completion_criteria","validator_ref"])
      && [t.task_id,t.title,t.owner,t.stage,t.validator_ref].every(text)
      && ["product-construction","operational-support"].includes(t.lane) && questions.has(t.question_ref), "research-work.task-invalid");
    check(!ids.has(t.task_id), "research-work.duplicate-task"); ids.add(t.task_id);
    const criteria = strings(t.completion_criteria);check(criteria.length > 0,"research-work.criteria-required");
    return {...t, depends_on: strings(t.depends_on), completion_criteria: criteria};
  }).sort((a,b) => a.task_id < b.task_id ? -1 : 1);
  check(normalized.every(t => t.depends_on.every(id => ids.has(id) && id !== t.task_id)), "research-work.missing-or-self-dependency");
  const remaining = new Map(normalized.map(t => [t.task_id,t])), order = [];
  while (remaining.size) {
    const ready = [...remaining.values()].filter(t => t.depends_on.every(id => !remaining.has(id)));
    check(ready.length > 0,"research-work.cycle");
    for (const t of ready) {order.push(t.task_id);remaining.delete(t.task_id);}
  }
  return sealed("are.research-work-plan/v1", {research_dag, tasks: normalized, topological_order: order}, "plan_digest");
}

export function replayResearchWork({plan, registrations, events = [], verify_evidence, verify_registration}) {
  check(canonicalJson(plan) === canonicalJson(materializeResearchPlan({research_dag:plan?.research_dag,registrations,tasks:plan?.tasks,verify_registration})), "research-work.plan-invalid");
  check(Array.isArray(events) && events.length <= 10000,"research-work.events-invalid");
  const lifecycle = new Map(plan.tasks.map(t => [t.task_id,{state:"planned",reason:null,evidence:[]}])), seen = new Set();
  function project() {
    const rows = new Map();
    for (const id of plan.topological_order) {
      const task = plan.tasks.find(t => t.task_id === id), own = lifecycle.get(id);
      const waiting = task.depends_on.filter(d => rows.get(d).state !== "completed");
      const blocked = waiting.filter(d => rows.get(d).state === "blocked");
      rows.set(id,{task_id:id, lane:task.lane, state:own.state === "planned" ? blocked.length ? "blocked" : waiting.length ? "planned" : "ready" : own.state,
        waiting_for:waiting, blocked_by:blocked, reason:own.reason, evidence:own.evidence});
    }
    return plan.tasks.map(t => rows.get(t.task_id));
  }
  for (const event of events) {
    check(closed(event,["event_id","task_id","action","reason","evidence"]) && text(event.event_id) && lifecycle.has(event.task_id)
      && ["start","block","resume","complete"].includes(event.action),"research-work.event-invalid");
    check(!seen.has(event.event_id),"research-work.duplicate-event");seen.add(event.event_id);
    const row = project().find(r => r.task_id === event.task_id), own = lifecycle.get(event.task_id), task = plan.tasks.find(t => t.task_id === event.task_id);
    if (event.action === "start") {check(row.state === "ready","research-work.not-ready");own.state="running";}
    if (event.action === "block") {check(["ready","running"].includes(row.state) && text(event.reason),"research-work.block-invalid");own.state="blocked";own.reason=event.reason;}
    if (event.action === "resume") {check(own.state === "blocked","research-work.resume-invalid");own.state="planned";own.reason=null;}
    if (event.action === "complete") {
      check(row.state === "running" && typeof verify_evidence === "function","research-work.completion-verifier-required");
      check(Array.isArray(event.evidence) && event.evidence.length === task.completion_criteria.length,"research-work.completion-evidence-required");
      const criteria = [];
      for (const e of event.evidence) {
        check(closed(e,["criterion_id","artifact_ref","artifact_digest"]) && text(e.artifact_ref) && /^[a-f0-9]{64}$/.test(e.artifact_digest)
          && task.completion_criteria.includes(e.criterion_id),"research-work.evidence-invalid");
        criteria.push(e.criterion_id);
        const binding = {plan_digest:plan.plan_digest,task_id:task.task_id,validator_ref:task.validator_ref,...e};
        // The adapter must resolve and validate the artifact, not just echo a URL.
        const verified = verify_evidence(structuredClone(binding));
        check(verified?.ok === true && canonicalJson(verified.binding) === canonicalJson(binding),"research-work.evidence-not-verified");
      }
      check(new Set(criteria).size === criteria.length,"research-work.duplicate-criterion");
      own.state="completed";own.evidence=structuredClone(event.evidence);
    }
  }
  const rows = project();
  return sealed("are.research-work-state/v1", {plan_digest:plan.plan_digest, events:structuredClone(events),tasks:rows,
    frontier:{product_construction:rows.filter(r=>r.lane==="product-construction" && r.state==="ready").map(r=>r.task_id),
      operational_support:rows.filter(r=>r.lane==="operational-support" && r.state==="ready").map(r=>r.task_id)},
    execution_effect:"none"}, "state_digest");
}

export function transitionResearchWork({plan,registrations,state,event,expected_state_digest,verify_evidence,verify_registration}) {
  const current=replayResearchWork({plan,registrations,events:state?.events,verify_evidence,verify_registration});
  check(canonicalJson(current)===canonicalJson(state),"research-work.state-invalid");
  const previous=state.events.find(e=>e.event_id===event?.event_id);
  if(previous) {check(canonicalJson(previous)===canonicalJson(event),"research-work.event-conflict");return current;}
  check(expected_state_digest===state.state_digest,"research-work.stale-state");
  return replayResearchWork({plan,registrations,events:[...state.events,event],verify_evidence,verify_registration});
}
