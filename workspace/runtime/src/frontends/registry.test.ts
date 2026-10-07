import {describe,it,expect} from 'vitest';
import {frontendRoute,frontendHref,frontends} from './registry';
describe('frontend routing',()=>{
 it('keeps nested app paths and encoded identities intact',()=>{
  const app=frontends[0],path='/runs/'+encodeURIComponent('runtime/launch/a%?#');
  expect(frontendRoute(frontendHref(app,path))).toEqual({app,path});
  expect(frontendRoute('#/apps/orchestrator/lab')?.path).toBe('/lab');
  expect(frontendRoute('#/apps/orchestrator-other/runs')).toBeNull();
  expect(frontendRoute('#/chat')).toBeNull();
 });
 it('keeps old dashboard and Runs links',()=>{
  expect(frontendRoute('#/dashboard/result/runtime%2Flaunch%2Fid')).toBeNull();
  expect(frontendRoute('#/runs')?.path).toBe('/runs');
  expect(frontendRoute('#/runs/old-workspace-id')?.path).toBe('/runs');
 });
 it('rejects routes that could escape the app mount',()=>{
  expect(()=>frontendHref(frontends[0],'https://example.com')).toThrow();
  expect(()=>frontendHref(frontends[0],'//example.com')).toThrow();
  expect(()=>frontendHref(frontends[0],'/runs#/chat')).toThrow();
 });
});
