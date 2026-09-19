export type Scenario = {title:string;steps:[string,string,string]};
const glyphs=['M5 5h14M5 12h14M5 19h9','M4 12h16M13 5l7 7-7 7','M5 12l4 4L19 6'];
export function ScenarioGraph({scenario,active=true}:{scenario:Scenario;active?:boolean}){
  return <figure className={`scenario-graph ${active?'checkpoint-active':''}`} aria-label={scenario.title}>
    <figcaption>{scenario.title}</figcaption>
    <ol>{scenario.steps.map((step,i)=><li key={i}>
      <span className="scenario-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={glyphs[i]}/></svg></span>
      <span>{step}</span>{i<2&&<span className="scenario-arrow" aria-hidden="true">→</span>}
    </li>)}</ol>
  </figure>;
}
