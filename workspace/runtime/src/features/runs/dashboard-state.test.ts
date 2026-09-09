import {describe,it,expect} from 'vitest';
import {resultHash,resultFromHash,dashboardGroups,offlineProjection} from './dashboard-state';
import type {RunView,RunProjection} from './run-contract';
const run={viewId:'runtime/launch/id',execution:'succeeded',attention:[],actions:['cancel'],source:{freshness:'fresh',observedAtMs:123},result:{content:'saved output'}} as unknown as RunView;
describe('dashboard state',()=>{
 it('round-trips result identities containing routing characters',()=>{const id='local/launch/a%?+#';expect(resultFromHash(resultHash(id))).toBe(id);expect(resultFromHash('#/dashboard/result/%xx')).toBeNull();expect(resultFromHash('#/essays')).toBeNull();expect(resultFromHash('#/dashboard/result/'+encodeURIComponent(id))).toBe(id);expect(resultFromHash('#/runs/%xx')).toBeNull();});
 it('keeps active work and attention distinct from completed work',()=>{const groups=dashboardGroups([run,{...run,execution:'running'},{...run,execution:'uncertain',attention:['reconciliation-required']}]);expect(groups.active).toHaveLength(1);expect(groups.attention).toHaveLength(1);expect(groups.completed).toHaveLength(2);});
 it('retains output and last observation time after disconnection',()=>{const projection={schemaVersion:'workspace-run-projection/v1-candidate',authorityEffect:'none',sources:[run.source],runs:[run]} as RunProjection;const offline=offlineProjection(projection);expect(offline.runs[0].result.content).toBe('saved output');expect(offline.runs[0].source.observedAtMs).toBe(123);expect(offline.sources[0].freshness).toBe('offline');expect(offline.runs[0].attention).toContain('source-offline');expect(offline.runs[0].actions).toEqual([]);expect(projection.sources[0].freshness).toBe('fresh');});
});
