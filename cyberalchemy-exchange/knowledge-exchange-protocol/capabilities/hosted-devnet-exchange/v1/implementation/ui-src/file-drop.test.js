import test from 'node:test';
import assert from 'node:assert/strict';
import {bindFileDrop} from './file-drop.js';
function setup(blocked=false){
 const listeners={},classes=new Set(),selected=[],errors=[];
 const zone={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},contains:x=>x===zone};
 const root={addEventListener:(name,fn)=>listeners[name]=fn,querySelectorAll:()=>[zone]};
 bindFileDrop(root,{select:f=>selected.push(f),reject:m=>errors.push(m),blocked:()=>blocked});
 const event=(files=[],inside=true,types=['Files'],items=[])=>({target:{closest:()=>inside?zone:null},dataTransfer:{types,files,items},preventDefault(){this.prevented=true;}});
 return {listeners,classes,selected,errors,event,zone};
}
test('drop selects original File and clears highlight',()=>{const s=setup(),file={name:'art.png',size:200};const e=s.event([file]);s.listeners.dragover(e);assert(s.classes.has('is-dragging'));assert.equal(e.dataTransfer.dropEffect,'copy');s.listeners.drop(e);assert.equal(s.selected[0],file);assert.equal(s.classes.size,0);assert(e.prevented);});
test('multiple files and directories are rejected',()=>{for(const [files,items] of [[[{},{}],[]],[[{}],[{webkitGetAsEntry:()=>({isDirectory:true})}]]]){const s=setup();s.listeners.drop(s.event(files,true,['Files'],items));assert.equal(s.selected.length,0);assert.equal(s.errors.length,1);}});
test('outside and busy drops cannot select or navigate',()=>{for(const busy of [false,true]){const s=setup(busy),e=s.event([{}],busy);s.listeners.drop(e);assert(e.prevented);assert.equal(s.selected.length,0);}});
test('text dragging remains native and nested leave keeps highlight',()=>{const s=setup(),e=s.event([],true,['text/plain']);s.listeners.drop(e);assert(!e.prevented);s.listeners.dragover(s.event());s.listeners.dragleave({...s.event(),relatedTarget:s.zone});assert(s.classes.has('is-dragging'));s.listeners.dragleave({...s.event(),relatedTarget:null});assert.equal(s.classes.size,0);});
