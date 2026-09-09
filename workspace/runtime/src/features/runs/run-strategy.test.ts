import {expect,it} from 'vitest';
import {projectRunStrategy} from './run-strategy';
const plan={kind:'recorded',model:'model',goal:'Explain',max_parallelism:1,nodes:[{node_id:'a',role_id:'reader',stage:'read',depends_on:[],max_attempts:1,status:'succeeded'},{node_id:'b',role_id:'writer',stage:'write',depends_on:['a'],max_attempts:2,status:'pending'}],edges:[{from:'a',to:'b'}]};
it('preserves actual graph dependencies without inventing personas',()=>{const actual=projectRunStrategy(plan);expect(actual).toEqual(plan);expect(actual).not.toBe(plan);expect(actual?.nodes[0].persona_ref).toBeUndefined();});
it('leaves older model-only descriptors without a fabricated graph',()=>{expect(projectRunStrategy({model:'model'})).toBeNull();expect(projectRunStrategy(null)).toBeNull();});
it('rejects missing, duplicate, cyclic and mismatched dependencies',()=>{
 expect(()=>projectRunStrategy({...plan,nodes:[plan.nodes[0],plan.nodes[0]]})).toThrow();
 expect(()=>projectRunStrategy({...plan,edges:[]})).toThrow();
 expect(()=>projectRunStrategy({...plan,nodes:[{...plan.nodes[0],depends_on:['missing']},plan.nodes[1]]})).toThrow();
 expect(()=>projectRunStrategy({...plan,nodes:[{...plan.nodes[0],depends_on:['b']},plan.nodes[1]],edges:[{from:'b',to:'a'},...plan.edges]})).toThrow('RUN_STRATEGY_CYCLE');
});
