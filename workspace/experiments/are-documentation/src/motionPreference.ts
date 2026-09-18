import {useEffect,useState,useSyncExternalStore,type RefObject} from 'react';
const key='are.motion.paused.v1';
let paused=false;
try{paused=sessionStorage.getItem(key)==='true'}catch{/* Session storage is optional. */}
const listeners=new Set<()=>void>();
function subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener)}}
export function setMotionPaused(value:boolean){paused=value;try{sessionStorage.setItem(key,String(value))}catch{}listeners.forEach(fn=>fn())}
export function useMotionPreference(){
 const userPaused=useSyncExternalStore(subscribe,()=>paused,()=>false);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(media.matches);media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
 return {userPaused,reduced,paused:userPaused||reduced,setPaused:setMotionPaused,toggle:()=>setMotionPaused(!paused)};
}
export function useIllustrationActivity(ref:RefObject<HTMLElement|null>,enabled=true){
 const motion=useMotionPreference();const [visible,setVisible]=useState(false),[foreground,setForeground]=useState(()=>!document.hidden);
 useEffect(()=>{const host=ref.current;if(!host)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.1});observer.observe(host);const sync=()=>setForeground(!document.hidden);document.addEventListener('visibilitychange',sync);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync)}},[ref]);
 return {...motion,running:enabled&&visible&&foreground&&!motion.paused};
}
// Preserve the playhead across pauses; no scheduled work while the scene is suspended.
export function useIllustrationPhase(running:boolean,steps:number,stepMs=1800){
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{if(!running)return;let previous=performance.now();const timer=setInterval(()=>{const now=performance.now();const delta=now-previous;previous=now;setElapsed(t=>t+Math.min(delta,300))},150);return()=>clearInterval(timer)},[running]);
 return {phase:Math.floor(elapsed/stepMs)%steps,elapsed};
}
