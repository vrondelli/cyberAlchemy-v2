#!/usr/bin/env python3
"""Validate the planning DAG; never execute nodes or authorize effects."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]

def validate(plan, sources, check_sources=True):
    errors = []
    def require(test, message):
        if not test:
            errors.append(message)
    nodes = plan['nodes']
    by_id = {n['id']: n for n in nodes}
    require(len(by_id) == len(nodes), 'duplicate node id')
    require(plan['authority_effect'] == 'none', 'plan must grant no authority')
    source_ids = {s['source_id'] for s in sources['sources']}
    allowed = {(e['from'], e['to']) for e in plan['operational_to_product_exceptions']}
    observed = set()
    for n in nodes:
        name = n['id']
        require(n['lane'] in ('product_construction', 'operational_support'), f'{name}: invalid lane')
        require(n['state'] == 'planned' and n['execution_evidence'] is None, f'{name}: planning snapshot claims execution')
        require(n['authority_effect'] == 'none', f'{name}: grants authority')
        for field in ('owner_role','stage','work','deliverables','done_criteria','validation','scope_ceiling','evidence_contract'):
            require(bool(n.get(field)), f'{name}: missing {field}')
        require(set(n['source_refs']) <= source_ids, f'{name}: unknown source')
        deps = [e['node'] for e in n['depends_on']]
        require(len(deps) == len(set(deps)), f'{name}: repeated dependency')
        for edge in n['depends_on']:
            dep = edge['node']
            require(bool(edge['reason']), f'{name}: missing dependency reason')
            require(dep in by_id, f'{name}: unknown dependency {dep}')
            if dep in by_id and by_id[dep]['lane'] == 'operational_support' and n['lane'] == 'product_construction':
                observed.add((dep,name))
                require((dep,name) in allowed, f'{name}: undeclared operational blocker {dep}')
        if n['lane'] == 'operational_support':
            require(bool(n.get('affected_product_stage')) and bool(n.get('blocking_basis')), f'{name}: missing operational boundary')
    require(observed == allowed, 'operational exception list differs from graph')
    remaining = set(by_id)
    layers = []
    ancestors = {}
    while remaining:
        ready = sorted(i for i in remaining if all(e['node'] in ancestors for e in by_id[i]['depends_on']))
        if not ready:
            errors.append('cycle or unresolved dependency: ' + ', '.join(sorted(remaining)))
            break
        layers.append(ready)
        for i in ready:
            ancestors[i] = set()
            for e in by_id[i]['depends_on']:
                ancestors[i] |= {e['node']} | ancestors[e['node']]
        remaining -= set(ready)
    if not remaining:
        require(set(layers[0]) == set(plan['scheduling']['initial_product_frontier']), 'initial frontier differs')
        for n in nodes:
            upstream = [by_id[i] for i in ancestors[n['id']]]
            if n['human_gate'] == 'product_approval':
                require(n['lane'] == 'product_construction', f"{n['id']}: misplaced product gate")
                require(any(a['stage'] == 'product-test' for a in upstream), f"{n['id']}: approval without predecessor tests")
            if n['human_gate'] == 'operational_authorization':
                require(any(a['human_gate'] == 'product_approval' for a in upstream), f"{n['id']}: authority before product approval")
            if n['kind'] == 'effect':
                require(n['lane'] == 'operational_support' and any(a['human_gate'] == 'operational_authorization' for a in upstream), f"{n['id']}: effect without authority predecessor")
        covered = set()
        for m in plan['milestones']:
            for terminal in m['terminal_nodes']:
                require(terminal in by_id, f"{m['id']}: unknown terminal")
                if terminal in by_id:
                    require(by_id[terminal]['lane'] == m['lane'], f"{m['id']}: lane mismatch")
                    covered |= {terminal} | ancestors[terminal]
        uncovered = set(by_id) - covered
        require(uncovered == set(plan['operational_residue_terminals']), 'untracked terminal residue')
        require(all(by_id[i]['lane'] == 'operational_support' for i in uncovered), 'product work lacks milestone')
    if check_sources:
        for s in sources['sources']:
            path = (ROOT / s['path']).resolve()
            require(path.is_relative_to(ROOT), f"{s['source_id']}: source outside repository")
            if not path.is_relative_to(ROOT):
                continue
            require(path.is_file(), f"{s['source_id']}: missing source")
            if path.is_file():
                require(hashlib.sha256(path.read_bytes()).hexdigest() == s['sha256'], f"{s['source_id']}: source drift; reconcile affected nodes, do not refresh approval")
    return errors, layers

def self_test(plan, sources):
    cases = []
    def case(label, mutate, expected):
        broken = copy.deepcopy(plan)
        mutate(broken)
        errors, _ = validate(broken, sources, False)
        assert any(expected in e for e in errors), (label, errors)
        cases.append(label)
    case('missing dependency', lambda p: p['nodes'][0]['depends_on'].append({'node':'MISSING','reason':'test'}), 'unknown dependency')
    case('cycle', lambda p: p['nodes'][0]['depends_on'].append({'node':'P02','reason':'test'}), 'cycle')
    case('operational blocking creep', lambda p: p['nodes'][0]['depends_on'].append({'node':'O07','reason':'test'}), 'undeclared operational blocker')
    case('fabricated completion', lambda p: p['nodes'][0].update(state='complete'), 'claims execution')
    case('unknown milestone', lambda p: p['milestones'][0].update(terminal_nodes=['MISSING']), 'unknown terminal')
    case('approval without tests', lambda p: p['nodes'][0].update(human_gate='product_approval'), 'approval without predecessor tests')
    return cases

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    plan = json.loads((HERE / 'plan.json').read_text())
    sources = json.loads((HERE / 'sources.json').read_text())
    errors, layers = validate(plan, sources)
    tests = self_test(plan, sources) if args.self_test else []
    print(json.dumps({'result':'BLOCK' if errors else 'PASS','claim':'Planning structure and source snapshot only; no product tests executed', 'nodes':len(plan['nodes']),'edges':sum(len(n['depends_on']) for n in plan['nodes']),'milestones':len(plan['milestones']),'dependency_layers':layers,'negative_self_tests':tests,'errors':errors}, indent=2))
    raise SystemExit(bool(errors))
