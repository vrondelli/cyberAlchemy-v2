import {GuidedWalkthrough} from './GuidedWalkthrough';
import {LiveChat} from './LiveChat';
export function ExplanationPaths(){
 const mode=new URLSearchParams(location.search).get('explanation');
 return mode==='walkthrough' ? <GuidedWalkthrough/> : <LiveChat/>;
}
