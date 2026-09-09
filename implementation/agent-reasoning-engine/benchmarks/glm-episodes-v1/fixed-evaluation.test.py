import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('fixed_evaluation', Path(__file__).with_name('fixed-evaluation.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def plan():
    return {'schema_version': 'are.fixed-evaluation/v1', 'completion_policy': 'example-fields-v20',
            'schedule': [{'id': 'long-1', 'episode': 'retention-long-window', 'retention_policy': 'clear-v1', 'soft_limit': 8000, 'repetition': 1}],
            'maximum_model_attempts': 16, 'maximum_tokenizer_attempts': 32, 'open_questions_ref': 'PLAN.md'}


class FixedEvaluationTests(unittest.TestCase):
    def test_plan_limits_and_closed_selection(self):
        self.assertEqual(module.validate_plan(plan()), plan())
        for mutate in [lambda p: p.update(maximum_model_attempts=17),
                       lambda p: p.update(maximum_tokenizer_attempts=64),
                       lambda p: p.update(completion_policy='none'),
                       lambda p: p['schedule'][0].update(soft_limit=True),
                       lambda p: p['schedule'][0].update(episode='arbitrary'),
                       lambda p: p['schedule'].append(copy.deepcopy(p['schedule'][0]))]:
            value = plan()
            mutate(value)
            with self.assertRaises(ValueError):
                module.validate_plan(value)

    def test_model_deadline_is_explicit_and_bounded(self):
        value = {**plan(), 'model_timeout_ms': 60000}
        self.assertEqual(module.validate_plan(value), value)
        for timeout in [29999, 60001, True, '60000', None]:
            with self.assertRaises(ValueError):
                module.validate_plan({**plan(), 'model_timeout_ms': timeout})

    def test_retry_reserve_is_explicit_and_does_not_expand_tokenizer_budget(self):
        value = {**plan(), 'maximum_model_retries': 2, 'maximum_model_attempts': 18}
        self.assertEqual(module.validate_plan(value), value)
        for change in [{'maximum_model_attempts': 16}, {'maximum_model_retries': 3}, {'maximum_model_retries': True}, {'maximum_tokenizer_attempts': 36}]:
            with self.assertRaises(ValueError):
                module.validate_plan({**value, **change})

    def test_correction_retry_reserve_is_separate_and_bounded(self):
        value = {**plan(), 'maximum_correction_model_retries': 1}
        self.assertEqual(module.validate_plan(value), value)
        for retry in [2, True, None, '1']:
            with self.assertRaises(ValueError):
                module.validate_plan({**plan(), 'maximum_correction_model_retries': retry})

    def test_failure_and_missing_recycling_cannot_be_scored_as_pass(self):
        row = {**plan()['schedule'][0], 'repair': True, 'gate': True, 'recycles': 1, 'continuity': True,
               'minimum_headroom': 259, 'model_attempts': 16, 'tokenizer_attempts': 21}
        self.assertTrue(module.summarize(plan(), [row])['target_met'])
        for changes in [{'repair': False}, {'gate': False}, {'continuity': False}, {'recycles': 0}, {'minimum_headroom': 0}]:
            self.assertFalse(module.summarize(plan(), [{**row, **changes}])['target_met'])
        failed = module.summarize(plan(), [{**row, 'repair': False}])
        self.assertEqual(failed['completed'], 1)
        self.assertEqual(failed['model_attempts'], 16)
        stopped = module.summarize(plan(), [row], 'source-drift')
        self.assertFalse(stopped['target_met'])
        self.assertIsNone(stopped['model_attempts'])
        self.assertEqual(stopped['known_completed_model_attempts'], 16)

    def test_source_drift_is_detected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source'
            path.write_text('before')
            sources = [{'path': str(path), 'sha256': module.digest(path)}]
            module.check_sources(sources)
            path.write_text('after')
            with self.assertRaisesRegex(ValueError, 'frozen-source-drift'):
                module.check_sources(sources)

    def test_failed_trial_export_retains_failure_and_omits_raw_messages(self):
        with tempfile.TemporaryDirectory() as directory:
            raw, dest = Path(directory) / 'raw', Path(directory) / 'export'
            raw.mkdir()
            dest.mkdir()
            arm = raw / 'arm-0'
            arm.mkdir()
            def write(path, value):
                path.write_text(json.dumps(value))
            write(raw / 'manifest.json', {'completion_policy': 'example-fields-v20', 'arms': [{'task': {'id': 'fixed'}}]})
            write(raw / 'result.json', {'arms': [{'directory': str(arm)}]})
            write(arm / 'agent-result.json', {'status': 'BLOCK', 'reason_codes': ['glm.request-failed'],
                  'history': [{'messages': [{'reasoning_content': 'PRIVATE_PROTOCOL_TEXT'}], 'calls': [], 'observations': []}],
                  'private_field': 'PRIVATE_PROTOCOL_TEXT'})
            write(arm / 'completed.json', {'recycles': 1, 'dispatch_headroom': [{'soft_headroom_tokens': 300}]})
            checked = {'context_policy': {'recycle_at': 8000}, 'arms': [{'episode_id': 'retention-long-window',
                       'retention_policy': 'clear-v1', 'verified_repair': False, 'continuity': {'passed': False},
                       'reasons': ['glm.request-failed']}], 'totals': {'model_attempts': 1, 'tokenizer_attempts': 1}}
            row, task = module.export_trial(raw, dest, plan()['schedule'][0], checked)
            self.assertFalse(row['repair'])
            self.assertEqual(row['reasons'], ['glm.request-failed'])
            self.assertNotIn('PRIVATE_PROTOCOL_TEXT', (dest / 'visible-trace.json').read_text())
            self.assertEqual(task, {'id': 'fixed'})

    def test_exclusive_records_and_atomic_progress(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'record.json'
            module.save(path, {'before': True})
            with self.assertRaises(FileExistsError):
                module.save(path, {'overwritten': True})
            module.save(path, {'after': True}, replace=True)
            self.assertEqual(json.loads(path.read_text()), {'after': True})
            self.assertFalse(path.with_name('record.json.pending').exists())


if __name__ == '__main__':
    unittest.main()
