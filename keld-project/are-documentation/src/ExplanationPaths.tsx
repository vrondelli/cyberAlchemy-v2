import {GuidedWalkthrough} from './GuidedWalkthrough';
export function ExplanationPaths(){
 const mode=new URLSearchParams(location.search).get('explanation');
 return mode==='walkthrough' ? <GuidedWalkthrough/> : <div id="are-live-chat-host"/>;
}
