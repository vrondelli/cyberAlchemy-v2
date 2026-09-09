import {describe,it,expect} from 'vitest';
import {toConsoleRun,toConsoleProjection} from './orchestrator-projection';
import type {RunView} from '../features/runs/run-contract';
const run:RunView={viewId:'runtime/launch/id',runRef:null,launchId:'id',taskId:'task',title:'Native task',icon:'text-task',workKind:'are-native-fixture',originRefs:[],execution:'uncertain',scheduling:'unknown',mode:'fixture',executor:{contract:'are-codex-text/v1',modelTarget:'gpt-5.6-luna'},progress:null,result:{kind:'fixture-text',content:null,verification:'unavailable',completionDigest:null},lifecycle:{execution:null,acceptance:null,promotion:null},source:{runtimeId:'runtime',label:'Native',location:'local',freshness:'offline',observedAtMs:1,revision:null},attention:['reconciliation-required'],actions:[]};
describe('orchestrator presentation adapter',()=>{
 it('preserves uncertainty and missing data without inventing strategy or workers',()=>{
  const value=toConsoleRun(run);
  expect(value.run_key).toBe(run.viewId);expect(value.observation?.execution).toBe('uncertain');expect(value.observation?.freshness).toBe('offline');
  expect(value.observation?.progressKnown).toBe(false);expect(value.strategy).toBeUndefined();expect(value.workers).toEqual([]);expect(value.automation).toBeUndefined();
  expect(value.lifecycle).toEqual({});expect(value.result?.status).toBe('unavailable');
 });
 it('preserves fixture output and verification separately from lifecycle',()=>{
  const value=toConsoleRun({...run,execution:'succeeded',progress:{accepted:1,total:1,running:0,pending:0,blocked:0},result:{kind:'fixture-text',content:'Fixed response',verification:'owner-verified',completionDigest:'abc'}});
  expect(value.result?.kind).toBe('fixture-text');expect(value.result?.content).toBe('Fixed response');expect(value.progress).toBe(100);
  expect(value.observation?.verification).toBe('Verified against owner history');expect(value.lifecycle).toEqual({});
 });
 it('does not inject bundled demonstration runs on loading',()=>{expect(toConsoleProjection(null).runs).toEqual([]);});
});

it('shows declared source coordinates with their verification ceiling',()=>{
 const value=toConsoleRun({...run,origin:{source:{kind:'chat',id:'thread-1',revision:'7',selector:'message:3'},textSha256:'abc',taskDigest:'def',binding:'task-digest-bound',sourceVerification:'caller-declared'}});
 expect(value.observation?.identity).toMatchObject({'Declared source':'chat · thread-1','Declared source revision':'7','Selected source content':'message:3','Selected text SHA-256':'abc','Reviewed task digest':'def'});
 expect(value.observation?.identity['Source attribution']).toContain('Source ownership and currentness are not verified');
 expect(toConsoleRun(run).observation?.identity).not.toHaveProperty('Declared source');
});
