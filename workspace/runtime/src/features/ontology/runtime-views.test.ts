import {describe,it,expect} from 'vitest';
import {selectRuntimeGraph,type RuntimeSnapshot} from './runtime-views';
import {buildCanvasGraph} from './graph';
const fixture=()=>({packages:[{key:'p'},{key:'q'}],head:'epoch',nodes:[{id:'p:a',packageKey:'p'},{id:'q:b',packageKey:'q'},{id:'q:c',packageKey:'q'}],relations:[{id:'p:r',packageKey:'p',source:'p:a',target:'q:b',type:'links',direction:'symmetric'}],views:[{id:'v',packageKey:'p',kind:'graph',nodeIds:['p:a'],relationIds:['p:r']}]} as unknown as RuntimeSnapshot);
describe('runtime view selection',()=>{
  it('includes cross-package endpoints without unrelated nodes',()=>{const g=selectRuntimeGraph(fixture(),'p','all');expect(g.nodes.map(n=>n.id)).toEqual(['p:a','q:b']);});
  it('selects exact authored relations and closes endpoints',()=>{expect(selectRuntimeGraph(fixture(),'p','v').nodes).toHaveLength(2);});
  it('unknown package fails',()=>expect(()=>selectRuntimeGraph(fixture(),'missing','all')).toThrow('Unknown package'));
  it('unknown view fails',()=>expect(()=>selectRuntimeGraph(fixture(),'p','missing')).toThrow('Unknown graph view'));
  it('view errors remain visible',()=>{const s=fixture();s.views[0].error='missing selector';expect(()=>selectRuntimeGraph(s,'p','v')).toThrow('missing selector');});
  it('missing endpoint fails',()=>{const s=fixture();s.nodes=s.nodes.slice(0,1);expect(()=>selectRuntimeGraph(s,'p','all')).toThrow('Missing view endpoint');});
  it('symmetric relation has no directional arrow',()=>{const g=buildCanvasGraph(selectRuntimeGraph(fixture(),'p','all'));expect(g.edges[0].markerEnd).toBeUndefined();});
});
