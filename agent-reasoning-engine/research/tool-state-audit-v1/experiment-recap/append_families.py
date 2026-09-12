from pathlib import Path
import json
root=Path('implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/evidence')
rows=[
('live-episodes','Initial real tool loop and controlled repairs','Scoring clear hits call cap, v2 rejects non-owned archive; retention pilot also exposes transport/delivery limitations. No retention winner.'),
('bounded-delivery','Bounded reads and confirmed full delivery, then exact-EOF correction','Clear delivers four files and five nonempty archive responses, but EOF range error stops before a patch. Untouched v2 continuation separately encounters measurement failure. Neither is a completed paired win.'),
('matched-repair','Corrected EOF runtime, identical scorer task; only retention differs','Matched pair retained with strict oracle, continuity and source checks; consult arm table for endpoints. It is one exploratory pair, not qualification.'),
('completion-control','Budget-aware inspect/synthesize/finalize phases','Single live candidate/control evidence, followed by stricter source-preservation work. Workflow completion must remain distinct from code correctness.'),
('source-preservation','Require exact inspected mutation source','0/2 accepted candidates: clear fresh-context rejection, v2 non-owned archive; no policy winner.'),
('source-corrected','Correct source projection/admission after prior pair','2/2 repairs pass 8/8 checks; clear continuity passes, v2 skips required archive recovery. 16 model calls, 61,039 input +1,104 output tokens.'),
('retention-pair','Transfer corrected runtime to tool-pair task','V2 repairs but skips archive; clear recovers but exhausts calls. Neither passes joint endpoint.'),
('execution-live','Execution-control guidance','Clear repairs but skips archive; v2 recovers but final response is progress text. Neither joint pass; conditional scorer stage unstarted.'),
('inspection-live','Inspection guidance','Both arms blocked on fresh-context admission; no candidate; v2 alone passes continuity. Conditional scorer stage unstarted.'),
('overhead-live','Shorter prompts','Both exhaust 12 model calls without patch/recovery despite no context-admission block. Prompt shortening alone is not success.'),
('working-loop','Adaptive completion/retention/source guidance, nine retention iterations and two scorer iterations','Final selected four arms all repair and recover. Prior failures include schema, admission, timeout, credentials, semantics and deferred-read identity. Working examples selected after tuning, not 4/4 unbiased reliability.'),
('repeatability','Freeze successful candidate; repeat two tasks/policies three times','8/12 joint passes; recent retention tool-pair repair is 0/3. Earlier selected success did not establish repeatability.'),
('context-sweep','Frozen 8K/10K/12K sweep','8/18 joint repair+continuity passes. Larger nominal windows do not ensure actual recycling exposure.'),
('patch-contract','v4 patch contract guidance','1/6 joint passes across windows/policies; strict contract guidance did not solve completion.'),
('contract-loop','v5 compact contract guidance','Adaptive loop reaches three consecutive paired successes: overall 7/8 repairs,8/8 continuity. Keep original failure; stopping on success biases reliability interpretation.'),
('headroom-generalization','v7 reserved headroom after tuning v6/v7','Four 8K confirmations pass with ≥342-token headroom; separate fixed12 run has9 repairs/7 continuity. New tasks expose limits; no causal attribution to headroom alone.'),
('completion-calibration','v8 explicit delivery/recovery gates and margin calibration','Fixed12 rerun12/12 repairs/gates;10/10 recycled continuity. Prior v7 same schedule9/12 repairs. Calibration108 known measured responses→512 margin; sequential changes/provider conditions confound causality.'),
('expanded-validation','Broaden v8 fixed matrix','48/48 terminal;39 repairs,40 gates;18 continuity among25 recycled trials. Pilot criteria fail; 8K long-window workload remains difficult.'),
('paged-delivery','v9 partial-file paging completion','0/6 repairs and0/6 gates; admission/coverage fails. Negative construction evidence.'),
('compact-paging','v10 smaller pages','0/6 repairs,4/6 gates,2/6 historical continuity. Page fitting is not correctness.'),
('assembled-paging','v11 gap-free full-file assembly and hash validation','1/4 repairs,3/4 gates,2/4 historical continuity; two wrong patches and one deadline. Combined v9–v11 sixteen trials are different candidates, not one rate.'),
('budgeted-paging','v12 window-specific page size and remaining page-turn lower bound','1/4 repairs/gates; two page-turn-budget blocks and one deadline. 8K cap raised12→16 model calls; not an equal-call comparison.'),
('page-adherence','v13 enforce paging adherence','3/4 repairs/gates/continuity; one deadline. Predeclared target fails.'),
('final-latency','v14 final response latency policy','8/12 repairs,10/12 gates,5/5 recycled continuity. Target fails; completion and semantic outcomes separate.'),
('synthesis-adherence','v15 final requirement-by-requirement/schema reminder vs v14 on four prior failures','v15 1/4 repairs vs v14 3/4; three v15 schema_version omissions. No support for selecting v15; selected known failures and one pair/case limit generalization.'),
('schema-output','Three direct hosted schema-format probes','Text copy preserves content; JSON-object copy drops lowercase json from text/source; strict json_schema conflicting prompt violates required output. No usable provider enforcement established by3 calls.'),
('native-submission','Native submit_patch_candidate tool protocol','6/6 direct probes valid, source bytes preserved (three copies,three small edits). Protocol feasibility, not integrated coding quality.'),
('native-runtime','v16 integrated native submission','3/4 repairs,4/4 gates,1/1 recycled continuity. Target fails on remaining semantics.'),
('native-reasoning','v17 native reasoning prompt variant','1/4 repairs,3/4 gates,1/1 recycled continuity; deadline and repair failures remain.'),
('minimal-repair','v18 smaller repair guidance','2/4 repairs,4/4 gates,1/1 recycled continuity. Target fails.'),
('case-evidence','v19 explicit case evidence','2/4 repairs,4/4 gates,1/1 recycled continuity. Evidence delivery alone does not ensure boundary repair.'),
('example-fields','v20 example schema fields; targeted/broader/repeat screens','9/10 repairs total: targeted4/4,broader3/4,repeat2/2. One transport failure counted. Adaptive screening; not independent confirmation.'),
('fixed-repeatability','Freeze v20 eight-trial8K repeat','3/8 repairs,6/8 gates,4/5 recycled continuity. Prior9/10 fails to repeat; secret/validator/semantic failures need separate attribution.'),
('repair-validation','Public semantic validator and secret diagnostics','Both confirmed semantic defects rejected; one historical failed oracle execution rechecks as correct. Original3/8 remains unchanged; new diagnosis is not replacement success.'),
('public-feedback','At most one corrective model call after public checks','Six retained submissions; zero verified corrective repairs, two unchanged passes,three blocks and one replacement validation timeout. Model and infrastructure effects mixed.'),
('execution-readiness','Local readiness gate before corrections','0/8 ready rounds,15/24 child probes timeout; no API calls. Gate prevents unhealthy execution, not model improvement.'),
('execution-readiness-repeat','Same readiness diagnostic after environment changes','8/8 ready; six retained validations, four pass/two known defects reject; zero model/tokenizer API calls. Environment repeat, not model replication.'),
('ready-feedback','Readiness-gated corrections','Two generated corrections pass8/8 separate oracle each; one public validation timeout and final unchanged proposal block prevent full target.'),
('isolated-validation','Disposable validation workers','6/6 retained corrected/oracle-correct proposals pass public checks; no model calls. Validates isolation/cleanup; same proposals must not be counted as fresh repairs.'),
('container-feedback','Integrate disposable validator with one correction','2/2 corrective proposals pass public+oracle; all six final proposals8/8 oracle. Four unchanged originals add no model calls.'),
('fresh-feedback','Fresh four-task episode set with correction stage','4/4 initial/final;2/2 recycled continuity; zero corrections. Good outcomes, correction mechanism unexercised.'),
('matrix-feedback','Freeze four tasks ×three windows','11/12 initial/final; sole failure missing authority_effect.3/3 recycled continuity;12/12 target fails.'),
('format-repair','One explicit missing-authority-field correction','One retained failure recovers in1 model+1 tokenizer call, identical source bytes;9/9 public and8/8 oracle. Separate correction, not fresh independent episode.'),
('shared-correction','One shared format/semantic correction allowance','Fresh12 matrix11/12 initial/final;missing schema_version ineligible,zero corrections. No live recovery exposure; unchanged false outcome retained.'),
('schema-recovery-plan','Parser and full-schema audit','Three read-only probes identify type mismatch,array exception,multi-error collection; planning only,no live calls.'),
('schema-recovery','Canonical full schema, bounded joint diagnostic eligibility','Fresh12 initial9/12→final12/12 with3 corrections. Handoff defect repaired between initial/correction freezes; initial trials never rerun. Retained combined format+semantic failure consumes shared allowance and remains failed.'),
('glm-finish-plan','Consolidate product milestones','Planning/source inspection only. M1 known-fixture qualification is distinct from M2 capacity,M3 corpus,M5 integration,M6 holdout and M7 acceptance.')]
out=Path(__file__).resolve().parent
p=out/'RECAP.md'
with p.open('a') as f:
 for prefix,var,res in rows:
  candidates=list(root.glob(prefix+'-*/README.md'))
  if prefix=='execution-readiness':candidates=[x for x in candidates if 'repeat' not in x.parent.name]
  if prefix=='schema-recovery':candidates=[x for x in candidates if '-plan-' not in x.parent.name]
  if prefix=='source-preservation':pass
  assert len(candidates)==1,(prefix,candidates)
  src=candidates[0];link='../../../../'+str(src)
  f.write(f'| [{src.parent.name}]({link}) | {var} | {res} |\n')
# Add interpreted machine rows to inventory; exact source docs remain linked.
data=json.loads((out/'inventory.json').read_text());data['episode_development_recap']=[{'family':a,'changed_variable_or_question':b,'outcome_and_limit':c} for a,b,c in rows];(out/'inventory.json').write_text(json.dumps(data,indent=2)+'\n')
