import copy
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('qualification', Path(__file__).with_name('small-window-qualification.py'))
q = importlib.util.module_from_spec(spec); spec.loader.exec_module(q)


def pair():
    rows = [{'id': str(i), 'repair': True, 'gate': True, 'minimum_headroom': 256, 'recycles': 1, 'continuity': True, 'episode': 'retention-long-window', 'soft_limit': 8000} for i in range(12)]
    validation = {'ok': True, 'worker_cleanup_verified': True, 'results': [{'passed': True, 'reason': 'matched'}]}
    initial = {'status': 'COMPLETED', 'trials': rows, 'model_attempts': 120, 'tokenizer_attempts': 120}
    feedback = {'status': 'COMPLETED', 'results': [{'id': str(i), 'result': {'status': 'UNCHANGED', 'before': copy.deepcopy(validation), 'correction_dispatches': 0}} for i in range(12)], 'oracle': [{'id': str(i), 'result': {'ok': True}} for i in range(12)], 'final_verified': 12, 'model_attempts': 0, 'tokenizer_attempts': 0}
    return initial, feedback


class QualificationTests(unittest.TestCase):
    def test_complete_round(self):
        result = q.round_summary(*pair()); self.assertTrue(result['target_met']); self.assertEqual(result['final_verified'], 12)

    def test_explicit_retry_reserve_changes_only_physical_model_cap(self):
        i, f = pair(); i['model_attempts'] = 184
        with self.assertRaises(ValueError): q.round_summary(i, f)
        self.assertTrue(q.round_summary(i, f, {'maximum_model_attempts': 184})['target_met'])
        i['model_attempts'] = 185
        with self.assertRaises(ValueError): q.round_summary(i, f, {'maximum_model_attempts': 184})

    def test_one_logical_correction_can_have_two_bound_physical_attempts(self):
        i, f = pair(); r = f['results'][0]
        r['result'].update(status='REPAIRED', correction_dispatches=1, model_attempts=2)
        first = {'kind': 'model', 'model_request_sequence': 1, 'attempt_index': 0, 'automatic_retries': 0, 'request_sha256': 'a'*64, 'retryable': True, 'dispatched': True, 'failure_code': 'deadline-exceeded', 'status': None}
        second = {**first, 'attempt_index': 1, 'automatic_retries': 1, 'status': 200}
        r['transport'] = {'receipts': [first, second]}; f['model_attempts'] = 2
        plan = {'maximum_model_attempts': 160, 'maximum_correction_model_retries': 1}
        self.assertTrue(q.round_summary(i, f, plan)['target_met'])
        with self.assertRaises(ValueError): q.round_summary(i, f)
        for change in ['hash', 'count', 'logical', 'category']:
            broken = copy.deepcopy(f); trial = broken['results'][0]
            if change == 'hash': trial['transport']['receipts'][1]['request_sha256'] = 'b'*64
            if change == 'count': trial['result']['model_attempts'] = 1
            if change == 'logical': trial['result']['correction_dispatches'] = 2
            if change == 'category': trial['transport']['receipts'][0]['failure_code'] = 'authentication-or-permission'
            with self.assertRaises(ValueError): q.round_summary(i, broken, plan)

    def test_failed_repair_is_counted_not_replaced(self):
        i, f = pair(); i['trials'][0]['repair'] = False; f['results'][0]['result']['status'] = 'BLOCK'; f['final_verified'] = 11
        r = q.round_summary(i, f); self.assertFalse(r['target_met']); self.assertEqual(r['first_pass'], 11); self.assertEqual(r['failed_final_ids'], ['0'])

    def test_context_and_cleanup_cannot_be_hidden_by_perfect_score(self):
        for change in ['continuity', 'gate', 'headroom', 'recycling', 'cleanup', 'execution']:
            i, f = pair()
            if change == 'continuity': i['trials'][0]['continuity'] = False
            if change == 'gate': i['trials'][0]['gate'] = False
            if change == 'headroom': i['trials'][0]['minimum_headroom'] = 0
            if change == 'recycling': i['trials'][0]['recycles'] = 0
            if change == 'cleanup': f['results'][0]['result']['before']['worker_cleanup_verified'] = False
            if change == 'execution': f['results'][0]['result']['before']['results'] = [{'passed': False, 'reason': 'child-timeout'}]
            self.assertFalse(q.round_summary(i, f)['target_met'], change)

    def test_incomplete_and_duplicate_rows_reject(self):
        i, f = pair(); i['status'] = 'STOPPED'
        with self.assertRaises(ValueError): q.round_summary(i, f)
        i, f = pair(); f['oracle'][0]['id'] = '1'
        with self.assertRaises(ValueError): q.round_summary(i, f)

    def test_budget_and_aggregate_mismatch_reject(self):
        for change in ['calls', 'dispatches', 'score', 'receipt']:
            i, f = pair()
            if change == 'calls': i['model_attempts'] = 161
            if change == 'dispatches': f['results'][0]['result']['correction_dispatches'] = 2
            if change == 'score': f['final_verified'] = 11
            if change == 'receipt': f['model_attempts'] = 1
            with self.assertRaises(ValueError): q.round_summary(i, f)


if __name__ == '__main__': unittest.main()
