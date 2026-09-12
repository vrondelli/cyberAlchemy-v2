"""Independent contract checks. Questions: ../interaction-dynamics/REPORT.md."""
import copy
import json
import math
import unittest
from unittest.mock import patch

import jsonschema

from prototype import World, PACKAGE, canonical, digest, verify_history
from interaction_dynamics import semantic, weights, memory_step, velocity, steer, profile
from interaction_world import InteractionWorld


def initial():
    return copy.deepcopy(World().state)


def intent(world, action='wait', key='explorer', request='manual', **kw):
    return {'schema_version':'robot-world.action/v1-prototype','world_id':world.state['world_id'],
            'agent_id':key,'request_id':request,'expected_revision':world.state['revision'],
            'action':action,**kw}


class NumericTests(unittest.TestCase):
    def test_axes_and_bounded_weights(self):
        self.assertEqual(semantic([0.2,0.5],[0.1,20],[1,1]),[0.30000000000000004,1])
        self.assertEqual(weights([0,1],[-1,1]),[0,1])
        for invalid in ([math.nan],[-1],[True]):
            with self.assertRaises(ValueError):semantic([0],invalid,[1])
        with self.assertRaises(ValueError):semantic([0],[1],[1,2])

    def test_decay_hand_oracle_and_event_time(self):
        self.assertAlmostEqual(memory_step([1],[math.log(2)],1,[0.5])[0],1)
        self.assertAlmostEqual(memory_step([1],[math.log(2)],2,[0])[0],0.25)
        split=memory_step(memory_step([1],[math.log(2)],1,[0]),[math.log(2)],1,[0.5])
        self.assertAlmostEqual(split[0],0.75)
        self.assertEqual(memory_step([1],[0],0,[0.5]),[1.5])
        self.assertGreater(memory_step([1,1],[0.01,0.5],2,[0,0])[0],memory_step([1,1],[0.01,0.5],2,[0,0])[1])
        for args in [([1],[-1],1,[0]),([1],[1],-1,[0]),([1],[1],math.nan,[0]),([1],[1],1,[-1])]:
            with self.assertRaises(ValueError):memory_step(*args)

    def test_steady_input_bound_and_saturation(self):
        m=[0]*4; cfg=profile(); impulses=[0.1,0.5,0.3,0.1]
        limits=[i/(1-math.exp(-r)) for i,r in zip(impulses,cfg['rates'])]
        for _ in range(2000):
            m=memory_step(m,cfg['rates'],1,impulses)
            self.assertTrue(all(x<=bound+1e-10 for x,bound in zip(m,limits)))
        self.assertEqual(semantic([0.5]*4,m,[1]*4),[1]*4)

    def test_dimensions_empty_coincident_and_bad_inputs(self):
        for n in (1,2,4,100):
            self.assertEqual(steer([0]*n,[0]*n,[],[1]*n)['scaled_force'],[0]*n)
            same=steer([0]*n,[0]*n,[([0]*n,[0]*n)],[1]*n)
            self.assertEqual(same['scaled_force'],[0]*n)
        for scales in ([0],[-1],[math.inf],[True],[]):
            with self.assertRaises(ValueError):steer([0],[0],[],scales)
        with self.assertRaises(ValueError):steer([0],[0],[([0,1],[0])],[1])
        with self.assertRaises(ValueError):steer([math.nan],[0],[],[1])
        with self.assertRaises(ValueError):steer([1e308],[0],[],[1e-308])

    def test_separation_alignment_cohesion_independently(self):
        def cfg(term):
            c=profile()['steering']
            for k in ('separation','alignment','cohesion'):
                if k!=term:c[k]=0
            return c
        self.assertAlmostEqual(steer([0],[0],[([0],[1])],[1],cfg('alignment'))['scaled_force'][0],0.1)
        self.assertAlmostEqual(steer([0],[0],[([1],[0])],[1],cfg('cohesion'))['scaled_force'][0],0.08)
        self.assertLess(steer([0],[0],[([0.2],[0])],[1],cfg('separation'))['scaled_force'][0],0)
        self.assertEqual(steer([0],[0],[([1],[0])],[1],cfg('separation'))['scaled_force'],[0])

    def test_scaled_units_cap_and_velocity(self):
        a=steer([0.1,0.3],[0.2,0.4],[([0.8,0.6],[1,0.1])],[1,2])
        b=steer([1,3],[2,4],[([8,6],[10,1])],[10,20])
        for x,y in zip(a['scaled_force'],b['scaled_force']):self.assertAlmostEqual(x,y)
        for x,y in zip(a['semantic_force'],b['semantic_force']):self.assertAlmostEqual(x*10,y)
        force=steer([0]*100,[0]*100,[([100]*100,[100]*100)],[1]*100)
        self.assertAlmostEqual(math.hypot(*force['scaled_force']),0.15)
        self.assertEqual(velocity([0,1],[1,0],2),[0.5,-0.5])
        with self.assertRaises(ValueError):velocity([0],[1],0)


