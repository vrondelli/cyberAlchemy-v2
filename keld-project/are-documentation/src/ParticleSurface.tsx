import {useEffect,useRef,useState} from 'react';
import {createParticleRenderer,type ParticleMessage} from './particleRenderer';
export function ParticleSurface({paused}:{paused:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 const [fallback,setFallback]=useState(false);
 const pauseRef=useRef(paused),wake=useRef<()=>void>(()=>{});
 useEffect(()=>{pauseRef.current=paused;wake.current()},[paused]);
 useEffect(()=>{
  const canvas=ref.current!,host=canvas.closest('.hero-sticky') as HTMLElement;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=true,disposed=false;
  let send:(message:ParticleMessage)=>void,dispose:()=>void;
  if(!fallback&&typeof Worker!=='undefined'&&canvas.transferControlToOffscreen){
   let worker:Worker|undefined,timer:number|undefined;
   const fail=()=>{if(!disposed){clearTimeout(timer);worker?.terminate();setFallback(true)}};
   // A fresh canvas is mounted after failure: a transferred one cannot regain a context.
   try{
    worker=new Worker(new URL('./particle-worker.ts',import.meta.url),{type:'module'});
    timer=window.setTimeout(fail,5000);
    worker.onmessage=({data})=>{if(disposed)return;if(data.type==='ready'){clearTimeout(timer);canvas.dataset.renderer='worker'}else if(data.type==='time')canvas.dataset.time=data.time.toFixed(3);else if(data.type==='failed')fail()};
    worker.onerror=event=>{event.preventDefault();fail()};
    const offscreen=canvas.transferControlToOffscreen();worker.postMessage({type:'init',canvas:offscreen},[offscreen]);
    send=message=>worker!.postMessage(message);dispose=()=>{clearTimeout(timer);worker!.terminate()};
   }catch{clearTimeout(timer);worker?.terminate();setFallback(true);return}
  }else{
   const renderer=createParticleRenderer(canvas,time=>{canvas.dataset.time=time.toFixed(3)});
   canvas.dataset.renderer='main';send=renderer.send;dispose=renderer.dispose;
  }
  const active=()=>!disposed&&!pauseRef.current&&!media.matches&&visible&&!document.hidden;
  const sync=()=>send({type:'active',value:active()});wake.current=sync;
  const resize=()=>{
   const rect=canvas.getBoundingClientRect(),width=rect.width,height=rect.height;
   if(width<1||height<1){send({type:'active',value:false});return}
   const visual=host.querySelector('.story-visual')!.getBoundingClientRect();
   const scaleX=width*.62,scaleY=height*.68;
   const core={x:0,y:Math.max(-.15,Math.min(.15,(visual.top+visual.height/2-rect.top-height/2)/scaleY)),rx:Math.min(.45,visual.width*.29/scaleX),ry:Math.min(.60,visual.height*.35/scaleY)};
   send({type:'resize',width,height,ratio:Math.min(devicePixelRatio||1,1.5),core});sync();
  };
  const move=(event:PointerEvent)=>{if(!active()||event.pointerType!=='mouse')return;const r=host.getBoundingClientRect();send({type:'pointer',x:(event.clientX-r.left)/r.width-.5,y:(event.clientY-r.top)/r.height-.5})};
  const leave=()=>send({type:'pointer',x:0,y:0});
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});intersection.observe(canvas);
  host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);resize();
  return()=>{disposed=true;dispose();wake.current=()=>{};observer.disconnect();intersection.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync)};
 },[fallback]);
 return <canvas key={String(fallback)} ref={ref} className="particle-depth-surface" aria-hidden="true"/>;
}
