// Art-directed 2D flow with projected depth; no physical-fluid guarantees.
const normals=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
export function insideBoundary(x,y){return normals.every(([nx,ny])=>x*nx+y*ny<=.92+1e-8)}
export function outsideCore(x,y,core){return ((x-core.x)/core.rx)**2+((y-core.y)/core.ry)**2>=1-1e-8}
export function createFlow(count,core,seed=741){
 let value=seed>>>0;const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296};
 return Array.from({length:count},()=>{let x=0,y=0;for(let i=0;i<1000;i++){x=random()*1.8-.9;y=random()*2-1;if(insideBoundary(x,y)&&outsideCore(x,y,core))break}const depth=random(),phase=random()*Math.PI*2;return {x,y,anchorX:x,anchorY:y,vx:Math.cos(phase)*.035,vy:Math.sin(phase)*.035,depth,phase,trail:[]}});
}
export function advanceFlow(particles,dt,time,core){
 const steps=Math.max(1,Math.ceil(Math.min(dt,.1)/.012));const h=Math.min(dt,.1)/steps;let hits=0;
 for(let s=0;s<steps;s++)for(const p of particles){
  const x=p.x,y=p.y;
  // Independent local drift: each point stays near its own place in the field.
  // There is no global vortex, shared travel direction, or emitter.
  const frequency=.22+p.depth*.17;
  let fx=Math.cos(time*frequency+p.phase)*.065+((p.anchorX??x)-x)*.42;
  let fy=Math.sin(time*(frequency*.83)+p.phase*1.73)*.065+((p.anchorY??y)-y)*.42;
  for(const [nx,ny]of normals){const distance=.92-x*nx-y*ny;const outward=fx*nx+fy*ny;if(distance<.14&&outward>0){const weight=1-Math.max(0,distance)/.14;fx-=nx*outward*weight*.86;fy-=ny*outward*weight*.86}if(distance<.12){fx-=nx*(.12-distance)*.7;fy-=ny*(.12-distance)*.7}}
  const ex=(x-core.x)/core.rx,ey=(y-core.y)/core.ry;const radius=Math.hypot(ex,ey);
  if(radius<1.12){const nx=ex/core.rx,ny=ey/core.ry,len=Math.hypot(nx,ny)||1;const pressure=(1.12-radius)*.65;fx+=nx/len*pressure;fy+=ny/len*pressure}
  const speed=1+p.depth*.55;p.vx+=(fx*speed-p.vx)*Math.min(1,h*1.7);p.vy+=(fy*speed-p.vy)*Math.min(1,h*1.7);
  p.x+=p.vx*h;p.y+=p.vy*h;
  // Resolve the outer enclosure and core repeatedly for corner robustness.
  for(let pass=0;pass<3;pass++){
   for(const [nx,ny]of normals){const penetration=p.x*nx+p.y*ny-.92;if(penetration>0){p.x-=nx*(penetration+1e-6);p.y-=ny*(penetration+1e-6);const vn=p.vx*nx+p.vy*ny;if(vn>0){p.vx-=1.45*vn*nx;p.vy-=1.45*vn*ny;hits++}}}
   const qx=(p.x-core.x)/core.rx,qy=(p.y-core.y)/core.ry,r=Math.hypot(qx,qy);
   if(r<1){const angle=r<1e-8?p.phase:Math.atan2(qy,qx);p.x=core.x+Math.cos(angle)*core.rx*1.00001;p.y=core.y+Math.sin(angle)*core.ry*1.00001;let nx=Math.cos(angle)/core.rx,ny=Math.sin(angle)/core.ry;const len=Math.hypot(nx,ny);nx/=len;ny/=len;const vn=p.vx*nx+p.vy*ny;if(vn<0){p.vx-=1.25*vn*nx;p.vy-=1.25*vn*ny}}
  }
 }

 return hits;
}
