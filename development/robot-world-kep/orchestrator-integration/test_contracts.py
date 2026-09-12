"""World contract boundary tests. Questions: PLAN.md."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from worker import binding, simulate, execute, canonical, digest, validate
from verifier import verify


def rehash(bundle):
    previous = '0' * 64
    state = bundle['initial']
    for event in bundle['events']:
        event['previous_hash'] = previous
        event['before_sha256'] = digest(canonical(state))
        event['event_hash'] = digest(canonical({k: v for k, v in event.items() if k != 'event_hash'}))
        previous, state = event['event_hash'], event['state']


class Contracts(unittest.TestCase):
    def setUp(self):
        self.binding = binding(5)

    def test_closed_binding_bounds_and_source_identity(self):
        for mutation in [{'max_ticks': True}, {'max_ticks': 0}, {'max_ticks': 101},
                         {'caller': 'alice'}, {'engine_sha256': '0' * 64},
                         {'profile_sha256': '0' * 64}, {'world_id': 'other'}]:
            with self.subTest(mutation=mutation), self.assertRaises(Exception):
                simulate({**self.binding, **mutation})

    def test_full_horizon_and_independent_replay(self):
        value = binding(100)
        bundle = simulate(value)
        report = verify(bundle, value)
        self.assertEqual(report['status'], 'PASS')
        self.assertGreater(bundle['constructed'], 0)
        self.assertEqual(bundle, simulate(value))

    def test_rehashed_illegal_action_fails_before_policy_comparison(self):
        bundle = simulate(self.binding)
        bundle['events'][0]['intent']['action'] = 'build'
        bundle['events'][0]['intent'].pop('target', None)
        rehash(bundle)
        with patch('verifier.simulate', side_effect=AssertionError('must not reach policy')):
            with self.assertRaisesRegex(ValueError, 'ILLEGAL_BUILD'):
                verify(bundle, self.binding)

    def test_rehashed_state_and_clock_corruption_rejected(self):
        for index, mutate in [(0, lambda s: s.update(stock=1)),
                              (2, lambda s: s['robots']['builder']['memory'].__setitem__(1, 3))]:
            bundle = simulate(self.binding)
            mutate(bundle['events'][index]['state']); rehash(bundle)
            with self.assertRaisesRegex(ValueError, 'ILLEGAL_STATE_TRANSITION'):
                verify(bundle, self.binding)

    def test_frames_trace_metrics_and_early_stop_are_checked(self):
        for field in ['frames', 'traces', 'constructed', 'stop_reason']:
            bundle = simulate(self.binding)
            if field in ('frames', 'traces'): bundle[field].pop()
            elif field == 'constructed': bundle[field] = 99
            else: bundle[field] = 'policy-quiescent-window-censored'
            with self.subTest(field=field), self.assertRaises(ValueError):
                verify(bundle, self.binding)

    def test_cancel_between_ticks_produces_no_partial_tick(self):
        calls = 0
        def cancelled():
            nonlocal calls
            calls += 1
            return calls >= 3
        bundle = simulate(self.binding, cancelled)
        self.assertEqual(bundle['completed_ticks'], 2)
        self.assertEqual(bundle['stop_reason'], 'cancelled')
        self.assertEqual(len(bundle['events']), 6)
        with self.assertRaises(ValueError): verify(bundle, self.binding)

    def request(self, root, contract='robot-world.run/v1', predecessor=None):
        value = {'schema_version': 'robot-world.worker-request/v1', 'contract': contract,
                 'command_id': 'world-command', 'fencing_token': 1,
                 'input': self.binding, 'predecessor': predecessor}
        p = root / 'input.json'; p.write_bytes(canonical(value))
        return p, root / 'output.json', root / 'cancel'

    def test_duplicate_completed_command_is_cached_without_simulation(self):
        with tempfile.TemporaryDirectory() as d:
            args = self.request(Path(d)); first = execute(*args)
            before = args[1].read_bytes()
            with patch('worker.simulate', side_effect=AssertionError('redispatch')):
                self.assertEqual(canonical(execute(*args)), canonical(first))
            self.assertEqual(args[1].read_bytes(), before)

    def test_changed_command_and_corrupt_cached_output_reject(self):
        with tempfile.TemporaryDirectory() as d:
            args = self.request(Path(d)); execute(*args)
            original = args[0].read_bytes(); q = json.loads(original); q['fencing_token'] = 2
            args[0].write_bytes(canonical(q))
            with self.assertRaisesRegex(ValueError, 'COMMAND_ID_CONFLICT'): execute(*args)
            args[0].write_bytes(original); q = json.loads(args[1].read_bytes());q['result']['constructed'] = 99
            args[1].write_bytes(canonical(q))
            with self.assertRaisesRegex(ValueError, 'CACHED_OUTPUT_MISMATCH'): execute(*args)

    def test_partial_attempt_never_reexecutes(self):
        with tempfile.TemporaryDirectory() as d:
            args = self.request(Path(d))
            with patch('worker.simulate', side_effect=RuntimeError('partial tick')):
                with self.assertRaises(RuntimeError): execute(*args)
            with patch('worker.simulate', side_effect=AssertionError('redispatch')):
                with self.assertRaisesRegex(ValueError, 'RECONCILIATION'): execute(*args)
            self.assertFalse(args[1].exists())

    def test_exact_predecessor_bytes_and_cancelled_predecessor(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/'run').mkdir();(root/'verify').mkdir()
            args = self.request(root/'run'); result = execute(*args)
            raw = args[1].read_bytes()
            pred = {'utf8_json': raw.decode(), 'sha256': digest(raw)}
            v = self.request(root/'verify', 'robot-world.verify/v1', pred)
            self.assertEqual(execute(*v)['result']['source_output_sha256'], digest(raw))
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/'run').mkdir();(root/'verify').mkdir()
            args=self.request(root/'run');args[2].touch();execute(*args)
            raw=args[1].read_bytes()
            v=self.request(root/'verify','robot-world.verify/v1',{'utf8_json':raw.decode(),'sha256':digest(raw)})
            with self.assertRaisesRegex(ValueError,'VERIFY_PREDECESSOR_INVALID'):execute(*v)

    def test_duplicate_json_keys_and_symlink_artifacts_reject(self):
        with tempfile.TemporaryDirectory() as d:
            args=self.request(Path(d));args[0].write_text('{"x":1,"x":2}')
            with self.assertRaisesRegex(ValueError,'DUPLICATE_JSON_KEY'):execute(*args)
            args=self.request(Path(d));args[1].symlink_to(args[0])
            with self.assertRaisesRegex(ValueError,'SYMLINK'):execute(*args)


if __name__ == '__main__': unittest.main()
