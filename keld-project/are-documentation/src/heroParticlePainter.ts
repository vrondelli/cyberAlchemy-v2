export type HeroParticle={x:number;y:number;r:number};
// Same 720-unit scene coordinates as the SVG diagrams. Only the decorative
// point cloud is rasterized; labels and interactive components remain DOM/SVG.
export function createHeroParticlePainter(canvas:HTMLCanvasElement,points:HeroParticle[]){
 const ctx=canvas.getContext('2d');let size=1;
 const draw=()=>{
  if(!ctx)return;ctx.clearRect(0,0,720,720);
  for(let bright=0;bright<2;bright++){
   ctx.fillStyle=bright?'#a5d1ff':'#688ebd';ctx.globalAlpha=bright ? 0.95 : 0.65;ctx.beginPath();
   for(let i=0;i<points.length;i++){if(Number(i%4===0)!==bright)continue;const p=points[i];ctx.moveTo(p.x+p.r,p.y);ctx.arc(p.x,p.y,p.r,0,Math.PI*2)}ctx.fill();
  }ctx.globalAlpha=1;
 };
 const resize=()=>{size=Math.max(1,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2)));canvas.width=size;canvas.height=size;ctx?.setTransform(size/720,0,0,size/720,0,0);draw()};
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {draw,dispose:()=>observer.disconnect()};
}
