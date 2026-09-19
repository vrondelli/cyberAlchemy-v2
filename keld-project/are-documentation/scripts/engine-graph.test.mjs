import test from 'node:test';import assert from 'node:assert/strict';
import {engineNodes,engineEdges,workflowNodes,engineNodeMap,resolveNode} from '../src/engineGraph.ts';
import {engineStories} from '../src/engineStories.ts';
import {engineTours,tourReducer,validStep} from '../src/engineTours.ts';
import {emptyWorkspace,openCard,restoreWorkspace} from '../src/canvasWorkspace.ts';
import {readFileSync} from 'node:fs';
const docs=JSON.parse(readFileSync(new URL('../src/generated/documentation.json',import.meta.url),'utf8')).documents;
test('complete graph is connected with stable semantic IDs and source-backed facts',()=>{
 assert.equal(new Set(engineNodes.map(n=>n.id)).size,engineNodes.length);assert.equal(new Set(engineEdges.map(e=>e.id)).size,engineEdges.length);
 const seen=new Set(['request']);for(let i=0;i<engineNodes.length;i++)for(const e of engineEdges){assert.ok(engineNodeMap[e.source]&&engineNodeMap[e.target]);assert.notEqual(e.source,e.target);assert.ok(e.meaning&&e.guides.every(g=>docs.some(d=>d.id===g)));if(seen.has(e.source)||seen.has(e.target)){seen.add(e.source);seen.add(e.target);}}
 assert.equal(seen.size,engineNodes.length);assert.deepEqual(Object.keys(workflowNodes).sort(),docs.map(d=>d.id).sort());
 for(const n of engineNodes){assert.ok(!/\d$/.test(n.id));assert.ok(n.sources.length&&engineStories[n.id]);for(const source of n.sources){assert.ok(source.detail&&docs.some(d=>d.id===source.guide));}assert.ok(Object.values(workflowNodes).some(ids=>ids.includes(n.id)));}
 assert.equal(resolveNode('state'),'reasoning-state');assert.equal(resolveNode('feature-concepts-0'),'request');
});
test('tour steps reference real nodes and explicit relation highlights',()=>{for(const t of engineTours){assert.ok(t.steps.length>1);for(const s of t.steps){assert.ok(validStep(t.id,s.id));for(const id of s.nodes)assert.ok(engineNodeMap[id]);for(const id of s.edges){const e=engineEdges.find(e=>e.id===id);assert.ok(e&&s.nodes.includes(e.source)&&s.nodes.includes(e.target));}}}});
test('tour transitions preserve pause, resume, completion and exit semantics',()=>{let state=tourReducer(null,{type:'start',id:'request'});assert.equal(state.status,'running');state=tourReducer(state,{type:'pause'});assert.equal(state.status,'paused');state=tourReducer(state,{type:'resume'});assert.equal(state.status,'running');state=tourReducer(state,{type:'step',step:engineTours[0].steps.at(-1).id});assert.equal(state.status,'completed');assert.equal(tourReducer(state,{type:'exit'}),null);});
const restore=raw=>restoreWorkspace(raw,'current',docs.map(d=>d.id),[],['continuity']);
test('v1 migration retains compatible cards and canonicalizes core aliases',()=>{const old={schema:1,version:'previous',lens:'continuity',selected:'state',active:'doc-concepts',cards:[{id:'doc-concepts',document:'concepts',position:{x:9,y:8},expanded:false,scroll:72,sources:['state']}],viewport:{x:2,y:3,zoom:.85}};const {workspace,notice}=restore(JSON.stringify(old));assert.ok(notice);assert.equal(workspace.schema,2);assert.equal(workspace.selected,'reasoning-state');assert.equal(workspace.cards[0].scroll,72);assert.deepEqual(workspace.cards[0].sources,['reasoning-state']);});
test('reload pauses a tour, prunes removed IDs and retains unrelated progress',()=>{let s=openCard(emptyWorkspace('current'),'concepts','request',{x:10,y:20});s.positions={request:{x:9,y:7},removed:{x:1,y:2}};s.tour={id:'request',step:'route',status:'running'};s.viewport={x:0,y:0,zoom:.05};let r=restore(JSON.stringify(s));assert.equal(r.workspace.tour.status,'paused');assert.deepEqual(r.workspace.positions,{request:{x:9,y:7}});assert.equal(r.workspace.cards.length,1);assert.equal(r.workspace.viewport.zoom,.05);s.tour.step='removed';r=restore(JSON.stringify(s));assert.equal(r.workspace.tour,null);assert.equal(r.workspace.cards.length,1);});
test('malformed storage recovers and bounded invalid entries are pruned',()=>{assert.ok(restore('{').notice);let s=emptyWorkspace('current');s.viewport={x:0,y:0,zoom:99};assert.equal(restore(JSON.stringify(s)).workspace.viewport,null);assert.ok(restore('x'.repeat(250001)).notice);});

test('request tour follows documented directed transitions',()=>{const t=engineTours[0];for(let i=1;i<t.steps.length;i++)assert.ok(engineEdges.some(e=>e.source===t.steps[i-1].node&&e.target===t.steps[i].node),t.steps[i].node);});
