// Stylized V12 architecture, not a dimensionally accurate engine model.
const project=(x:number,y:number,z:number)=>[360+x*.92+z*.55,438-y*.85+z*.23];
const point=(x:number,y:number,z:number)=>project(x,y,z).join(',');
function Box({x0,x1,y0,y1,z0,z1}:{x0:number;x1:number;y0:number;y1:number;z0:number;z1:number}){
 return <><polygon points={[point(x0,y1,z0),point(x1,y1,z0),point(x1,y1,z1),point(x0,y1,z1)].join(' ')}/><polygon points={[point(x0,y0,z1),point(x1,y0,z1),point(x1,y1,z1),point(x0,y1,z1)].join(' ')}/><path d={`M${point(x1,y1,z0)}L${point(x1,y0,z0)}L${point(x1,y0,z1)}M${point(x0,y1,z0)}L${point(x0,y0,z0)}L${point(x0,y0,z1)}L${point(x0,y1,z1)}`}/></>
}
function Bank({side}:{side:number}){return <g className="cylinder-bank" data-bank={side<0?'left':'right'}>{Array.from({length:6},(_,i)=>{const z=-105+i*42;const [x,y]=project(side*66,119,z);return <g className="engine-cylinder" key={i}><ellipse cx={x} cy={y} rx="19" ry="11"/><ellipse cx={x} cy={y} rx="13" ry="7"/><path d={`M${x-19},${y}L${point(side*27-16,48,z)}M${x+19},${y}L${point(side*27+16,48,z)}M${x},${y+6}L${point(side*15,26,z)}`}/></g>})}</g>}
function Cover({side}:{side:number}){return <><Box x0={side*66-26} x1={side*66+26} y0={122} y1={147} z0={-133} z1={133}/>{[-10,0,10].map(offset=><path key={offset} d={`M${point(side*66+offset,149,-119)}L${point(side*66+offset,149,119)}`}/>)}{[-116,116].map(z=>{const [cx,cy]=project(side*66,150,z);return <circle key={z} cx={cx} cy={cy} r="3"/>})}</>}
export function EngineAssembly(){return <svg className="engine-assembly hero-hologram" viewBox="0 0 720 720" aria-hidden="true">
  <defs><linearGradient id="assembly-metal" x1="0" x2="1" y2="1"><stop stopColor="#9bc5ee"/><stop offset=".48" stopColor="#e5f1ff"/><stop offset="1" stopColor="#4d84b7"/></linearGradient><radialGradient id="brain-mist"><stop stopColor="#3f9eff" stopOpacity=".015"/><stop offset="1" stopColor="#3f9eff" stopOpacity=".12"/></radialGradient></defs>
  <g className="assembly-guides"><path d="M360 150v430M185 370h350"/><path d={`M${point(0,0,-190)}L${point(0,0,190)}`}/></g>
  <g className="assembly-part assembly-base" data-part="crankcase"><Box x0={-62} x1={62} y0={0} y1={43} z0={-144} z1={144}/><Box x0={-49} x1={49} y0={-22} y1={0} z0={-131} z1={131}/>{[-120,-80,-40,0,40,80,120].map(z=><path key={z} d={`M${point(-62,38,z)}L${point(-62,4,z)}M${point(62,38,z)}L${point(62,4,z)}`}/>)}</g>
  <g className="assembly-part assembly-shaft" data-part="crankshaft"><path d={`M${point(0,34,-165)}L${point(0,34,176)}M${point(8,34,-165)}L${point(8,34,176)}`}/>{[-112,-70,-28,14,56,98].map((z,i)=>{const [cx,cy]=project(0,34,z);return <g key={z}><ellipse cx={cx} cy={cy} rx="12" ry="18"/><path d={`M${cx} ${cy-15}l${i%2?16:-16} -10v20`}/></g>})}<ellipse cx={project(0,34,176)[0]} cy={project(0,34,176)[1]} rx="24" ry="29"/></g>
  <g className="assembly-part assembly-lower" data-part="left-cylinder-bank"><Bank side={-1}/></g>
  <g className="assembly-part assembly-upper" data-part="right-cylinder-bank"><Bank side={1}/></g>
  <g className="assembly-part assembly-left" data-part="left-cam-cover"><Cover side={-1}/></g>
  <g className="assembly-part assembly-right" data-part="right-cam-cover"><Cover side={1}/></g>
  <g className="assembly-part assembly-cap" data-part="intake-manifold"><Box x0={-28} x1={28} y0={166} y1={184} z0={-117} z1={117}/>{Array.from({length:6},(_,i)=>{const z=-105+i*42;return <g key={i}>{[-1,1].map(side=><path key={side} d={`M${point(side*24,170,z)}Q${point(side*48,181,z)} ${point(side*65,148,z)}M${point(side*24,163,z+8)}Q${point(side*48,174,z+8)} ${point(side*65,141,z+8)}`}/>)}</g>})}<path d={`M${point(-24,176,119)}L${point(-24,176,154)}L${point(24,176,154)}L${point(24,176,119)}`}/></g>
  <g className="brain-envelope">
    <path className="brain-volume brain-left" d="M351 174C321 148 276 163 260 192C218 190 191 226 195 262C154 284 151 322 169 348C145 391 166 427 195 441C182 484 219 519 254 517C269 554 315 554 349 524C357 465 353 233 351 174Z"/>
    <path className="brain-volume brain-right" d="M369 174C399 148 444 163 460 192C502 190 529 226 525 262C566 284 569 322 551 348C575 391 554 427 525 441C538 484 501 519 466 517C451 554 405 554 371 524C363 465 367 233 369 174Z"/>
    <g className="brain-folds"><path d="M260 192c-20 42 17 62 48 39s38-19 43-3M195 262c27-23 57-9 61 17s38 32 61 4M169 348c39-24 53 17 82 9s17-43 49-40M195 441c22-31 63-7 68-46s46-44 83-17M254 517c-20-41 17-72 48-57s33 47 47 30M460 192c20 42-17 62-48 39s-38-19-43-3M525 262c-27-23-57-9-61 17s-38 32-61 4M551 348c-39-24-53 17-82 9s-17-43-49-40M525 441c-22-31-63-7-68-46s-46-44-83-17M466 517c20-41-17-72-48-57s-33 47-47 30"/></g>
    <g className="brain-latitudes">{[235,290,345,400,455,495].map((y,i)=><ellipse key={y} cx="360" cy={y} rx={[129,170,189,177,151,107][i]} ry="20"/>)}</g>
  </g>
</svg>}
