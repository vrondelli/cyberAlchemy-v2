"""Fixed, non-retrying v20 evaluation. See FIXED-EVALUATION.md for open questions."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
EPISODES = {'retention-long-window', 'retention-tool-pairs', 'archive-slice-bounds', 'exact-json-scoring'}


def require(condition, code):
    if not condition:
        raise ValueError(code)


def validate_plan(plan):
    require(isinstance(plan, dict) and set(plan) - {'model_timeout_ms', 'maximum_model_retries', 'maximum_correction_model_retries'} == {'schema_version', 'completion_policy', 'schedule', 'maximum_model_attempts', 'maximum_tokenizer_attempts', 'open_questions_ref'}, 'plan-fields')
    require(plan['schema_version'] == 'are.fixed-evaluation/v1' and plan['completion_policy'] == 'example-fields-v20', 'plan-version-or-policy')
    if 'model_timeout_ms' in plan:
        require(type(plan['model_timeout_ms']) is int and 30000 <= plan['model_timeout_ms'] <= 60000, 'plan-model-timeout')
    correction_retries = plan.get('maximum_correction_model_retries', 0)
    require(type(correction_retries) is int and 0 <= correction_retries <= 1, 'plan-correction-retries')
    retries = plan.get('maximum_model_retries', 0)
    require(type(retries) is int and 0 <= retries <= 2, 'plan-model-retries')
    rows = plan['schedule']
    require(isinstance(rows, list) and 1 <= len(rows) <= 16, 'plan-schedule')
    identifiers = set()
    for row in rows:
        require(isinstance(row, dict) and set(row) == {'id', 'episode', 'retention_policy', 'soft_limit', 'repetition'}, 'plan-row-fields')
        require(isinstance(row['id'], str) and re.fullmatch(r'[a-z0-9-]{1,80}', row['id']) and row['id'] not in identifiers, 'plan-row-id')
        identifiers.add(row['id'])
        require(row['episode'] in EPISODES and row['retention_policy'] in ['clear-v1', 'recent-observations-v2'], 'plan-row-selection')
        require(type(row['soft_limit']) is int and row['soft_limit'] in [8000, 10000, 12000], 'plan-window')
        require(type(row['repetition']) is int and 1 <= row['repetition'] <= 16, 'plan-repetition')
    budget = sum(16 if row['soft_limit'] == 8000 else 12 for row in rows)
    require(type(plan['maximum_model_attempts']) is int and plan['maximum_model_attempts'] == budget + len(rows) * retries, 'plan-model-budget')
    require(type(plan['maximum_tokenizer_attempts']) is int and plan['maximum_tokenizer_attempts'] == budget * 2, 'plan-tokenizer-budget')
    require(isinstance(plan['open_questions_ref'], str) and bool(plan['open_questions_ref']), 'plan-questions')
    return plan


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def check_sources(sources):
    for source in sources:
        require(digest(source['path']) == source['sha256'], 'frozen-source-drift')


def save(path, value, replace=False):
    path = Path(path)
    destination = path.with_name(path.name + '.pending') if replace else path
    with destination.open('x', encoding='utf8') as stream:
        os.chmod(destination, 0o600)
        stream.write(json.dumps(value, indent=2) + '\n')
        stream.flush()
        os.fsync(stream.fileno())
    if replace:
        os.replace(destination, path)


def summarize(plan, rows, reason=None):
    recycled = [r for r in rows if r['recycles'] > 0]
    complete = len(rows) == len(plan['schedule']) and reason is None
    return {'authority_effect': 'none', 'status': 'COMPLETED' if complete else 'STOPPED',
            'planned': len(plan['schedule']), 'completed': len(rows), 'reason': reason,
            'repairs': sum(r['repair'] for r in rows), 'gate_passes': sum(r['gate'] for r in rows),
            'recycled_trials': len(recycled), 'continuity_passes': sum(r['continuity'] for r in rows),
            'model_attempts': sum(r['model_attempts'] for r in rows) if reason is None else None,
            'tokenizer_attempts': sum(r['tokenizer_attempts'] for r in rows) if reason is None else None,
            'known_completed_model_attempts': sum(r['model_attempts'] for r in rows),
            'known_completed_tokenizer_attempts': sum(r['tokenizer_attempts'] for r in rows),
            'target_met': complete and all(r['repair'] and r['gate'] and r['minimum_headroom'] is not None and r['minimum_headroom'] > 0 for r in rows)
                          and all(r['continuity'] for r in recycled)
                          and all(r['recycles'] > 0 for r in rows if r['episode'] == 'retention-long-window' and r['soft_limit'] == 8000),
            'trials': rows, 'open_questions_ref': 'README.md#open-questions'}


def export_trial(raw, destination, item, checked):
    manifest = json.loads((raw / 'manifest.json').read_text())
    result = json.loads((raw / 'result.json').read_text())
    require(len(manifest['arms']) == len(result['arms']) == len(checked['arms']) == 1, 'single-arm-required')
    require(manifest['completion_policy'] == 'example-fields-v20' and checked['context_policy']['recycle_at'] == item['soft_limit'], 'trial-policy-window')
    require(checked['arms'][0]['episode_id'] == item['episode'] and checked['arms'][0]['retention_policy'] == item['retention_policy'], 'trial-selection')
    arm = result['arms'][0]
    armraw = Path(arm['directory']).resolve()
    require(armraw == (raw / 'arm-0').resolve(), 'trial-directory')
    agentpath = armraw / 'agent-result.json'
    agent = json.loads(agentpath.read_text())
    completed = json.loads((armraw / 'completed.json').read_text())
    for filename in ['manifest.json', 'result.json']:
        shutil.copyfile(raw / filename, destination / filename)
    save(destination / 'checked-report.json', checked)
    shutil.copyfile(armraw / 'completed.json', destination / 'completed.json')
    # Explicit whitelist: never export raw messages or provider reasoning.
    visible = {k: agent.get(k) for k in ['status', 'reason_codes', 'retention_policy', 'delivery_policy', 'completion_policy', 'source_policy', 'last_confirmed_source_pins', 'delivery_progress', 'completion_requirements', 'completion_gate', 'paging_budget', 'admission_policy', 'candidate_validation', 'final_response_evidence', 'last_model_response_evidence', 'receipts', 'recycling']}
    visible['history'] = [{k: h[k] for k in ['calls', 'observations', 'receipt', 'elapsed_ms', 'delivered_call_ids', 'source_pin_refs'] if k in h} for h in agent['history']]
    visible.update(original_agent_result_file_sha256=digest(agentpath), authority_effect='none', open_questions_ref='../README.md#open-questions')
    save(destination / 'visible-trace.json', visible)
    if agent.get('candidate'):
        save(destination / 'candidate.json', agent['candidate'])
    report_arm = checked['arms'][0]
    heads = [h['soft_headroom_tokens'] for h in completed.get('dispatch_headroom', [])]
    verification = completed.get('verification') or {}
    row = {**item, 'repair': report_arm['verified_repair'], 'gate': (agent.get('completion_gate') or {}).get('passed', False),
           'continuity': report_arm['continuity']['passed'], 'recycles': completed['recycles'],
           'minimum_headroom': min(heads) if heads else None,
           'reasons': report_arm.get('reasons') or verification.get('reason_codes', []),
           'failed_oracle_checks': [r['id'] for r in verification.get('verification', {}).get('results', []) if not r['passed']],
           'model_attempts': checked['totals']['model_attempts'], 'tokenizer_attempts': checked['totals']['tokenizer_attempts']}
    return row, manifest['arms'][0]['task']


def evaluate(args):
    plan = validate_plan(json.loads(args.plan.read_text()))
    # No credentials or model calls are used to validate the plan and snapshot sources.
    snapshot = subprocess.run([args.node, '--input-type=module', '-e', "import {episodeSources} from './runner.mjs'; console.log(JSON.stringify(episodeSources()))"], cwd=HERE, check=True, capture_output=True, text=True, timeout=30)
    sources = json.loads(snapshot.stdout)
    evaluator_sources = [{'path': str(p.resolve()), 'sha256': digest(p)} for p in [Path(__file__), HERE / 'report.mjs', args.plan]]
    check_sources(sources + evaluator_sources)
    if args.check:
        print(json.dumps({'valid': True, 'trials': len(plan['schedule']), 'model_cap': plan['maximum_model_attempts'], 'tokenizer_cap': plan['maximum_tokenizer_attempts']}))
        return
    require(args.raw is not None and args.output is not None and args.credential is not None, 'execution-paths-required')
    require(not args.raw.exists() and not args.output.exists(), 'exclusive-output-required')
    args.raw.mkdir(mode=0o700)
    args.output.mkdir(mode=0o700)
    manifest = {'plan': plan, 'sources': sources, 'evaluator_sources': evaluator_sources, 'per_arm_timeout_ms': 580000,
                'driver_timeout_seconds': 660, 'batch_start_deadline_seconds': 660 * len(plan['schedule']),
                'maximum_model_retries': plan.get('maximum_model_retries', 0), 'failure_replacement': False, 'authority_effect': 'none', 'open_questions_ref': 'README.md#open-questions'}
    save(args.output / 'manifest.json', manifest)
    rows, tasks, reason = [], {}, None
    started = time.monotonic()
    for index, item in enumerate(plan['schedule']):
        try:
            check_sources(sources + evaluator_sources)
            require(time.monotonic() - started < 660 * len(plan['schedule']), 'batch-time-limit')
            trial = args.raw / f'trial-{index:02d}'
            destination = args.output / f'trial-{index:02d}'
            destination.mkdir()
            save(destination / 'started.json', {**item, 'index': index, 'started_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'authority_effect': 'none'})
            print(json.dumps({'status': 'STARTED', 'index': index, **item}), flush=True)
            command = [args.node, str(HERE / 'runner.mjs'), '--credential', str(args.credential), '--output-directory', str(trial), '--episode', item['episode'], '--retention-policy', item['retention_policy'], '--delivery-policy', 'bounded-reads-v1', '--completion-policy', plan['completion_policy'], '--source-policy', 'inspected-mutation-v1', '--soft-limit', str(item['soft_limit'])]
            if 'model_timeout_ms' in plan:
                command += ['--model-timeout-ms', str(plan['model_timeout_ms'])]
            if plan.get('maximum_model_retries', 0):
                command += ['--maximum-model-retries', str(plan['maximum_model_retries'])]
            with (args.raw / f'trial-{index:02d}.log').open('x') as log:
                proc = subprocess.run(command, cwd=REPO, stdout=log, stderr=subprocess.STDOUT, timeout=660)
            check_sources(sources + evaluator_sources)
            report = subprocess.run([args.node, str(HERE / 'report.mjs'), str(trial)], cwd=REPO, capture_output=True, text=True, timeout=60)
            require(report.returncode == 0, 'trial-report-invalid')
            checked = json.loads(report.stdout)
            require(checked.get('maximum_model_retries', 0) == plan.get('maximum_model_retries', 0), 'trial-model-retries')
            require(checked.get('model_timeout_ms', 30000) == plan.get('model_timeout_ms', 30000), 'trial-model-timeout')
            require(json.loads((trial / 'manifest.json').read_text())['sources'] == sources, 'trial-source-mismatch')
            row, task = export_trial(trial, destination, item, checked)
            check_sources(sources + evaluator_sources)
            require(item['episode'] not in tasks or tasks[item['episode']] == task, 'trial-task-drift')
            tasks[item['episode']] = task
            row.update(index=index, runner_exit_code=proc.returncode)
            rows.append(row)
            require(sum(r['model_attempts'] for r in rows) <= plan['maximum_model_attempts'] and sum(r['tokenizer_attempts'] for r in rows) <= plan['maximum_tokenizer_attempts'], 'batch-call-cap')
            progress = summarize(plan, rows)
            progress['status'] = 'RUNNING'
            save(args.output / 'progress.json', progress, replace=True)
            print(json.dumps({'status': 'FINISHED', **row}), flush=True)
        except Exception as error:
            reason = str(error) if isinstance(error, ValueError) else type(error).__name__
            print(json.dumps({'status': 'STOPPED', 'index': index, 'reason': reason}), flush=True)
            break
    summary = summarize(plan, rows, reason)
    summary['elapsed_ms'] = round((time.monotonic() - started) * 1000)
    save(args.output / 'result.json', summary)
    print(json.dumps({k: v for k, v in summary.items() if k != 'trials'}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--credential', type=Path)
    parser.add_argument('--raw', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for key in ['plan', 'credential', 'raw', 'output']:
        if getattr(args, key) is not None:
            setattr(args, key, getattr(args, key).resolve())
    evaluate(args)


if __name__ == '__main__':
    main()
