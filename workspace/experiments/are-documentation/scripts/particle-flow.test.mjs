import test from 'node:test';import assert from 'node:assert/strict';
import {createFlow,advanceFlow,insideBoundary,outsideCore} from '../src/particle-flow.mjs';
test('seeded flow stays inside enclosure and outside engine across long runs',()=>{
 for(const core of [{x:0,y:0,rx:.3,ry:.48},{x:0,y:.15,rx:.45,ry:.6},{x:0,y:-.15,rx:.12,ry:.35}]){
 const particles=createFlow(180,core);for(let i=0;i<900;i++){advanceFlow(particles,i%43===0?.1:1/30,i/30,core);for(const p of particles){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(insideBoundary(p.x,p.y));assert.ok(outsideCore(p.x,p.y,core))}}}
});
test('outward particle is deflected without losing tangential movement',()=>{const core={x:0,y:0,rx:.3,ry:.48};const p={x:.919,y:0,vx:1,vy:.2,depth:.5,phase:1,trail:[]};const hits=advanceFlow([p],.04,0,core);assert.ok(hits>0);assert.ok(p.vx<0);assert.ok(p.vy>0);assert.ok(insideBoundary(p.x,p.y))});
test('fixed seed reproduces field without accumulating trajectory history',()=>{const core={x:0,y:0,rx:.3,ry:.48};const a=createFlow(20,core),b=createFlow(20,core);assert.deepEqual(a,b);for(let i=0;i<100;i++)advanceFlow(a,.033,i*.033,core);assert.ok(a.every(p=>p.trail.length===0))});
test('field drifts locally in mixed directions without collective rotation',()=>{const core={x:0,y:0,rx:.3,ry:.48};const particles=createFlow(240,core);for(let i=0;i<300;i++)advanceFlow(particles,1/30,i/30,core);const clockwise=particles.filter(p=>p.x*p.vy-p.y*p.vx>0).length/particles.length;assert.ok(clockwise>.3&&clockwise<.7);const displacement=particles.reduce((sum,p)=>sum+Math.hypot(p.x-p.anchorX,p.y-p.anchorY),0)/particles.length;assert.ok(displacement>.01&&displacement<.3)});
