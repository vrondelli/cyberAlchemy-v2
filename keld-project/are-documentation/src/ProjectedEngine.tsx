import {responsive} from './heroAssets';
export function ProjectedEngine(){return <div className="projected-engine hero-hologram" aria-hidden="true">
  <div className="generated-assembly-parts">
    <img className="generated-part generated-base" data-part="crankcase" {...responsive('base')} alt="" width="768" height="768" decoding="async" loading="lazy" fetchPriority="low"/>
    <img className="generated-part generated-block" data-part="cylinder-block" {...responsive('block')} alt="" width="768" height="768" decoding="async" loading="lazy" fetchPriority="low"/>
    <img className="generated-part generated-intake" data-part="intake" {...responsive('intake')} alt="" width="768" height="768" decoding="async" loading="lazy" fetchPriority="low"/>
  </div>
  <img className="generated-engine" {...responsive('assembled')} alt="" width="768" height="768" decoding="async" loading="lazy"/>
  <svg className="projection-field" viewBox="0 0 720 720">
    <defs><linearGradient id="projection-light" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#80dfff" stopOpacity=".65"/><stop offset=".45" stopColor="#4ab5ff" stopOpacity=".12"/><stop offset="1" stopColor="#4ab5ff" stopOpacity=".015"/></linearGradient></defs>
    <g className="projector-beam"><path className="beam-volume" d="M354 410L241 286Q360 257 479 286L366 410Z"/>{[255,288,322,360,398,432,465].map(x=><path className="beam-ray" key={x} d={`M360 410L${x} 287`}/>)}<ellipse cx="360" cy="287" rx="118" ry="22"/></g>
    <g className="projector-emitter"><ellipse cx="360" cy="410" rx="17" ry="6"/><ellipse className="emitter-halo" cx="360" cy="410" rx="27" ry="10"/></g>
  </svg>
  <div className="projected-brain"><img {...responsive('brain')} alt="" width="768" height="768" decoding="async" loading="lazy" fetchPriority="low"/><div className="brain-scanline"/></div>
</div>}
