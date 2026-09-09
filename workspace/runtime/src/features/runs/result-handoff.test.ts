import {describe,it,expect} from 'vitest';
import {captureResult,canOfferResult,observeHandoff,parseHandoff} from './result-handoff';
import type {RunView} from './run-contract';
const run={viewId:'native/launch/a',title:'Result',runRef:{runtimeId:'native',runKey:'owner-key'},execution:'succeeded',mode:'fixture',source:{revision:7},result:{verification:'owner-verified',completionDigest:'digest',content:'Exact result'}} as RunView;
describe('result handoff',()=>{
 it('requires completed owner-verified content and an owner reference',()=>{
  expect(canOfferResult(run)).toBe(true);
  for(const changed of [{execution:'uncertain'},{runRef:null},{result:{...run.result,verification:'source-reported'}},{result:{...run.result,completionDigest:null}}])expect(canOfferResult({...run,...changed} as RunView)).toBe(false);
 });
 it('captures exact provenance without selecting a target',()=>{
  const h=captureResult(run,'id');expect(h.source.runKey).toBe('owner-key');expect(h.source.revision).toBe(7);expect(h.target).toBeNull();expect(parseHandoff(JSON.stringify(h))).toEqual(h);
 });
 it('ignores unrelated or pre-stage saves',()=>{
  const h={...captureResult(run,'id'),target:{workspaceId:'essay',baseRevision:4,stageEpoch:123}};
  const o={workspaceId:'other',workspaceRevision:5,essayRevision:1,canonicalMarkdown:'Exact result'};
  expect(observeHandoff(h,o)).toBe(h);expect(observeHandoff(h,{...o,workspaceId:'essay',workspaceRevision:4})).toBe(h);
 });
 it('distinguishes exact and edited saves without granting acceptance',()=>{
  const h={...captureResult(run,'id'),target:{workspaceId:'essay',baseRevision:4,stageEpoch:123}};
  const exact=observeHandoff(h,{workspaceId:'essay',workspaceRevision:5,essayRevision:1,canonicalMarkdown:'Exact result\n'});
  expect(exact.saved?.match).toBe('exact');
  const edited=observeHandoff(exact,{workspaceId:'essay',workspaceRevision:6,essayRevision:2,canonicalMarkdown:'Edited'});
  expect(edited.saved?.match).toBe('edited');expect(edited.source).toEqual(h.source);expect(edited).not.toHaveProperty('acceptance');
 });
 it('rejects malformed stored values',()=>{
  for(const raw of ['{}','null','bad',JSON.stringify({...captureResult(run,'id'),source:{}})])expect(()=>parseHandoff(raw)).toThrow();
 });
});
