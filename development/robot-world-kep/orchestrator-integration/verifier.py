"""Independent transition oracle plus scripted-policy comparison. Questions: PLAN.md."""
import copy
import math
import json

from worker import HERE, canonical, digest, check_binding, simulate, validate, World
import jsonschema


def require(condition, code):
    if not condition:
        raise ValueError(code)


def verify(bundle, expected):
    check_binding(expected)
    require(set(bundle) == {'binding', 'initial', 'profile', 'events', 'frames', 'traces',
                            'final_state', 'completed_ticks', 'stop_reason', 'constructed'}, 'BUNDLE_SHAPE')
    require(bundle['binding'] == expected, 'VERIFY_BINDING')
    require(digest(canonical(bundle['initial'])) == expected['initial_sha256'], 'INITIAL_DIGEST')
    require(digest(canonical(bundle['profile'])) == expected['profile_sha256'], 'PROFILE_DIGEST')
    cfg = bundle['profile']
    state = copy.deepcopy(bundle['initial'])
    require(state == World().state, 'INITIAL_STATE')
    tick_initial = copy.deepcopy(state)
    frames = [copy.deepcopy(state)]
    actors = sorted(state['robots'])
    acted, impulses = [], {k: [0.0] * 4 for k in actors}
    previous = '0' * 64
    idle = 0; actions = []
    require(0 < len(bundle['events']) <= expected['max_ticks'] * (len(actors) + 1), 'EVENT_BUDGET')
    action_schema = json.loads((HERE.parent / 'contracts/bridge.schema.json').read_text())
    for event in bundle['events']:
        require(set(event) == {'revision', 'intent', 'previous_hash', 'before_sha256', 'state', 'event_hash'}, 'EVENT_SHAPE')
        require(event['previous_hash'] == previous and event['before_sha256'] == digest(canonical(state)), 'EVENT_CHAIN')
        require(digest(canonical({k: v for k, v in event.items() if k != 'event_hash'})) == event['event_hash'], 'EVENT_DIGEST')
        intent = event['intent']; next_state = copy.deepcopy(state)
        op = intent['action']
        if op == 'advance-clock':
            require(acted == actors, 'INCOMPLETE_TICK')
            require(intent == {'action': 'advance-clock', 'host': 'interaction-v1',
                               'profile_sha256': expected['profile_sha256']}, 'CLOCK_BINDING')
            for key in actors:
                next_state['robots'][key]['memory'] = [
                    m * math.exp(-rate * cfg['dt']) + impulse
                    for m, rate, impulse in zip(tick_initial['robots'][key]['memory'], cfg['rates'], impulses[key])]
            next_state['tick'] += 1
            idle = idle + 1 if all(a == 'wait' for a in actions) else 0
        else:
            jsonschema.validate(intent, {**action_schema, '$ref': '#/$defs/ActionIntent'})
            require(len(acted) < len(actors), 'EXCESS_ACTION')
            key = actors[len(acted)]
            require(intent['world_id'] == state['world_id'] and intent['agent_id'] == key, 'ACTION_IDENTITY_ORDER')
            require(intent['expected_revision'] == state['revision'], 'ACTION_REVISION')
            require(intent['request_id'] == f"{key}-{state['tick']}", 'ACTION_REQUEST_ID')
            actor = next_state['robots'][key]
            at = lambda p: math.dist(actor['position'], p) < 0.2
            impulse = [0.0] * 4
            if op == 'move':
                require(math.dist(actor['position'], intent['target']) <= 0.800001 and actor['energy'] >= 1, 'ILLEGAL_MOVE')
                actor['position'] = intent['target']; actor['energy'] -= 1
                if actor['energy'] < cfg['reserve']: impulse = cfg['impulses']['low_energy_move']
            elif op == 'gather':
                require(at([-3, 0]) and actor['cargo'] < 3 and state['resource'] >= 1, 'ILLEGAL_GATHER')
                actor['cargo'] += 1; next_state['resource'] -= 1; impulse = cfg['impulses']['gather']
            elif op == 'deposit':
                require(at([3, 0]) and actor['cargo'] >= 1, 'ILLEGAL_DEPOSIT')
                next_state['stock'] += actor['cargo']; actor['cargo'] = 0; impulse = cfg['impulses']['deposit']
            elif op == 'build':
                require(at([3, 0]) and state['stock'] >= 6, 'ILLEGAL_BUILD')
                next_state['stock'] -= 6; next_state['built'] += 1; impulse = cfg['impulses']['build']
            else:
                require(op == 'wait', 'UNKNOWN_ACTION')
            impulses[key] = impulse
            acted.append(key); actions.append(op)
        next_state['revision'] += 1
        require(event['revision'] == next_state['revision'], 'EVENT_REVISION')
        require(canonical(event['state']) == canonical(next_state), 'ILLEGAL_STATE_TRANSITION')
        require(next_state['resource'] + next_state['stock'] + 6 * next_state['built'] +
                sum(a['cargo'] for a in next_state['robots'].values()) == 80, 'RESOURCE_CONSERVATION')
        require(all(a['energy'] >= 0 and 0 <= a['cargo'] <= 3 for a in next_state['robots'].values()), 'AGENT_BOUNDS')
        state = next_state; previous = event['event_hash']
        if op == 'advance-clock':
            frames.append(copy.deepcopy(state)); tick_initial = copy.deepcopy(state)
            acted = []; impulses = {k: [0.0] * 4 for k in actors}; actions = []
            require(idle < cfg['quiescence_window'] or event is bundle['events'][-1], 'QUIESCENCE_OVERRUN')
    require(not acted and state['tick'] == bundle['completed_ticks'], 'PARTIAL_TICK')
    require(canonical(state) == canonical(bundle['final_state']), 'FINAL_STATE')
    require(canonical(frames) == canonical(bundle['frames']), 'FRAME_MISMATCH')
    stop = 'policy-quiescent-window-censored' if idle >= cfg['quiescence_window'] else 'horizon'
    require(bundle['stop_reason'] == stop and (stop != 'horizon' or state['tick'] == expected['max_ticks']), 'STOP_REASON')
    require(bundle['constructed'] == state['built'], 'METRICS')
    # Separate check: policy/trace determinism. Transition legality above never calls
    # the production reducer and therefore detects legal-looking rehashed corruption.
    replay = simulate(expected)
    require(canonical(replay['events']) == canonical(bundle['events']), 'SCRIPTED_POLICY_MISMATCH')
    require(canonical(replay['traces']) == canonical(bundle['traces']), 'TRACE_MISMATCH')
    return {'schema_version': 'robot-world.verification/v1', 'status': 'PASS',
            'binding': expected, 'bundle_sha256': digest(canonical(bundle)),
            'state_sha256': digest(canonical(state)), 'ticks': state['tick'],
            'checks': ['source-binding', 'hash-chain', 'independent-action-clock-replay',
                       'conservation', 'frames', 'scripted-policy-trace'], 'authority_effect': 'none'}
