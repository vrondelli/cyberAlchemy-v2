import {createParticleRenderer,type ParticleMessage} from './particleRenderer';
const scope=globalThis as unknown as {onmessage:((event:MessageEvent)=>void)|null;postMessage:(message:unknown)=>void};
let renderer:ReturnType<typeof createParticleRenderer>|undefined;
scope.onmessage=({data}:{data:ParticleMessage|{type:'init';canvas:OffscreenCanvas}})=>{
 try {
  if(data.type==='init'){renderer=createParticleRenderer(data.canvas,time=>scope.postMessage({type:'time',time}));scope.postMessage({type:'ready'})}
  else renderer?.send(data);
 }catch{scope.postMessage({type:'failed'})}
};
