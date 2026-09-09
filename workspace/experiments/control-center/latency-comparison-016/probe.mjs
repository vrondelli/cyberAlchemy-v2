// Serialized into the test webview. It reads timing/state only, never content.
export function installProbe() {
  if (window.__WLC016__) return;
  const frames=[],timers=[],visibility=[],longTasks=[];
  const limit=4096;
  const push=(rows,row)=>{if(rows.length<limit)rows.push(row);};
  let lastFrame=performance.now(),lastTimer=lastFrame;
  const startedAt=lastFrame;
  let frameId,timerId,observer;
  const frame=()=>{const now=performance.now();push(frames,{at:now,gap:now-lastFrame,visibility:document.visibilityState});lastFrame=now;frameId=requestAnimationFrame(frame);};
  frameId=requestAnimationFrame(frame);
  timerId=setInterval(()=>{const now=performance.now();push(timers,{at:now,gap:now-lastTimer});lastTimer=now;},20);
  const changed=()=>push(visibility,{at:performance.now(),state:document.visibilityState});
  document.addEventListener('visibilitychange',changed);changed();
  const longTaskSupported=typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask');
  if(longTaskSupported){observer=new PerformanceObserver(list=>{for(const e of list.getEntries())push(longTasks,{at:e.startTime,duration:e.duration});});observer.observe({type:'longtask',buffered:true});}
  window.__WLC016__={finish(){
    cancelAnimationFrame(frameId);clearInterval(timerId);observer?.disconnect();document.removeEventListener('visibilitychange',changed);
    return {startedAt,endedAt:performance.now(),timeOrigin:performance.timeOrigin,frames,timers,visibility,longTasks,longTaskSupported:!!longTaskSupported,
      capped:frames.length===limit||timers.length===limit||longTasks.length===limit,
      samples:window.__CA2_PERFORMANCE_SAMPLES__??[],resources:performance.getEntriesByType('resource').map(e=>({name:e.name,start:e.startTime,duration:e.duration})),
      coverage:'webdriver-attachment-to-capture; not native pre-attachment startup',evidence_mode:'instrumented-diagnostic',authority_effect:'none'};
  }};
}
