import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Presentation-only construction. IDs and puzzle rules remain in authored content.
export function solidIncidentRoom(room) {
  if (room.id !== 'incident-control-room') return room;
  const placements = {
    'support-desk': [-3.1, 0, 0.12, 2.4, 1.25, 1.45],
    'event-ledger': [-3.4, -3.8, 0.12, 1.4, 1.1, 1.85],
    'availability-rack': [0, -4.7, 0, 1.6, 1.05, 2.65],
    'storefront-terminal': [3.4, -3.3, -0.2, 1.6, 1.15, 1.85]
  };
  const stations = Object.fromEntries(Object.entries(room.spatial.stations).map(([id, original]) => {
    const [x,z,facing,width,depth,height] = placements[id];
    return [id, {...original,x,z,facing,footprint:{width,depth},visual_size:{width,height},look_at_height:id === 'support-desk' ? 0.95 : 1.4,
      interaction_anchor:{x:x+Math.sin(facing)*2.6,z:z+Math.cos(facing)*2.6}}];
  }));
  const exits = Object.fromEntries(Object.entries(room.spatial.exits).map(([id, layout]) => [id,{...layout,x:5.25,z:-5.7,yaw:0,interaction_anchor:{x:5.25,z:-3.0}}]));
  return {...room,spatial:{...room.spatial,solid:true,bounds:{width:14,depth:12},stations,exits}};
}

function material(color, metalness=0.25, roughness=0.65) {
  return new THREE.MeshStandardMaterial({color,metalness,roughness});
}
function box(root, size, pos, mat, bevel=0.025) {
  const geo = bevel ? new RoundedBoxGeometry(...size,1,Math.min(bevel,...size.map(v=>v/3))) : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geo,mat);
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true;
  root.add(mesh); return mesh;
}
function cylinder(root,radius,height,pos,mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,16),mat);
  mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
}
function palette() {
  return {paint:material(0x31595a,0.35),edge:material(0x172e33,0.55),metal:material(0x83908a,0.7,0.4),
    brass:material(0xb89559,0.6,0.42),black:material(0x0c191b),paper:material(0xd6ccb0,0,0.95),red:material(0x963f34,0,0.85),
    glow:new THREE.MeshStandardMaterial({color:0x92c4ae,emissive:0x72bcaa,emissiveIntensity:0.6,roughness:0.4})};
}
function plate(root, text, size, pos, color='#bac7bf') {
  // Typography is a surface decal on solid geometry, never a room/prop cutout.
  if (typeof document === 'undefined') return;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#182d30';ctx.fillRect(0,0,1024,128);
  ctx.fillStyle=color;ctx.font='500 56px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,66,980);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map:texture,roughness:0.8});
  const mesh=box(root,size,pos,mat,0);mesh.userData.ownedTexture=texture;
}
function vents(root, x,y,z,width,p) {
  for(let i=0;i<6;i++) box(root,[width,0.018,0.014],[x,y+i*0.045,z],p.black,0);
}
function screen(root,x,y,z,w,h,p) {
  box(root,[w+0.14,h+0.14,0.15],[x,y,z],p.edge);
  box(root,[w,h,0.025],[x,y,z+0.087],p.black);
  for(let i=0;i<4;i++)box(root,[w*(0.7-i*0.09),0.015,0.008],[x-w*0.06,y+h*0.25-i*h*0.16,z+0.104],p.glow,0);
}

