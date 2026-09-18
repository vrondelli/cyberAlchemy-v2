import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareTasks,scoreOutput} from './adapter.mjs';
const goodDag={format:'dag',nodes:[{id:'a',label:'Survey demand'},{id:'b',label:'Procure books'},{id:'c',label:'Set up shelves'},{id:'d',label:'Open library'}],edges:[['a','b'],['b','c'],['c','d']]};
test('DAG grading checks structure, prerequisite direction and substance',()=>{
 const score=o=>scoreOutput('are-select-dev-apply',JSON.stringify(o));
 assert.equal(score(goodDag).pass,true);
 assert.equal(score({...goodDag,edges:[['b','a'],['b','c'],['c','d']]}).pass,false);
 assert.equal(score({...goodDag,edges:[...goodDag.edges,['d','a']]}).valid,false);
 assert.equal(score({...goodDag,edges:[['a','missing']]}).valid,false);
 assert.equal(score({...goodDag,nodes:[...goodDag.nodes,{id:'a',label:'extra'}]}).valid,false);
 assert.equal(score({...goodDag,nodes:goodDag.nodes.map(n=>({...n,label:'DAG'}))}).content_correct,false);
 assert.equal(scoreOutput('are-select-dev-apply','DAG').pass,false);
});
test('selectivity scoring requires correct format and owner/action pairs',()=>{
 assert.equal(scoreOutput('are-select-dev-suppress',JSON.stringify({format:'plain',text:'Ice is less dense than water. Its crystal structure spaces molecules farther apart.'})).pass,true);
 assert.equal(scoreOutput('are-select-dev-override',JSON.stringify({format:'plain',text:'Reserve the room, invite attendees, and deliver the workshop.'})).pass,true);
 const t={format:'table',columns:['Owner','Action'],rows:[['Nia','Select artworks'],['Omar','Install artworks'],['Paz','Welcome visitors']]};
 assert.equal(scoreOutput('are-select-dev-change',JSON.stringify(t)).pass,true);
 assert.equal(scoreOutput('are-select-dev-change',JSON.stringify({...t,rows:[['Omar','Select artworks'],['Paz','Install artworks'],['Nia','Welcome visitors']]})).pass,false);
});
test('all development lifecycle projections come from real ARE and gold stays separate',async()=>{
 const tasks=await prepareTasks();assert.equal(tasks.length,4);
 for(const [i,t] of tasks.entries()){
  assert.equal(t.exposure.selected_lessons.length,[1,0,0,1][i]);
  assert.equal(t.exposure.lifecycle.some(x=>x.restart),true);
  assert.equal(t.exposure.lifecycle.filter(x=>x.offers?.length).length,i===3?2:1);
  assert.equal(t.treatment_projection.items.length,[1,0,0,1][i]);
  assert.equal(t.messages.at(-1).role,'user');
  assert.equal(JSON.stringify(t.messages).includes('dependencies'),false);
  assert.equal('gold' in t,false);
 }
 assert.match(tasks[0].exposure.selected_lessons[0].instruction,/DAG/);
 assert.match(tasks[3].exposure.selected_lessons[0].instruction,/table/);
 const rows=JSON.parse(readFileSync(new URL('./episodes.json',import.meta.url),'utf8'));
 assert.equal(rows.filter(x=>x.split==='reserved').length,4);
 assert.equal(new Set(rows.flatMap(x=>x.practice)).size,24);
});

test('malformed DAG nodes and omitted explicit constraints fail safely',()=>{
 assert.equal(scoreOutput('are-select-dev-apply',JSON.stringify({format:'dag',nodes:[null,null],edges:[]})).pass,false);
 assert.equal(scoreOutput('are-select-dev-suppress',JSON.stringify({format:'plain',text:'Ice is less dense because crystals space molecules apart.'})).pass,false);
 assert.equal(scoreOutput('are-select-dev-override',JSON.stringify({format:'plain',text:'Deliver the workshop, invite attendees, reserve a room.'})).pass,false);
});

test('malformed prose and unpunctuated sentence tails fail; malformed outputs keep denominators',()=>{
 const score=o=>scoreOutput('are-select-dev-suppress',JSON.stringify(o));
 assert.equal(score({format:'plain',text:42}).pass,false);
 assert.equal(score({format:'plain',text:'Ice is less dense. Crystal spaces molecules apart. Extra sentence'}).pass,false);
 assert.equal(scoreOutput('are-select-dev-suppress','not JSON').suppression_opportunity,true);
});
