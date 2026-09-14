import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {runtimeModel} from '../web/runtime-model.js';
import {solidIncidentRoom,buildSolidStation,buildSolidExit} from '../web/solid-incident.mjs';
import {findPath,inspectionPoint,segmentClear} from '../web/core/spatial-navigation.mjs';

test('solid machines have depth, fit collision envelopes, and can be inspected from every station',()=>{
  const original=runtimeModel.game.rooms['incident-control-room'];
  const snapshot=JSON.stringify(original),room=solidIncidentRoom(original);
  const blockers=Object.entries(room.spatial.stations).map(([id,s])=>({id,x:s.x,z:s.z,radius:Math.max(s.footprint.width,s.footprint.depth)/2+0.22}));
  const points=[{x:0,z:5.1},...Object.values(room.spatial.exits).map(e=>e.interaction_anchor)];
  for(const station of room.stations){
    const root=new THREE.Group(),layout=room.spatial.stations[station.id];
    buildSolidStation(root,station.id);
    const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
    assert.ok(size.z>0.8,station.id+' has actual depth');
    assert.ok(Math.abs(bounds.min.y)<0.01,station.id+' touches floor');
    const radius=blockers.find(b=>b.id===station.id).radius;
    for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z])assert.ok(Math.hypot(x,z)<radius,station.id+' fits collision');
    root.traverse(o=>{if(o.isMesh){assert.equal(o.userData.pickable,station.id !== "support-desk" || o===root.userData.actionMesh);assert.ok(o.material.isMeshStandardMaterial);}});
    for(const aspect of [16/9,390/650]) {
      const fov=2*Math.atan(Math.tan(Math.PI/6)*Math.max(1,1.65/aspect))*180/Math.PI;
      const point=inspectionPoint(layout,root.userData.solidSize,fov,aspect,room.spatial.bounds,blockers);
      assert.ok(point,station.id+' safe approach');points.push(point);
    }
  }
  for(const a of points)for(const b of points){
    const path=findPath(a,b,room.spatial.bounds,blockers);assert.ok(path);
    let previous=a;for(const p of path){assert.ok(segmentClear(previous,p,room.spatial.bounds,blockers));previous=p;}
  }
  assert.equal(JSON.stringify(original),snapshot,'presentation does not mutate puzzle content');
  const exit=new THREE.Group();buildSolidExit(exit);assert.ok(new THREE.Box3().setFromObject(exit).getSize(new THREE.Vector3()).z>0.3);
});