class SuccessorTests(unittest.TestCase):
    def test_legacy_golden_unchanged(self):
        g=json.loads((PACKAGE/'interaction-dynamics/evidence/baseline-v1/golden.json').read_text())
        w=World()
        for _ in range(80):w.step()
        self.assertEqual(digest(canonical(w.events)),g['events_sha256'])
        self.assertEqual(digest(canonical(w.frames)),g['frames_sha256'])

    def test_all_four_counterfactuals(self):
        # Zero neighbor force isolates a single axis; no calibration against output.
        def choose(prior,cargo=0,stock=0,energy=100):
            s=initial();s['robots']={'explorer':s['robots']['explorer']}
            a=s['robots']['explorer'];a.update(position=[0,0],prior=prior,cargo=cargo,energy=energy)
            s['stock']=stock;s['resource']=80-stock-cargo
            return InteractionWorld(s).decision('explorer')['chosen']['label']
        self.assertEqual(choose([0,0,0,0.2],energy=1),'wait')
        self.assertEqual(choose([1,0,0,0.2],energy=1),'move-resource')
        self.assertEqual(choose([0.2,0,0,0],stock=6),'move-resource')
        self.assertEqual(choose([0.2,1,0,0],stock=6),'move-workshop')
        self.assertEqual(choose([0.1,0,0,0],cargo=1),'move-resource')
        self.assertEqual(choose([0.1,0,0.9,0],cargo=1),'move-workshop')
        self.assertEqual(choose([0.1,0,0,0],energy=1),'move-resource')
        self.assertEqual(choose([0.1,0,0,1],energy=1),'wait')

    def test_exactly_once_impulse_and_honest_intermediate_states(self):
        s=initial();s['robots']['explorer']['position']=[-3,0];s['robots']['explorer']['memory']=[1,0,0,0]
        w=InteractionWorld(s);q=intent(w,'gather');r=w.apply('alice',q)
        self.assertEqual(w.state['robots']['explorer']['memory'],[1,0,0,0])
        before=canonical(w.state); pending=copy.deepcopy(w._pending)
        self.assertEqual(w.apply('alice',q),r)
        self.assertEqual(canonical(w.state),before);self.assertEqual(w._pending,pending)
        with self.assertRaises(ValueError):w.apply('alice',intent(w,'gather',request='second'))
        w.finish_tick()
        self.assertAlmostEqual(w.state['robots']['explorer']['memory'][0],math.exp(-0.08)+0.1)
        self.assertEqual(w.traces[-1]['actors']['explorer']['impulses'],[0.1,0,0,0])
        self.assertEqual(verify_history(w.events,w.initial),w.state)
        # A duplicate from a closed tick neither opens another tick nor counts again.
        w.apply('alice',q);self.assertIsNone(w._active)

    def test_rejections_are_immutable_and_fresh_acceptance_counts(self):
        s=initial();s['robots']['explorer']['position']=[-3,0]
        w=InteractionWorld(s);q=intent(w,'gather')
        for caller,bad in [('mallory',q),('alice',{**q,'expected_revision':99}),
                           ('alice',{**q,'world_id':'elsewhere'}),('alice',{**q,'extra':1})]:
            with self.assertRaises((ValueError,jsonschema.ValidationError)):w.apply(caller,bad)
            self.assertEqual(w.state,s);self.assertFalse(w.events);self.assertFalse(w._pending)
        w.apply('alice',q);w.finish_tick()
        self.assertEqual(w.state['robots']['explorer']['memory'][0],0.1)

    def test_max_preferences_cannot_bypass_movement_energy_or_stock(self):
        s=initial();s['robots']['explorer'].update(prior=[1]*4,energy=0,position=[3,0])
        w=InteractionWorld(s)
        for q in [intent(w,'build'),intent(w,'move',target=[2.5,0]),intent(w,'gather')]:
            with self.assertRaises(ValueError):w.apply('alice',q)
            self.assertEqual(w.state,s)
        w.step();self.assertEqual(w.state['robots']['explorer']['energy'],0)

    def test_contention_is_current_state_checked(self):
        s=initial();s.update(stock=6,resource=74)
        for a in s['robots'].values():a.update(position=[3,0],prior=[0,1,0,0])
        w=InteractionWorld(s);w.step()
        self.assertEqual(w.state['built'],1)
        self.assertNotEqual(w.traces[0]['actors']['explorer']['decision']['chosen']['intent']['action'],'build')

    def test_successor_conservation_replay_and_determinism(self):
        a=InteractionWorld();s=initial();s['robots']=dict(reversed(list(s['robots'].items())))
        b=InteractionWorld(s)
        for _ in range(80):a.step();b.step()
        self.assertGreaterEqual(a.state['built'],1)
        self.assertEqual(canonical(a.events),canonical(b.events));self.assertEqual(canonical(a.traces),canonical(b.traces))
        self.assertEqual(verify_history(a.events,a.initial),a.state)
        states={e['revision']:e['state'] for e in a.events}
        for frame in a.frames[1:]:self.assertEqual(frame,states[frame['revision']])
        for e in a.events:
            s=e['state'];self.assertEqual(InteractionWorld._resources(s),80)
            self.assertTrue(all(x['energy']>=0 and 0<=x['cargo']<=3 for x in s['robots'].values()))
        corrupt=copy.deepcopy(a.events);corrupt[2]['state']['stock']+=1
        with self.assertRaises(ValueError):verify_history(corrupt,a.initial)

    def test_active_alignment_and_frozen_snapshot(self):
        w=InteractionWorld()
        for _ in range(12):w.step()
        self.assertTrue(any(abs(x)>0 for t in w.traces for a in t['actors'].values()
                            for x in a['decision']['steering']['terms']['alignment']))
        for t in w.traces:
            for a in t['actors'].values():
                d=a['decision'];self.assertEqual(d['semantic'],semantic(a['prior'],a['memory_before'],[1]*4))

    def test_partial_tick_failure_is_sealed(self):
        w=InteractionWorld()
        original=w.decision
        def fail_second(key):
            if key=='explorer':raise RuntimeError('injected')
            return original(key)
        with patch.object(w,'decision',side_effect=fail_second):
            with self.assertRaises(RuntimeError):w.step()
        self.assertEqual(len(w.events),1)
        with self.assertRaises(RuntimeError):w.step()
        self.assertEqual(len(w.events),1)

    def test_low_energy_impulse_and_no_recharge(self):
        s=initial();s['robots']['explorer'].update(energy=2,prior=[1,0,0,0])
        w=InteractionWorld(s);w.apply('alice',intent(w,'move',target=[-1.5,1]));w.finish_tick()
        self.assertEqual(w.state['robots']['explorer']['memory'][3],0.1)
        w.apply('alice',intent(w,request='next'));w.finish_tick()
        self.assertEqual(w.state['robots']['explorer']['energy'],1)
        self.assertLess(w.state['robots']['explorer']['memory'][3],0.1)

    def test_trace_contract_rejects_missing_or_invalid_weights(self):
        schema=json.loads((PACKAGE/'interaction-dynamics/fixtures/trace.schema.json').read_text())
        w=InteractionWorld();w.step()
        jsonschema.Draft202012Validator(schema).validate(w.traces[0])
        bad=copy.deepcopy(w.traces[0]);bad['actors']['explorer']['decision']['weights'][3]=-0.1
        with self.assertRaises(jsonschema.ValidationError):jsonschema.validate(bad,schema)
        bad=copy.deepcopy(w.traces[0]);del bad['actors']['explorer']['impulses']
        with self.assertRaises(jsonschema.ValidationError):jsonschema.validate(bad,schema)

    def test_initial_validation_and_duplicate_conflict(self):
        for field,value in [('position',[math.nan,0]),('memory',[0,0,0,-1]),('prior',[0,2,0,0]),('cargo',4),('energy',-1)]:
            s=initial();s['robots']['explorer'][field]=value
            with self.assertRaises(ValueError):InteractionWorld(s)
        s=initial();s['revision']=False
        with self.assertRaises(ValueError):InteractionWorld(s)
        w=InteractionWorld();q=intent(w);w.apply('alice',q)
        before=canonical(w.state);pending=copy.deepcopy(w._pending)
        with self.assertRaises(ValueError):w.apply('alice',{**q,'expected_revision':1})
        self.assertEqual(canonical(w.state),before);self.assertEqual(w._pending,pending)

    def test_manual_prefix_step_completes_only_remaining_actors(self):
        w=InteractionWorld();w.apply('alice',intent(w));w.step()
        self.assertEqual(len(w.events),3)
        self.assertEqual(w.state['tick'],1)
        self.assertEqual(len(w.traces[0]['actors']['explorer']['event_ids']),1)


if __name__=='__main__':unittest.main()