export function buildSolidStation(root,id) {
  const p=palette();root.userData.materials=p;
  if(id==='support-desk') {
    box(root,[2.35,0.12,1.2],[0,0.92,0],p.brass);
    box(root,[2.25,0.065,1.1],[0,0.998,0],p.paint);
    for(const x of [-0.84,0.84]) {
      box(root,[0.58,0.8,1.0],[x,0.43,0],p.paint);
      box(root,[0.61,0.09,1.04],[x,0.055,0],p.edge);
      for(let i=0;i<3;i++) {
        box(root,[0.5,0.205,0.05],[x,0.2+i*0.24,0.52],p.edge);
        box(root,[0.47,0.185,0.025],[x,0.2+i*0.24,0.556],p.paint);
        box(root,[0.17,0.025,0.055],[x,0.24+i*0.24,0.59],p.brass);
      }
    }
    box(root,[1.05,0.32,0.05],[0,0.69,-0.46],p.edge);
    const folder=box(root,[0.63,0.035,0.45],[-0.18,1.05,0.22],p.red,0.005);folder.rotation.y=-0.12;
    root.userData.actionMesh=folder;
    root.userData.labelAnchor=new THREE.Vector3(-0.18,1.13,0.22);
    box(root,[0.21,0.007,0.09],[-0.18,1.071,0.22],p.paper,0);
    for(let i=0;i<4;i++)box(root,[0.4,0.013,0.28],[0.73,1.043+i*0.014,-0.25],p.paper,0.003);
    cylinder(root,0.14,0.045,[-0.85,1.06,-0.3],p.edge);
    cylinder(root,0.027,0.48,[-0.85,1.3,-0.3],p.brass);
    const shade=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.18,20,1,true),p.paint);shade.position.set(-0.85,1.54,-0.3);root.add(shade);
    cylinder(root,0.155,0.018,[-0.85,1.454,-0.3],p.glow);
  } else if(id==='availability-rack') {
    box(root,[1.5,0.15,1.0],[0,0.075,0],p.edge);
    box(root,[1.42,2.45,0.91],[0,1.37,-0.035],p.paint);
    box(root,[1.16,2.18,0.035],[0,1.35,0.44],p.black);
    for(const x of [-0.65,0.65])box(root,[0.065,2.4,0.075],[x,1.35,0.48],p.brass);
    for(let i=0;i<5;i++) {
      const y=0.48+i*0.38;
      box(root,[1.04,0.29,0.14],[0,y,0.48],p.edge);
      vents(root,-0.14,y-0.10,0.56,0.52,p);
      box(root,[0.075,0.075,0.02],[0.38,y,0.563],p.glow);
      box(root,[0.1,0.04,0.04],[-0.43,y,0.59],p.brass);
    }
    plate(root,'AVAILABILITY / 03',[1.16,0.14,0.02],[0,2.47,0.47]);
  } else {
    const printer=id==='storefront-terminal';
    box(root,[1.28,0.1,1.02],[0,0.05,0],p.edge);
    box(root,[1.18,0.82,0.87],[0,0.5,-0.03],p.paint);
    box(root,[1.3,0.14,1.03],[0,0.94,0],p.brass);
    box(root,[1.19,0.8,0.55],[0,1.41,-0.19],p.paint);
    screen(root,0,1.48,0.12,0.86,0.42,p);
    box(root,[1.07,0.06,0.32],[0,1.04,0.29],p.edge);
    if(printer) {
      box(root,[0.64,0.045,0.02],[0,1.12,0.13],p.black);
      const paper=box(root,[0.47,0.008,0.38],[0,1.077,0.3],p.paper,0);paper.rotation.x=0.13;
      for(let i=0;i<4;i++)box(root,[0.25,0.009,0.012],[0,1.098,0.2+i*0.035],p.edge,0);
    } else {
      for(let row=0;row<3;row++)for(let col=0;col<9;col++)box(root,[0.075,0.025,0.04],[-0.4+col*0.1,1.085,0.2+row*0.075],p.metal,0.004);
    }
    vents(root,0,0.25,0.416,0.74,p);
    plate(root,printer?'COMMITMENT / 04':'EVENT REPLAY / 02',[1.02,0.13,0.02],[0,0.74,0.416]);
  }
  const bounds=new THREE.Box3().setFromObject(root), size=bounds.getSize(new THREE.Vector3());
  root.userData.solidSize={width:size.x,height:size.y,depth:size.z};
  root.traverse(mesh=>{if(mesh.isMesh)mesh.userData.pickable=id!=='support-desk' || mesh===root.userData.actionMesh;});
}

