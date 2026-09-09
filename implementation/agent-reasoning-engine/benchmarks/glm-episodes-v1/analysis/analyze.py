"""Offline GLM evidence analysis. Contract and open questions: README.md.
Only exported benchmark evidence is read; no provider calls or candidate execution.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def canonical(value):
    return digest(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode())

def quantile(values, q):
    values = sorted(x for x in values if isinstance(x, (int, float)))
    return values[max(0, math.ceil(len(values)*q)-1)] if values else None

def classify(row):
    """Independent labels, not a made-up mutually exclusive root cause."""
    tags = []
    if row.get('schema_ok') is False: tags.append('schema')
    if row.get('initial_oracle_ok') is False or row.get('public_before_ok') is False: tags.append('semantic')
    if row.get('transport_failures', 0): tags.append('transport-observed')
    if row.get('gate') is False: tags.append('delivery-gate')
    if row.get('recycles', 0) > 0 and row.get('continuity') is False: tags.append('continuity')
    if row.get('minimum_headroom') is not None and row['minimum_headroom'] <= 0: tags.append('headroom')
    if row.get('initial_pass') is False and not tags: tags.append('unclassified')
    return tags

class Corpus:
    def __init__(self, root):
        self.root = root.resolve()
        self.inputs = {}
        self.diagnostics = []
        self.cache = {}

    def read(self, p):
        p = p.resolve()
        if not p.is_relative_to(self.root): raise ValueError('evidence path outside root')
        if p in self.cache: return self.cache[p]
        raw = p.read_bytes()
        self.inputs[str(p.relative_to(self.root))] = digest(raw)
        value = json.loads(raw)
        self.cache[p] = value
        return value

    def optional(self, p):
        return self.read(p) if p.exists() else {}

    def diagnostic(self, p, code):
        self.diagnostics.append({'source': str(p.relative_to(self.root)), 'code': code})


def discover(c):
    rows, responses, calls, seen = [], [], [], {}
    for p in sorted(c.root.rglob('result.json')):
        try: result = c.read(p)
        except (ValueError, OSError):
            c.diagnostic(p, 'unreadable-json'); continue
        if not isinstance(result, dict) or result.get('schema_version') != 'are.glm-episodes-result/v1': continue
        manifest = c.optional(p.with_name('manifest.json'))
        if not manifest:
            c.diagnostic(p, 'missing-manifest'); continue
        # Validate the runtime's canonical-JSON binding; inventory also retains raw byte hashes.
        if result.get('manifest_sha256') != canonical(manifest):
            c.diagnostic(p, 'manifest-binding-mismatch'); continue
        parts = p.relative_to(c.root).parts
        campaign = parts[0]
        qm = c.optional(c.root/campaign/'run/manifest.json')
        qualification = qm.get('rounds') == 3 and qm.get('trials') == 36
        qa = c.optional(c.root/campaign/'run/result.json') if qualification else {}
        complete = qa.get('status') == 'COMPLETED' and qa.get('completed_trials') == qa.get('planned_trials') == 36 and isinstance(qa.get('rounds'), list) and len(qa['rounds']) == 3
        cohort = 'qualification-complete' if qualification and complete else 'qualification-incomplete' if qualification else 'development'
        checked = c.optional(p.with_name('checked-report.json'))
        schedule = c.optional(p.parent.parent/'manifest.json').get('plan', {}).get('schedule', [])
        for arm in result.get('arms', []):
            idx = arm.get('index'); key = f'{p.relative_to(c.root)}#arm-{idx}'
            trace_paths = [p.parent/f'arm-{idx}/visible-trace.json']
            if len(result['arms']) == 1: trace_paths.insert(0, p.with_name('visible-trace.json'))
            tp = next((x for x in trace_paths if x.exists()), None)
            trace = c.read(tp) if tp else {}
            identity = (arm.get('directory'), arm.get('agent_result_sha256'))
            if all(identity) and identity in seen:
                c.diagnostic(p, 'duplicate-arm-export:'+seen[identity]); continue
            if all(identity): seen[identity] = key
            reported = next((x for x in checked.get('arms', []) if x.get('index') == idx), {})
            soft = manifest.get('context_policy', {}).get('recycle_at')
            trial_index = int(p.parent.name[6:]) if p.parent.name.startswith('trial-') and p.parent.name[6:].isdigit() else None
            sched = schedule[trial_index] if trial_index is not None and trial_index < len(schedule) else {}
            verify = (arm.get('verification') or {}).get('verification') or {}
            recs = trace.get('receipts', [])
            model = [x for x in recs if x.get('kind') == 'model']
            r = {'key': key, 'campaign': campaign, 'cohort': cohort,
                 'round': next((s for s in parts if s.startswith('round-')), None),
                 'trial_id': sched.get('id'), 'episode': arm.get('episode_id'),
                 'task_sha256': arm.get('task_sha256'), 'fixture_sha256': arm.get('fixture_tree_sha256'),
                 'policy': arm.get('completion_policy'), 'retention': arm.get('retention_policy'),
                 'source_version': canonical(manifest.get('sources', [])),
                 'soft_limit': soft, 'hard_limit': manifest.get('context_policy', {}).get('context_limit'),
                 'model_timeout_ms': manifest.get('model_timeout_ms', 30000),
                 'initial_retry_budget': manifest.get('maximum_model_retries', 0),
                 'status': arm.get('agent_status'), 'initial_pass': arm.get('patch_correct'),
                 'initial_oracle_ok': verify.get('ok'),
                 'failed_oracle_checks': [x['id'] for x in verify.get('results', []) if x.get('passed') is False],
                 'gate': (trace.get('completion_gate') or reported.get('completion_gate') or {}).get('passed'),
                 'recycles': arm.get('recycles'), 'continuity': (arm.get('continuity') or {}).get('passed'),
                 'minimum_headroom': min((x['soft_headroom_tokens'] for x in arm.get('dispatch_headroom', []) if 'soft_headroom_tokens' in x), default=None),
                 'reasons': arm.get('reasons', []), 'schema_recorded': trace.get('candidate_validation'),
                 'trace_available': tp is not None, 'elapsed_ms': arm.get('elapsed_ms'),
                 'model_attempts': len(model) if tp else None,
                 'transport_failures': sum(x.get('status') != 200 for x in recs),
                 'model_retries': sum(x.get('attempt_index') == 1 for x in model),
                 'final_pass': None, 'public_before_ok': None, 'correction_kind': None,
                 'evidence_ref': str(p.relative_to(c.root)), 'trace_ref': str(tp.relative_to(c.root)) if tp else None}
            terminal = trace.get('final_response_evidence') or {}
            if isinstance(terminal.get('text'), str) and not terminal.get('truncated'):
                if digest(terminal['text'].encode()) == terminal.get('text_sha256'):
                    responses.append({'id': key, 'text': terminal['text']})
                else: c.diagnostic(tp, 'response-hash-mismatch')
            reads = [call for step in trace.get('history', []) for call in step.get('calls', []) if call.get('name') in ['read-file','read-context-evidence','read-inspection-evidence']]
            # Page offsets are included: ordinary pagination is NOT repeated reading.
            signatures = [canonical({'name': x.get('name'), 'arguments': x.get('arguments')}) for x in reads]
            r['read_calls'] = len(reads); r['duplicate_exact_reads'] = len(signatures)-len(set(signatures))
            rows.append(r)
            for i, receipt in enumerate(recs):
                calls.append(project_receipt(key, 'initial', i, receipt))
    return rows, responses, calls


def project_receipt(key, phase, index, r):
    fields = ['kind','status','latency_ms','timeout_ms','input_tokens','output_tokens','reasoning_tokens','cached_tokens','output_cap','finish_reason','request_sha256','model_request_sequence','attempt_index','failure_code','provider_code','dispatched','retryable']
    return {'trial': key, 'phase': phase, 'index': index, **{k:r.get(k) for k in fields}}


def join_feedback(c, rows, calls):
    """Only exact same-round joins. Retained replays stay separate inventory."""
    reuse = []
    for p in sorted(c.root.rglob('result.json')):
        try: x = c.read(p)
        except (ValueError, OSError): continue
        if not isinstance(x, dict) or not isinstance(x.get('results'), list) or not isinstance(x.get('oracle'), list): continue
        if not all(isinstance(r, dict) and 'id' in r and 'result' in r for r in x['results']): continue
        manifest = c.optional(p.with_name('manifest.json'))
        expected = {s.get('id'):s for s in manifest.get('schedule', [])}
        oracles = {o['id']:o.get('result') for o in x['oracle']}
        for f in x['results']:
            candidates = [r for r in rows if (c.root/r['evidence_ref']).parent.parent == p.parent.parent/'initial' and r['trial_id'] == f['id']]
            if len(candidates) != 1:
                reuse.append({'source': str(p.relative_to(c.root)), 'id':f['id'], 'disposition':'unjoined-feedback-or-retained-reuse'}); continue
            r = candidates[0]; stage = f['result']; before = stage.get('before') or {}; after = stage.get('after') or before; oracle = oracles.get(f['id']) or {}
            if expected.get(f['id'], {}).get('episode') != r['episode']:
                c.diagnostic(p, 'feedback-episode-mismatch'); continue
            r.update({'feedback_ref':str(p.relative_to(c.root)), 'feedback_status':stage.get('status'),
                      'feedback_reasons':stage.get('reason_codes', []), 'public_before_ok':before.get('ok'),
                      'failed_public_checks':[z['id'] for z in before.get('results', []) if z.get('passed') is False],
                      'correction_kind':stage.get('correction_kind'), 'correction_dispatches':stage.get('correction_dispatches', 0),
                      'final_pass':stage.get('status') in ['UNCHANGED','REPAIRED'] and after.get('ok') is True and oracle.get('ok') is True,
                      'final_oracle_ok':oracle.get('ok'), 'public_after_ok':after.get('ok')})
            for i, receipt in enumerate((f.get('transport') or {}).get('receipts', [])):
                calls.append(project_receipt(r['key'], 'correction', i, receipt))
    return reuse


def final_failure(row, calls):
    if row.get('final_pass') is not False: return None
    if any(c['status'] != 200 for c in calls if c['phase']=='correction') and 'feedback.request-failed' in row.get('feedback_reasons', []): return 'correction-transport'
    if any(reason in ['glm.deadline-exceeded','glm.request-failed','glm.response-interrupted'] for reason in row['reasons']): return 'initial-transport'
    if row.get('public_after_ok') is False or row.get('final_oracle_ok') is False: return 'semantic-after-correction'
    return 'other-or-unknown'


def summarize(rows, calls):
    failures = [r for r in rows if r['initial_pass'] is False]
    model = [c for c in calls if c['kind']=='model']; bytrial = defaultdict(list)
    for c in model: bytrial[c['trial']].append(c)
    issues = Counter(); combos = Counter()
    for r in rows:
        paths = sorted(set(i.get('instance_path','') for i in r.get('schema_issues', [])))
        issues.update(paths)
        if paths: combos[' + '.join(paths)] += 1
    def group(key):
        result = []
        for value in sorted(set(str(r.get(key)) for r in rows)):
            rs = [r for r in rows if str(r.get(key)) == value]
            result.append({'value':value,'n':len(rs),'initial_pass':sum(r['initial_pass'] is True for r in rs),
                           'schema_failures':sum(r.get('schema_ok') is False for r in rs),
                           'semantic_observed':sum('semantic' in r['labels'] for r in rs),
                           'final_observed':sum(r['final_pass'] is not None for r in rs),
                           'final_pass':sum(r['final_pass'] is True for r in rs),
                           'recycled':sum((r['recycles'] or 0)>0 for r in rs),
                           'continuity_pass':sum((r['recycles'] or 0)>0 and r['continuity'] is True for r in rs)})
        return result
    metadata = [r for r in rows if r.get('schema_ok') is False and r.get('schema_issues') and all(i.get('instance_path') in ['/schema_version','/authority_effect','/rationale'] for i in r['schema_issues'])]
    return {'n':len(rows),'initial_pass':sum(r['initial_pass'] is True for r in rows),'initial_failures':len(failures),
            'failure_labels':dict(Counter(t for r in failures for t in r['labels'])),
            'final_failure_categories':dict(Counter(final_failure(r,bytrial[r['key']]) for r in rows if r['final_pass'] is False)),
            'failed_public_checks':dict(Counter(x for r in rows for x in r.get('failed_public_checks', []))),
            'fixture_versions_by_episode':{e:len({r['fixture_sha256'] for r in rows if r['episode']==e}) for e in sorted({r['episode'] for r in rows})},
            'schema_issue_paths':dict(issues.most_common()),'schema_issue_combinations':dict(combos.most_common()),
            'schema_only_metadata':len(metadata), 'metadata_failures_public_before_pass':sum(r['public_before_ok'] is True for r in metadata),
            'metadata_failure_examples':[r['key'] for r in metadata[:8]],
            'schema_diagnosed':sum(r.get('schema_ok') is not None for r in rows),
            'final_observed':sum(r['final_pass'] is not None for r in rows),'final_pass':sum(r['final_pass'] is True for r in rows),
            'tokenizer_attempts':sum(c['kind']=='tokenizer' for c in calls),'model_attempts':len(model),'model_failures':sum(c['status']!=200 for c in model),
            'model_retries':sum(c['attempt_index']==1 for c in model),
            'unknown_model_usage':sum(c['input_tokens'] is None or c['output_tokens'] is None for c in model),
            'known_input_tokens':sum(c['input_tokens'] or 0 for c in model), 'known_output_tokens':sum(c['output_tokens'] or 0 for c in model),
            'model_latency_p50_ms':quantile([c['latency_ms'] for c in model],.5),'model_latency_p95_ms':quantile([c['latency_ms'] for c in model],.95),
            'trial_latency_p50_ms':quantile([r['elapsed_ms'] for r in rows],.5),'trial_latency_p95_ms':quantile([r['elapsed_ms'] for r in rows],.95),
            'output_limit_hits':sum(c['finish_reason']=='length' or (c['output_cap'] is not None and c['output_tokens'] is not None and c['output_tokens']>=c['output_cap']) for c in model),
            'recycled_trials':sum((r['recycles'] or 0)>0 for r in rows),
            'continuity_failures_when_recycled':sum((r['recycles'] or 0)>0 and r['continuity'] is False for r in rows),
            'nonpositive_headroom_trials':sum(r['minimum_headroom'] is not None and r['minimum_headroom']<=0 for r in rows),
            'exact_duplicate_reads':sum(r['duplicate_exact_reads'] for r in rows),
            'by_campaign':group('campaign'),'by_window':group('soft_limit'),'by_episode':group('episode'),
            'by_policy':group('policy'),
            'by_episode_window':group('episode_window')}


def markdown(report):
    s=report['completed_qualification']; lines=['# GLM evidence analysis','',
      f"Snapshot: {report['generated_at']}. {report['inventory']['normalized_trials']} unique exported trials across {report['inventory']['campaigns']} campaigns. This is a development history, not held-out model performance.",'',
      '## Completed frozen qualification campaigns','',
      '| Campaign | Initial pass | Final pass | Schema failures | Observed semantic failures |',
      '| --- | ---: | ---: | ---: | ---: |']
    for r in s['by_campaign']:lines.append(f"| {r['value']} | {r['initial_pass']}/{r['n']} | {r['final_pass']}/{r['final_observed']} | {r['schema_failures']} | {r['semantic_observed']} |")
    lines += ['',f"Across these completed campaigns: {s['initial_pass']}/{s['n']} initial passes; {s['final_pass']}/{s['final_observed']} final passes. These repeated known tasks do not establish generalization or causality.",'',
      '## Failure mechanisms','',f"Initial failure labels (may overlap): `{json.dumps(s['failure_labels'],sort_keys=True)}`.",
      f"Final failure categories: `{json.dumps(s['final_failure_categories'],sort_keys=True)}`.",
      f"Schema paths: `{json.dumps(s['schema_issue_paths'],sort_keys=True)}`.",
      f"{s['schema_only_metadata']} schema failures involve only schema_version, authority_effect or rationale; {s['metadata_failures_public_before_pass']} of those have recorded passing public checks before correction.",
      f"{s['recycled_trials']} trials recycled; {s['continuity_failures_when_recycled']} failed recorded continuity after recycling. {s['nonpositive_headroom_trials']} trials recorded nonpositive soft headroom.",
      f"{s['model_failures']} failed physical model attempts; {s['model_retries']} retries. Usage is unknown for {s['unknown_model_usage']} model attempts. Recorded known tokens are not a billing total.",
      f"Model latency p50/p95: {s['model_latency_p50_ms']}/{s['model_latency_p95_ms']} ms. Initial trial latency p50/p95: {s['trial_latency_p50_ms']}/{s['trial_latency_p95_ms']} ms. Output-limit signals: {s['output_limit_hits']}.",'',
      '## Window and task breakdown','', '| Task / soft limit | Initial | Final observed | Schema failures |', '| --- | ---: | ---: | ---: |']
    for r in s['by_episode_window']:lines.append(f"| {r['value']} | {r['initial_pass']}/{r['n']} | {r['final_pass']}/{r['final_observed']} | {r['schema_failures']} |")
    lines += ['', '## Interpretation and next experiment','',
      'Use the separate [decision note](FINDINGS.md) for hypotheses and proposed alternatives. This generated report describes associations; the historical changes were not randomized controlled comparisons.', '',
      'No causal explanation or runtime intervention is selected by this analyzer. Sequential source changes, provider conditions and repeated use of the same tasks confound before/after comparisons. The hypothesis/DAG stage must examine alternatives before registering another experiment.', '',
      '## Coverage and limitations','',
      f"Excluded duplicate exports: {report['inventory']['duplicates']}. Unjoined feedback/reuse records: {len(report['unjoined_feedback'])}. Other diagnostics: {len(report['diagnostics'])-report['inventory']['duplicates']}.",
      'Incomplete campaigns are isolated in summary.json and never pooled into the completed qualification table. Older development results are retained separately. Missing fields remain unknown. Current-schema reanalysis is separate from recorded historical validation. No model-generated code is executed and no private reasoning is exported.',
      'Inputs are bound by relative path and SHA-256 in inputs.json. The snapshot is a file-by-file export, not an atomic snapshot of an active campaign. Source records changing during the read are reported. Original canonical-JSON manifest bindings and completed qualification aggregate counts are checked; historical runtime sources and oracles are not rerun.', '',
      '## Open Questions','',
      'Does the smaller model-facing contract reduce protocol errors without increasing semantic errors? Do results generalize beyond the four tuned fixtures? Are remaining transport faults provider-side or network-side? Provider-internal compaction cannot be determined from these records.', '']
    return '\n'.join(lines)


def run(root, output, node):
    c=Corpus(root);rows,responses,calls=discover(c);reuse=join_feedback(c,rows,calls)
    proc=subprocess.run([node,str(HERE/'diagnose.mjs')],input=''.join(json.dumps(r)+'\n' for r in responses),text=True,capture_output=True,check=True,timeout=60)
    diagnoses={d['id']:d for d in map(json.loads,proc.stdout.splitlines())}
    for r in rows:
        d=diagnoses.get(r['key'],{});r.update({'schema_ok':d.get('ok'),'schema_issues':d.get('issues',[]),'schema_diagnostics_truncated':d.get('truncated'), 'top_level_keys':d.get('top_level_keys',[]),'source_hashes':d.get('source_hashes',[]),'protected_fields_present':d.get('protected_fields_present')})
        r['labels']=classify(r);r['episode_window']=f"{r['episode']} / {r['soft_limit']}"
    def subset(cohort):
        rs=[r for r in rows if r['cohort']==cohort];keys={r['key'] for r in rs}
        return summarize(rs,[x for x in calls if x['trial'] in keys])
    # Reconcile completed campaigns against their retained aggregates before pooling.
    for campaign in sorted({r['campaign'] for r in rows if r['cohort']=='qualification-complete'}):
        selected=[r for r in rows if r['campaign']==campaign];keys={r['key'] for r in selected}
        aggregate=c.read(c.root/campaign/'run/result.json');physical=[x for x in calls if x['trial'] in keys]
        valid=(len(selected)==36 and len({(r['round'],r['trial_id']) for r in selected})==36
               and sum(r['initial_pass'] is True for r in selected)==aggregate['first_pass']
               and all(r['final_pass'] is not None for r in selected)
               and sum(r['final_pass'] is True for r in selected)==aggregate['final_verified']
               and sum(x['kind']=='model' for x in physical)==aggregate['model_attempts']
               and sum(x['kind']=='tokenizer' for x in physical)==aggregate['tokenizer_attempts'])
        if not valid:
            c.diagnostic(c.root/campaign/'run/result.json','qualification-aggregate-mismatch')
            for r in selected:r['cohort']='qualification-incomplete'
    # Do not read live input bytes again through cache when checking snapshot drift.
    drift=[p for p,h in c.inputs.items() if not (c.root/p).exists() or digest((c.root/p).read_bytes())!=h]
    report={'schema_version':'are.glm-corpus-analysis/v1','generated_at':datetime.now(timezone.utc).isoformat(),
            'inventory':{'normalized_trials':len(rows),'campaigns':len({r['campaign'] for r in rows}),'duplicates':sum(d['code'].startswith('duplicate-arm-export:') for d in c.diagnostics),'input_files':len(c.inputs)},
            'completed_qualification':subset('qualification-complete'),'incomplete_qualification':subset('qualification-incomplete'),
            'development':subset('development'),'unjoined_feedback':reuse,'diagnostics':c.diagnostics,'input_drift':drift,
            'authority_effect':'none','open_questions_ref':'REPORT.md#open-questions'}
    if not rows: raise ValueError('no valid exported episode arms; inspect evidence root and manifest bindings')
    output.mkdir(parents=True,exist_ok=False)
    for name,value in [('summary.json',report),('inputs.json',{'root':str(c.root),'files':c.inputs,'analysis_sources':{str(p.relative_to(HERE.parent.parent.parent)):digest(p.read_bytes()) for p in [Path(__file__),HERE/'diagnose.mjs',HERE.parent.parent.parent/'packages/coding-agent-runtime/patch-schema.mjs',HERE.parent.parent.parent/'packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json']},'open_questions_ref':'REPORT.md#open-questions'})]:
        (output/name).write_text(json.dumps(value,indent=2)+'\n')
    for name,values in [('trials.jsonl',rows),('calls.jsonl',calls)]: (output/name).write_text(''.join(json.dumps(x,sort_keys=True)+'\n' for x in values))
    (output/'REPORT.md').write_text(markdown(report))
    (output/'FINDINGS.md').write_text('# Interpretation pending\n\nThis generated snapshot contains descriptive associations. Its decision note has not yet been reviewed. See REPORT.md and summary.json for observations; no new runtime intervention is selected automatically.\n\n## Open Questions\n\nWhich failure mechanism is supported by this snapshot, and which controlled experiment would distinguish it from alternatives?\n')
    print(json.dumps({'output':str(output),'inventory':report['inventory'],'completed_qualification':{'n':report['completed_qualification']['n'],'initial':report['completed_qualification']['initial_pass'],'final':report['completed_qualification']['final_pass']},'input_drift':drift}))
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--evidence',type=Path,default=HERE.parent/'evidence');parser.add_argument('--output',type=Path,required=True);parser.add_argument('--node',default='node');args=parser.parse_args();run(args.evidence,args.output,args.node)
