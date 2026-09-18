import {useEffect,useRef} from 'react';
import {createFlow,advanceFlow,type FlowParticle} from './particle-flow.mjs';

export function ParticleSurface({paused}:{paused:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 const pauseRef=useRef(paused);
 const wake=useRef<()=>void>(()=>{});
 useEffect(()=>{pauseRef.current=paused;wake.current()},[paused]);
 useEffect(()=>{
  const canvas=ref.current!;const ctx=canvas.getContext('2d');if(!ctx)return;
  const host=canvas.closest('.hero-sticky') as HTMLElement;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,frame=0,last=0,time=0,visible=true,disposed=false;
  let targetX=0,targetY=0,cameraX=0,cameraY=0;
  let particles:FlowParticle[]=[];let centerX=0,centerY=0,scaleX=1,scaleY=1;
  let core={x:0,y:0,rx:.3,ry:.48};
  const active=()=>!disposed&&!pauseRef.current&&!media.matches&&visible&&!document.hidden;
  const draw=()=>{
   ctx.clearRect(0,0,width,height);
   for(const p of particles){
    const depth=p.depth;const parallax=.3+depth*.7;
    const project=(x:number,y:number)=>[centerX+x*scaleX+cameraX*10*parallax,centerY+y*scaleY+cameraY*7*parallax];
    const [x,y]=project(p.x,p.y);
    let clearance=1;for(let face=0;face<6;face++)clearance=Math.min(clearance,.92-p.x*Math.cos(face*Math.PI/3)-p.y*Math.sin(face*Math.PI/3));
    const edgeFade=.18+.82*Math.min(1,Math.max(0,clearance)/.13);
    const alpha=(.16+depth*.43)*edgeFade;

    ctx.fillStyle=`rgba(151,204,255,${alpha})`;ctx.beginPath();ctx.arc(x,y,.65+depth*1.3,0,Math.PI*2);ctx.fill();
   }
   canvas.dataset.time=time.toFixed(3);
  };
  const tick=(now:number)=>{
   frame=0;if(!active()){last=0;return}
   if(!last||now-last>=32){const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt;advanceFlow(particles,dt,time,core);cameraX+=(targetX-cameraX)*.06;cameraY+=(targetY-cameraY)*.06;draw()}
   frame=requestAnimationFrame(tick);
  };
  const sync=()=>{if(!active()){cancelAnimationFrame(frame);frame=0;last=0;draw()}else if(!frame){last=0;frame=requestAnimationFrame(tick)}};
  wake.current=sync;
  const resize=()=>{
   const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
   if(width<1||height<1){sync();return}
   const visual=host.querySelector('.story-visual')!.getBoundingClientRect();
   centerX=width/2;centerY=height/2;scaleX=width*.62;scaleY=height*.68;
   core={x:0,y:Math.max(-.15,Math.min(.15,(visual.top+visual.height/2-rect.top-centerY)/scaleY)),rx:Math.min(.45,visual.width*.29/scaleX),ry:Math.min(.60,visual.height*.35/scaleY)};
   particles=createFlow(width<500?360:1100,core);
   const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));ctx.setTransform(ratio,0,0,ratio,0,0);draw();sync();
  };
  const move=(event:PointerEvent)=>{if(!active()||event.pointerType!=='mouse')return;const r=host.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5};
  const leave=()=>{targetX=0;targetY=0};
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});intersection.observe(canvas);
  host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);resize();
  return()=>{disposed=true;cancelAnimationFrame(frame);wake.current=()=>{};observer.disconnect();intersection.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync)};
 },[]);
 return <canvas ref={ref} className="particle-depth-surface" aria-hidden="true"/>;
}
