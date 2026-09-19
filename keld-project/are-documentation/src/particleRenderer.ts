import {createFlow,advanceFlow,type FlowParticle,type Core} from './particle-flow.mjs';
const boundaryNormals=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
export type ParticleMessage = {type:'resize';width:number;height:number;ratio:number;core:Core}|{type:'active';value:boolean}|{type:'pointer';x:number;y:number};
// Shared renderer keeps worker and compatibility paths visually identical.
export function createParticleRenderer(canvas:HTMLCanvasElement|OffscreenCanvas,report:(time:number)=>void){
 const ctx=canvas.getContext('2d') as CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|null;
 if(!ctx)throw new Error('Particle canvas context unavailable');
 let width=1,height=1,frame=0,last=0,time=0,running=false;
 let targetX=0,targetY=0,cameraX=0,cameraY=0;
 let particles:FlowParticle[]=[];let centerX=0,centerY=0,scaleX=1,scaleY=1;
 let core:Core={x:0,y:0,rx:.3,ry:.48};
  const draw=()=>{
   ctx.clearRect(0,0,width,height);
   // Batch equal-opacity dots instead of submitting 1,100 separate fills.
   // Quantization changes alpha by at most 1/64; positions and radii stay exact.
   const paths=Array.from({length:33},()=>new Path2D());
   for(const p of particles){
    const depth=p.depth;const parallax=.3+depth*.7;
    const x=centerX+p.x*scaleX+cameraX*10*parallax,y=centerY+p.y*scaleY+cameraY*7*parallax;
    let clearance=1;for(let face=0;face<6;face++)clearance=Math.min(clearance,.92-p.x*boundaryNormals[face][0]-p.y*boundaryNormals[face][1]);
    const edgeFade=.18+.82*Math.min(1,Math.max(0,clearance)/.13);
    const alpha=(.16+depth*.43)*edgeFade;

    const path=paths[Math.round(alpha*32)],radius=.65+depth*1.3;
    path.moveTo(x+radius,y);path.arc(x,y,radius,0,Math.PI*2);
   }
   ctx.fillStyle='#97ccff';
   for(let i=1;i<paths.length;i++){ctx.globalAlpha=i/32;ctx.fill(paths[i]);}ctx.globalAlpha=1;
   report(time);
  };
  const tick=(now:number)=>{
   frame=0;if(!running){last=0;return}
   if(!last||now-last>=32){const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt;advanceFlow(particles,dt,time,core);cameraX+=(targetX-cameraX)*.06;cameraY+=(targetY-cameraY)*.06;draw()}
   frame=requestAnimationFrame(tick);
  };
  const sync=()=>{if(!running){cancelAnimationFrame(frame);frame=0;last=0;draw()}else if(!frame){last=0;frame=requestAnimationFrame(tick)}};

 return {send(message:ParticleMessage){
  if(message.type==='active'){running=message.value;sync()}
  else if(message.type==='pointer'){targetX=message.x;targetY=message.y}
  else {({width,height,core}=message);centerX=width/2;centerY=height/2;scaleX=width*.62;scaleY=height*.68;
   particles=createFlow(width<500?360:1100,core);
   canvas.width=Math.max(1,Math.round(width*message.ratio));canvas.height=Math.max(1,Math.round(height*message.ratio));ctx.setTransform(message.ratio,0,0,message.ratio,0,0);draw();sync();
  }
 },dispose(){running=false;cancelAnimationFrame(frame)}};
}