export function buildSolidArchitecture(world,room) {
  const p=palette(), {width,depth}=room.spatial.bounds;
  const floorMat=material(0x3c4846,0.15,0.88), wallMat=material(0x60706b,0.12,0.92);
  const floor=box(world,[width,0.12,depth],[0,-0.06,0],floorMat,0);floor.castShadow=false;
  box(world,[width,4.2,0.2],[0,2.1,-depth/2],wallMat,0);
  for(const x of [-width/2,width/2])box(world,[0.2,4.2,depth],[x,2.1,0],wallMat,0);
  box(world,[width,0.14,depth],[0,4.2,0],p.edge,0);
  // Flush seams and wall cladding use one perspective and leave the aisle clear.
  for(let x=-6;x<=6;x+=2) {
    box(world,[0.025,0.002,depth],[x,0.002,0],p.edge,0).castShadow=false;
    box(world,[1.92,1.3,0.05],[x,0.7,-5.87],p.paint,0);
    box(world,[0.095,4.1,0.16],[x+1,2.05,-5.82],p.edge,0);
  }
  for(let z=-5;z<=5;z+=2) {
    box(world,[width,0.002,0.025],[0,0.003,z],p.edge,0).castShadow=false;
    box(world,[width,0.16,0.13],[0,4.02,z],p.metal,0);
    for(const x of [-6.87,6.87]) {
      box(world,[0.05,1.3,1.92],[x,0.7,z],p.paint,0);
      box(world,[0.14,4.1,0.08],[x,2.05,z+1],p.edge,0);
    }
  }
  plate(world,'INCIDENT CONTROL',[4.3,0.53,0.04],[0,3.4,-5.84]);
  plate(world,'01  /  EVIDENCE INTAKE',[2.3,0.28,0.04],[-3.5,2.7,-5.84],'#dfbb77');

  const lightMat=new THREE.MeshStandardMaterial({color:0xffe3b6,emissive:0xffdb9a,emissiveIntensity:2});
  for(const x of [-3.5,3.5]) {
    box(world,[2.2,0.12,0.46],[x,3.96,-1.5],p.black);
    box(world,[2.04,0.025,0.3],[x,3.88,-1.5],lightMat);
    const lamp=new THREE.SpotLight(0xffdfb3,90,16,1.05,0.7,1.4);
    lamp.position.set(x,3.8,-1.5);lamp.target.position.set(x,0,-2.5);
    world.add(lamp,lamp.target);
  }
  world.add(new THREE.HemisphereLight(0xd4e7e2,0x3a3931,2.0));
  const key=new THREE.DirectionalLight(0xffe3b8,2.4);key.position.set(-3,3.7,3);key.target.position.set(0,0,-2);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:0.1,far:25});
  key.shadow.normalBias=0.035;key.shadow.bias=-0.0001;
  world.add(key,key.target);
  return floor;
}

export function buildSolidExit(root) {
  const p=palette();
  for(const x of [-1.02,1.02])box(root,[0.2,2.85,0.35],[x,1.425,0],p.metal);
  box(root,[2.24,0.24,0.35],[0,2.85,0],p.metal);
  box(root,[1.86,2.64,0.12],[0,1.32,-0.06],p.edge);
  for(const x of [-0.46,0.46]) {
    box(root,[0.9,2.53,0.09],[x,1.32,0.04],p.paint);
    box(root,[0.64,0.48,0.035],[x,1.9,0.10],p.black);
    box(root,[0.6,0.42,0.02],[x,1.9,0.13],p.glow);
    box(root,[0.045,0.36,0.1],[x*0.22,1.15,0.16],p.brass);
  }
  box(root,[2.18,0.035,0.5],[0,0.018,0.05],p.brass);
  plate(root,'POLICY ARCHIVE  →',[1.9,0.2,0.02],[0,2.85,0.19]);
  root.userData.solidSize={width:2.24,height:2.97,depth:0.5};
}
