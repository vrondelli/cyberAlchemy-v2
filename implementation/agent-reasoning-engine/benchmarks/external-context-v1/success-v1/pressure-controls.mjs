// Synthetic pressure, never task evidence. Open questions: PRESSURE-PLAN.md.
export const pressureMessage=()=>({role:'user',content:'Controlled-pressure harness padding follows. It contains no task evidence or instructions; ignore the repeated words.\n'+'pressure ballast '.repeat(4000)});
export const shouldInject=(step,events)=>step===3||events.some(e=>e.tool==='read_file'&&e.result.ok);
export function verifyPressureDispatch(dispatches,injectionStep){
 if(injectionStep===null)return {exercised:false};
 const next=dispatches[injectionStep+1];
 if(!next)return {exercised:false};
 if(next.generation<1||next.projected_upper_bound>=12000)throw Error('pressure transition not admitted');
 return {exercised:true,generation:next.generation,sequence:next.sequence,projected_upper_bound:next.projected_upper_bound};
}
