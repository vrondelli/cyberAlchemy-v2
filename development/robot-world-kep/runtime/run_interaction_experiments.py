#!/usr/bin/env python3
"""Reproduce controlled dynamics comparisons. Questions: ../interaction-dynamics/REPORT.md."""
from __future__ import annotations

import argparse
import copy
import json
import math
import platform
from pathlib import Path

from prototype import PACKAGE, World, canonical, digest, save, verify_history
from interaction_world import InteractionWorld, ABLATIONS
from interaction_dynamics import memory_step, semantic, steer, profile


def run_case(initial, variant, ticks):
    if variant=='legacy':
        world=World();world.state=copy.deepcopy(initial);world.frames=[copy.deepcopy(initial)]
    else:
        world=InteractionWorld(initial,variant)
    total=InteractionWorld._resources(initial)
    idle_window=0; rejected=0; failure=None
    stop='horizon'
    for _ in range(ticks):
        start=len(world.events)
        try:
            world.step()
        except (ValueError,RuntimeError) as error:
            rejected+=1;failure=str(error);stop='policy-error';break
        actions=[e['intent']['action'] for e in world.events[start:] if e['intent']['action']!='advance-clock']
        idle_window=idle_window+1 if actions and all(a=='wait' for a in actions) else 0
        if idle_window>=profile()['quiescence_window']:
            stop='policy-quiescent-window-censored';break
    verify_history(world.events,initial)
    for event in world.events:
        assert InteractionWorld._resources(event['state'])==total
        assert all(a['energy']>=0 for a in event['state']['robots'].values())
    action_events=[e for e in world.events if 'agent_id' in e['intent']]
    actions=[e['intent'] for e in action_events]
    trajectory=[{k:v for k,v in x.items() if k not in ('expected_revision','request_id')} for x in actions]
    deposit_units=0;previous=initial
    for e in world.events:
        if e['intent']['action']=='deposit':deposit_units+=previous['robots'][e['intent']['agent_id']]['cargo']
        previous=e['state']
    traces=getattr(world,'traces',[])
    saturation=sum(x>=1 for frame in world.frames for actor in frame['robots'].values()
                   for x in semantic(actor['prior'],[0.0]*4 if variant=='no-memory' else actor['memory'],profile()['gains']))
    denominator=len(world.frames)*len(initial['robots'])*4
    result={'variant':variant,'requested_ticks':ticks,'completed_ticks':world.state['tick'],
            'stop':stop,'failure':failure,'window_censored':stop.startswith('policy-quiescent'),
            'zero_energy_actors':[k for k,a in world.state['robots'].items() if a['energy']==0],
            'constructed':world.state['built']-initial['built'],
            'gathered':sum(x['action']=='gather' for x in actions),'deposited_units':deposit_units,
            'energy_remaining':sum(a['energy'] for a in world.state['robots'].values()),
            'wait_actions':sum(x['action']=='wait' for x in actions),'invalid_policy_intents':rejected,
            'saturation_rate':saturation/denominator,'state_sha256':digest(canonical(world.state)),
            'events_sha256':digest(canonical(world.events)),'trace_sha256':digest(canonical(traces)),
            'actions_sha256':digest(canonical(trajectory))}
    return result,world,trajectory


def mechanisms():
    cfg=profile()['steering'];no_align={**cfg,'alignment':0}
    full=steer([0],[0],[([0],[1])],[1],cfg)
    off=steer([0],[0],[([0],[1])],[1],no_align)
    memory=[0.0]*4;maxima=[0.1,0.5,0.3,0.1];rates=profile()['rates']
    for _ in range(1000):memory=memory_step(memory,rates,1,maxima)
    return {'alignment_velocity_fixture':{'full':full,'no_alignment':off,
             'effect_demonstrated':full['scaled_force']!=off['scaled_force']},
            'sustained_impulse_fixture':{'kind':'pure-mechanics-not-world-actions','ticks':1000,
             'memory':memory,'no_memory':[0.0]*4,'bounds':[i/(1-math.exp(-r)) for i,r in zip(maxima,rates)]}}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    output=args.output.resolve();output.mkdir(parents=True,exist_ok=False)
    fixture=PACKAGE/'interaction-dynamics/fixtures/scenarios.json'
    scenarios=json.loads(fixture.read_text())['scenarios']
    results=[]
    for name,initial in scenarios.items():
        for ticks in (80,1000):
            full,fw,fa=run_case(initial,'full',ticks)
            for variant in ('legacy',*ABLATIONS):
                row,w,actions=(full,fw,fa) if variant=='full' else run_case(initial,variant,ticks)
                repeat,_,_=run_case(initial,variant,ticks)
                if row!=repeat:raise ValueError(f'NONDETERMINISTIC:{name}:{variant}:{ticks}')
                row={**row,'scenario':name,'repeat_identical':True,
                     'action_changes_vs_full':sum(a!=b for a,b in zip(actions,fa))+abs(len(actions)-len(fa))}
                if variant!='legacy':
                    changes=[0]*4
                    for at,bt in zip(w.traces,fw.traces):
                        for actor in at['actors']:
                            x=at['actors'][actor]['decision']['weights'];y=bt['actors'][actor]['decision']['weights']
                            changes=[n+int(abs(a-b)>1e-12) for n,a,b in zip(changes,x,y)]
                    row['axis_weight_changes_vs_full']=changes
                results.append(row)
                if name=='ordinary' and ticks==80 and variant=='full':
                    save(output/'ordinary-80/state.json',w.state)
                    save(output/'ordinary-80/events.json',w.events)
                    save(output/'ordinary-80/replay.json',{'mode':'recorded-interaction-v1','profile_sha256':w.profile_digest,'frames':w.frames})
                    save(output/'ordinary-80/traces.json',w.traces)
    report={'schema_version':'robot-world.interaction-experiments/v1','environment':{'python':platform.python_version(),'system':platform.platform()},
            'profile_sha256':digest(canonical(profile())),'fixtures_sha256':digest(fixture.read_bytes()),
            'results':results,'mechanisms':mechanisms(),'authority_effect':'none','product_approval':'not_requested',
            'open_questions':'development/robot-world-kep/interaction-dynamics/REPORT.md#open-questions',
            'reference_base':'repository-root'}
    save(output/'experiments.json',report)
    print(json.dumps({'output':str(output),'comparisons':len(results),'repeat_identical':True,
                      'successor_invalid_intents':sum(r['invalid_policy_intents'] for r in results if r['variant']!='legacy')}))


if __name__=='__main__':main()
