// Native trajectory coverage is cumulative in pinned metrics/compute.py.
// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
export function diagnoseAcquisitionCommitment(native){
 const steps=native?.trajectory?.steps;
 if(!Array.isArray(steps)||!native?.final)throw Error('commitment.invalid-native-shape');
 const check=x=>{if(!Number.isFinite(x)||x<0||x>1)throw Error('commitment.invalid-coverage');return x;};
 const result={};
 for(const kind of ['file','span']){
  let acquired=0;
  for(const step of steps){
   const current=check(step.coverage?.[kind]);
   if(current+1e-12<acquired)throw Error('commitment.non-cumulative-native-view');
   acquired=current;
  }
  const final=check(native.final[kind]?.coverage);
  if(final>acquired+1e-12)throw Error('commitment.final-outside-observed-view');
  result[kind]={acquired_coverage:acquired,final_coverage:final,
   unacquired_coverage:1-acquired,acquired_but_unselected_coverage:Math.max(0,acquired-final),
   retained_fraction_of_acquired:acquired?final/acquired:null};
 }
 return result;
}
