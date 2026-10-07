import {describe,expect,it} from 'vitest';
import {orchestratorUrl} from './orchestrator-url';

describe('in-repository orchestrator route',()=>{
 it('opens the local Control Center',()=>expect(orchestratorUrl('/runs')).toBe('http://127.0.0.1:8787/runs'));
 it('preserves supported feature routes',()=>expect(orchestratorUrl('/operations','http://127.0.0.1:9000')).toBe('http://127.0.0.1:9000/operations'));
 it('does not turn an old Workspace run identity into a new orchestrator run',()=>expect(orchestratorUrl('/runs/old%2Frun')).toBe('http://127.0.0.1:8787/runs/old%2Frun'));
 it('rejects paths outside the Control Center',()=>expect(orchestratorUrl('//example.com')).toBe('http://127.0.0.1:8787/runs'));
 it('rejects configured URLs with credentials',()=>expect(()=>orchestratorUrl('/runs','http://user:pass@127.0.0.1:8787')).toThrow());
});
