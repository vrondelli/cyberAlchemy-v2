"""Checked local successor world. Questions: ../interaction-dynamics/REPORT.md."""
from __future__ import annotations

import copy
import jsonschema

from prototype import World, canonical, digest, norm
from interaction_dynamics import profile, semantic, memory_step, velocity, steer, weights, vector

ABLATIONS = ('full','no-steering','no-memory','no-alignment','no-cooperation','no-caution')


class InteractionWorld(World):
    def __init__(self, initial=None, ablation='full'):
        super().__init__()
        if ablation not in ABLATIONS:
            raise ValueError('UNKNOWN_ABLATION')
        self.config = profile()
        self.profile_digest = digest(canonical(self.config))
        self.ablation = ablation
        if initial is not None:
            self.state = copy.deepcopy(initial)
        self._validate_initial()
        self.initial = copy.deepcopy(self.state)
        self.frames = [copy.deepcopy(self.state)]
        self.total = self._resources(self.state)
        self.velocities = {key:[0.0]*4 for key in self.state['robots']}
        self.traces = []
        self._active = None
        self._acted = set()
        self._pending = {}
        self._decisions = {}
        self.failed = False

    def _validate_initial(self):
        s = self.state
        if type(s['revision']) is not int or type(s['tick']) is not int or s['revision'] != 0 or s['tick'] != 0 or not s['robots']:
            raise ValueError('INITIAL_CLOCK')
        for key in ('resource','stock','built'):
            if type(s[key]) is not int or s[key] < 0:
                raise ValueError('INITIAL_COUNTER')
        for key,a in s['robots'].items():
            # Reuse the closed action identity grammar without committing an action.
            from prototype import validate
            validate('ActionIntent', {'schema_version':'robot-world.action/v1-prototype',
                'world_id':s['world_id'],'agent_id':key,'request_id':'initial',
                'expected_revision':0,'action':'wait'})
            if not isinstance(a['owner'],str) or not a['owner']:
                raise ValueError('INITIAL_OWNER')
            vector(a['position'],2,-5,5); vector(a['prior'],4,0,1); vector(a['memory'],4,0)
            if type(a['cargo']) is not int or not 0 <= a['cargo'] <= 3 or type(a['energy']) is not int or a['energy'] < 0:
                raise ValueError('INITIAL_AGENT_COUNTER')

    @staticmethod
    def _resources(s):
        return s['resource']+s['stock']+6*s['built']+sum(a['cargo'] for a in s['robots'].values())

    def _commit(self, intent, next_state):
        if self._resources(next_state) != self.total or any(a['energy'] < 0 or not 0 <= a['cargo'] <= 3 for a in next_state['robots'].values()):
            raise ValueError('CONSERVATION')
        return super()._commit(intent,next_state)

    def _action_memory(self, actor, action):
        pass  # Clock commit is the sole successor memory writer.

    def _open_tick(self):
        if self.failed:
            raise RuntimeError('FAILED_TICK_REQUIRES_NEW_RUN')
        if self._active is None:
            self._active = copy.deepcopy(self.state)
            self._acted = set(); self._pending = {}; self._decisions = {}

    def apply(self, caller, intent):
        if self.failed:
            raise RuntimeError('FAILED_TICK_REQUIRES_NEW_RUN')
        # Original reducer must handle known IDs, including conflicting payloads.
        key = (caller,intent.get('request_id'))
        if isinstance(key[1],str) and key in self.requests:
            return super().apply(caller,intent)
        if intent.get('agent_id') in self._acted:
            raise ValueError('ONE_ACTION_PER_TICK')
        before = copy.deepcopy(self.state)
        count = len(self.events)
        result = super().apply(caller,intent)
        if len(self.events) != count+1 or self.state['revision'] != before['revision']+1:
            raise RuntimeError('COMMIT_ACCOUNTING')
        if self._active is None:
            self._active = before
        event = self.events[-1]
        actor = self.state['robots'][intent['agent_id']]
        impulse = [0.0]*4
        action = intent['action']
        if action in self.config['impulses']:
            impulse = list(self.config['impulses'][action])
        elif action == 'move' and actor['energy'] < self.config['reserve']:
            impulse = list(self.config['impulses']['low_energy_move'])
        self._pending[event['event_hash']] = {'agent_id':intent['agent_id'],'impulse':impulse}
        self._acted.add(intent['agent_id'])
        return result

    def _preferences(self, key):
        state = self._active if self._active is not None else self.state
        def sem(actor):
            return semantic(actor['prior'],[0.0]*4 if self.ablation=='no-memory' else actor['memory'],self.config['gains'])
        s = sem(state['robots'][key])
        neighbors = [(k,sem(state['robots'][k]),self.velocities[k]) for k in sorted(state['robots']) if k!=key]
        cfg = copy.deepcopy(self.config['steering'])
        if self.ablation=='no-alignment': cfg['alignment']=0
        force = steer(s,self.velocities[key],[(p,v) for _,p,v in neighbors],self.config['scales'],cfg)
        if self.ablation=='no-steering':
            force = {**force,'scaled_force':[0.0]*4,'semantic_force':[0.0]*4}
        w = weights(s,force['semantic_force'])
        if self.ablation=='no-cooperation': w[2]=0
        if self.ablation=='no-caution': w[3]=0
        return s,neighbors,force,w

    def decision(self, key):
        actor = self.state['robots'][key]
        s,neighbors,force,w = self._preferences(key)
        stock = self.state['stock']; cargo = actor['cargo']
        acquire = float(cargo<3 and self.state['resource']>0)
        construct = float(stock>=6)
        cooperate = min(cargo,max(0,6-stock))/3
        candidates = []
        operations = [('build','build',None,[0,construct,0,0]),
                      ('deposit','deposit',None,[0,0,cooperate,0]),
                      ('gather','gather',None,[acquire,0,0,0])]
        for label,target,features in [('move-workshop',[3.0,0.0],[0,construct,cooperate,0]),
                                       ('move-resource',[-3.0,0.0],[acquire,0,0,0])]:
            distance = norm([a-b for a,b in zip(target,actor['position'])])
            if distance > 0.19 and any(features[:3]):
                bounded = [round(x+(y-x)*min(0.8/distance,1),6) for x,y in zip(actor['position'],target)]
                f = [x*self.config['travel_discount'] for x in features]
                f[3] = -max(self.config['cost_floor'],1-actor['energy']/self.config['reserve'])
                operations.append((label,'move',bounded,f))
        operations.append(('wait','wait',None,[0,0,0,0]))
        for label,action,target,features in operations:
            intent = {'schema_version':'robot-world.action/v1-prototype','world_id':self.state['world_id'],
                      'agent_id':key,'request_id':f"{key}-{self.state['tick']}",
                      'expected_revision':self.state['revision'],'action':action}
            if target is not None: intent['target']=target
            trial = World(); trial.state = copy.deepcopy(self.state)
            eligible = True; reason = None
            try:
                trial.apply(actor['owner'],intent)
            except (ValueError,jsonschema.ValidationError) as error:
                eligible = False; reason = str(error)
            score = self.config['wait_score'] if action=='wait' else sum(a*b for a,b in zip(w,features))+self.config['progress_bonus']
            candidates.append({'label':label,'intent':intent,'features':features,'score':score,'eligible':eligible,'rejection':reason})
        legal = [c for c in candidates if c['eligible']]
        chosen = min(legal,key=lambda c:(-c['score'],self.config['tie_order'].index(c['label'])))
        return {'agent_id':key,'source_revision':self.state['revision'],'semantic':s,
                'velocity':list(self.velocities[key]),'neighbors':neighbors,'steering':force,
                'weights':w,'candidates':candidates,'chosen':copy.deepcopy(chosen)}

    def policy(self, key):
        return self.decision(key)['chosen']['intent']

    def finish_tick(self):
        self._open_tick()
        try:
            state = copy.deepcopy(self.state)
            actors = {}
            next_velocities = {}
            for key in sorted(state['robots']):
                before = self._active['robots'][key]
                events = [(h,v) for h,v in self._pending.items() if v['agent_id']==key]
                impulse = [sum(v['impulse'][k] for _,v in events) for k in range(4)]
                memory = memory_step(before['memory'],self.config['rates'],self.config['dt'],impulse)
                state['robots'][key]['memory'] = memory
                s0 = semantic(before['prior'],[0.0]*4 if self.ablation=='no-memory' else before['memory'],self.config['gains'])
                s1 = semantic(before['prior'],[0.0]*4 if self.ablation=='no-memory' else memory,self.config['gains'])
                next_velocities[key] = velocity(s0,s1,self.config['dt'])
                actors[key] = {'prior':before['prior'],'memory_before':before['memory'],'memory_after':memory,
                               'impulses':impulse,'event_ids':[h for h,_ in events],
                               'decision':self._decisions.get(key),'semantic_after':s1}
            state['tick'] += 1
            receipt = self._commit({'action':'advance-clock','host':'interaction-v1','profile_sha256':self.profile_digest},state)
            self.traces.append({'schema_version':'robot-world.decision-trace/v1','profile_sha256':self.profile_digest,
                                'ablation':self.ablation,'dt':self.config['dt'],'snapshot':self._active,
                                'actors':actors,'clock_receipt':receipt,'state_sha256':digest(canonical(state))})
            self.velocities = next_velocities
            self.frames.append(copy.deepcopy(state))
            self._active = None; self._acted = set(); self._pending = {}; self._decisions = {}
            return receipt
        except Exception:
            self.failed = True
            raise

    def step(self):
        self._open_tick()
        try:
            for key in sorted(self.state['robots']):
                if key in self._acted: continue
                decision = self.decision(key)
                decision['receipt'] = self.apply(self.state['robots'][key]['owner'],decision['chosen']['intent'])
                self._decisions[key] = decision
            return self.finish_tick()
        except Exception:
            self.failed = True
            raise
