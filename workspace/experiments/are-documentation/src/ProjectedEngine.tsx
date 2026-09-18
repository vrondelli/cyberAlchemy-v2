const asset=(name:string)=>`/assets/cyber-engine/${name}.png`;
export function ProjectedEngine(){return <div className="projected-engine hero-hologram" aria-hidden="true">
  <div className="generated-assembly-parts">
    <img className="generated-part generated-base" data-part="crankcase" src={asset('base')} alt="" width="1254" height="1254"/>
    <img className="generated-part generated-block" data-part="cylinder-block" src={asset('block')} alt="" width="1254" height="1254"/>
    <img className="generated-part generated-intake" data-part="intake" src={asset('intake')} alt="" width="1254" height="1254"/>
  </div>
  <img className="generated-engine" src={asset('assembled')} alt="" width="1254" height="1254" fetchPriority="high"/>
  <svg className="projection-field" viewBox="0 0 720 720">
    <defs><linearGradient id="projection-light" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#80dfff" stopOpacity=".65"/><stop offset=".45" stopColor="#4ab5ff" stopOpacity=".12"/><stop offset="1" stopColor="#4ab5ff" stopOpacity=".015"/></linearGradient></defs>
    <g className="projector-beam"><path className="beam-volume" d="M354 410L241 286Q360 257 479 286L366 410Z"/>{[255,288,322,360,398,432,465].map(x=><path className="beam-ray" key={x} d={`M360 410L${x} 287`}/>)}<ellipse cx="360" cy="287" rx="118" ry="22"/></g>
    <g className="projector-emitter"><ellipse cx="360" cy="410" rx="17" ry="6"/><ellipse className="emitter-halo" cx="360" cy="410" rx="27" ry="10"/></g>
  </svg>
  <div className="projected-brain"><img src={asset('brain')} alt="" width="1254" height="1254"/><div className="brain-scanline"/></div>
</div>}
