"""Three predeclared small-window rounds. Open questions: SMALL-WINDOW-QUALIFICATION.md."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('fixed_evaluation', HERE / 'fixed-evaluation.py')
fixed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixed)


def round_summary(initial, feedback, plan=None):
    fixed.require(initial['status'] == feedback['status'] == 'COMPLETED', 'round-incomplete')
    rows, results, oracle = initial['trials'], feedback['results'], feedback['oracle']
    correction_retries = (plan or {}).get('maximum_correction_model_retries', 0)
    fixed.require(len(rows) == len(results) == len(oracle) == 12, 'round-size-invalid')
    ids = {r['id'] for r in rows}
    fixed.require(len(ids) == 12 and {r['id'] for r in results} == {r['id'] for r in oracle} == ids, 'round-identity-invalid')
    passed = {r['id'] for r in oracle if r['result'] and r['result']['ok']}
    validations = [r['result'][k] for r in results for k in ('before', 'after') if r['result'].get(k)]
    verified = [r['id'] for r in results if r['result']['status'] in ('UNCHANGED', 'REPAIRED') and r['id'] in passed and (r['result'].get('after') or r['result'].get('before') or {}).get('ok') is True]
    fixed.require(len(verified) == feedback['final_verified'], 'final-score-mismatch')
    fixed.require(all(r['result'].get('correction_dispatches', 0) <= 1 for r in results), 'correction-budget-invalid')
    fixed.require(initial['model_attempts'] <= (plan['maximum_model_attempts'] if plan else 160) and initial['tokenizer_attempts'] <= 320 and feedback['model_attempts'] <= 12 * (1 + correction_retries) and feedback['tokenizer_attempts'] <= 24 and len(validations) <= 24, 'round-budget-invalid')
    receipts = [x for r in results for x in (r.get('transport') or {}).get('receipts', [])]
    fixed.require(sum(r['kind'] == 'model' for r in receipts) == feedback['model_attempts'] and sum(r['kind'] == 'tokenizer' for r in receipts) == feedback['tokenizer_attempts'], 'feedback-accounting-invalid')
    for row in results:
        calls = [r for r in (row.get('transport') or {}).get('receipts', []) if r['kind'] == 'model']
        logical = row['result'].get('correction_dispatches', 0)
        fixed.require(len(calls) <= logical * (1 + correction_retries), 'correction-physical-budget')
        reported = row['result'].get('model_attempts')
        fixed.require(reported is None or reported == len(calls), 'correction-physical-accounting')
        if correction_retries and calls:
            fixed.require(all(r.get('model_request_sequence') == 1 and r.get('attempt_index') == i and r.get('automatic_retries') == i for i, r in enumerate(calls)), 'correction-retry-sequence')
            if len(calls) == 2:
                first, second = calls
                fixed.require(first.get('retryable') is True and first.get('dispatched') is True and first['request_sha256'] == second['request_sha256'], 'correction-retry-binding')
                transient = first.get('failure_code') in ['deadline-exceeded', 'request-failed', 'response-interrupted'] or (first.get('status') in [500, 502, 503, 504] and first.get('provider_code') in [None, '500'])
                fixed.require(transient and not first.get('secret_resolution_failure'), 'correction-retry-category')
    recycled = [r for r in rows if r['recycles'] > 0]
    context_ok = all(r['gate'] and r['minimum_headroom'] is not None and r['minimum_headroom'] > 0 for r in rows) and all(r['continuity'] for r in recycled) and all(r['recycles'] > 0 for r in rows if r['episode'] == 'retention-long-window' and r['soft_limit'] == 8000)
    cleanup_ok = all(v.get('worker_cleanup_verified') is True for v in validations)
    execution_ok = all(all(x['passed'] or x['reason'] == 'output-mismatch' for x in v['results']) for v in validations)
    return {'first_pass': sum(r['repair'] for r in rows), 'final_verified': len(verified), 'total': 12,
            'recycled_trials': len(recycled), 'continuity_passes': sum(r['continuity'] for r in recycled),
            'context_ok': context_ok, 'cleanup_ok': cleanup_ok, 'validation_execution_ok': execution_ok,
            'validation_workers': len(validations), 'model_attempts': initial['model_attempts'] + feedback['model_attempts'],
            'tokenizer_attempts': initial['tokenizer_attempts'] + feedback['tokenizer_attempts'],
            'corrective_model_attempts': feedback['model_attempts'], 'corrective_tokenizer_attempts': feedback['tokenizer_attempts'],
            'target_met': len(verified) == 12 and context_ok and cleanup_ok and execution_ok,
            'failed_final_ids': sorted(ids - set(verified))}


def run(args):
    plan = fixed.validate_plan(json.loads(args.plan.read_text()))
    fixed.require(len(plan['schedule']) == 12, 'qualification-matrix-required')
    expected = {(e, w) for e in ('archive-slice-bounds', 'exact-json-scoring', 'retention-tool-pairs', 'retention-long-window') for w in (8000, 10000, 12000)}
    fixed.require({(r['episode'], r['soft_limit']) for r in plan['schedule']} == expected, 'qualification-conditions-invalid')
    fixed.require(not args.output.exists() and not args.raw.exists(), 'exclusive-output-required')
    args.output.mkdir(mode=0o700); args.raw.mkdir(mode=0o700)
    snapshot = subprocess.run([args.node, '--input-type=module', '-e', "import {episodeSources} from './runner.mjs'; console.log(JSON.stringify(episodeSources()))"], cwd=HERE, capture_output=True, text=True, check=True, timeout=30)
    extra = [Path(__file__), args.plan, HERE / 'fixed-evaluation.py', HERE / 'report.mjs', HERE / 'public-feedback-run.mjs', HERE / 'feedback-schedule.mjs', HERE / 'public-checks.mjs']
    sources = json.loads(snapshot.stdout) + [{'path': str(p.resolve()), 'sha256': fixed.digest(p)} for p in extra]
    fixed.save(args.output / 'manifest.json', {'rounds': 3, 'trials': 36, 'schedule': plan, 'sources': sources, 'maximum_model_attempts': 3 * (plan['maximum_model_attempts'] + 12 * (1 + plan.get('maximum_correction_model_retries', 0))), 'maximum_tokenizer_attempts': 1032, 'maximum_workers': 72, 'maximum_model_retries': plan.get('maximum_model_retries', 0), 'maximum_correction_model_retries': plan.get('maximum_correction_model_retries', 0), 'authority_effect': 'none', 'open_questions_ref': '../README.md#open-questions'})
    summaries, reason = [], None
    started = time.monotonic()
    for number in range(1, 4):
        directory = args.output / f'round-{number}'; directory.mkdir()
        raw = args.raw / f'round-{number}'; raw.mkdir(mode=0o700)
        try:
            fixed.check_sources(sources)
            fixed.require(time.monotonic() - started < 36000, 'qualification-time-limit')
            fixed.save(directory / 'started.json', {'round': number, 'authority_effect': 'none'})
            print(json.dumps({'round': number, 'phase': 'initial-started'}), flush=True)
            command = [sys.executable, str(HERE / 'fixed-evaluation.py'), '--plan', str(args.plan), '--node', args.node, '--credential', str(args.credential), '--raw', str(raw / 'initial'), '--output', str(directory / 'initial')]
            with (directory / 'initial.log').open('x') as log:
                subprocess.run(command, cwd=HERE, stdout=log, stderr=subprocess.STDOUT, check=True, timeout=8100)
            fixed.check_sources(sources)
            initial = json.loads((directory / 'initial/result.json').read_text())
            fixed.require(initial['status'] == 'COMPLETED', 'initial-incomplete')
            print(json.dumps({'round': number, 'phase': 'feedback-started', 'first_pass': initial['repairs']}), flush=True)
            command = [args.node, str(HERE / 'public-feedback-run.mjs'), str(args.credential), str(directory / 'initial'), str(directory / 'feedback'), str(raw / 'feedback'), '--shared-matrix']
            with (directory / 'feedback.log').open('x') as log:
                subprocess.run(command, cwd=HERE, stdout=log, stderr=subprocess.STDOUT, check=True, timeout=4800)
            fixed.check_sources(sources)
            summary = {'round': number, **round_summary(initial, json.loads((directory / 'feedback/result.json').read_text()), plan)}
            summaries.append(summary); fixed.save(directory / 'summary.json', summary)
            fixed.save(args.output / 'progress.json', {'completed_rounds': len(summaries), 'rounds': summaries}, replace=True)
            print(json.dumps({'phase': 'round-finished', **summary}), flush=True)
        except Exception as error:
            reason = str(error) if isinstance(error, ValueError) else type(error).__name__
            print(json.dumps({'round': number, 'phase': 'stopped', 'reason': reason}), flush=True)
            break
    result = {'status': 'COMPLETED' if len(summaries) == 3 and reason is None else 'STOPPED', 'rounds': summaries, 'reason': reason,
              'target_met': len(summaries) == 3 and reason is None and all(r['target_met'] for r in summaries),
              'first_pass': sum(r['first_pass'] for r in summaries), 'final_verified': sum(r['final_verified'] for r in summaries),
              'completed_trials': len(summaries) * 12, 'planned_trials': 36,
              'model_attempts': sum(r['model_attempts'] for r in summaries) if reason is None else None,
              'tokenizer_attempts': sum(r['tokenizer_attempts'] for r in summaries) if reason is None else None,
              'elapsed_ms': round((time.monotonic() - started) * 1000), 'authority_effect': 'none', 'open_questions_ref': '../README.md#open-questions'}
    fixed.save(args.output / 'result.json', result)
    print(json.dumps({k: v for k, v in result.items() if k != 'rounds'}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('plan', 'credential', 'raw', 'output'):
        parser.add_argument('--' + name, required=True, type=lambda x: Path(x).resolve())
    parser.add_argument('--node', required=True)
    run(parser.parse_args())
