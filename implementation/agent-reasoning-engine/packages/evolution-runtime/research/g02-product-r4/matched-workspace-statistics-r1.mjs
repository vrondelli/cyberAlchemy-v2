// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
export function mean(values){
 if(!values.length||values.some(x=>!Number.isFinite(x)))throw Error('statistics.invalid-values');
 return values.reduce((a,b)=>a+b,0)/values.length;
}
export function f1(metric){
 const {coverage,precision}=metric;
 if(![coverage,precision].every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw Error('statistics.invalid-metric');
 return coverage+precision?2*coverage*precision/(coverage+precision):0;
}
// Exact one-sided paired sign-flip diagnostic. Exposed/adaptive data cannot
// qualify a superiority claim, regardless of this diagnostic's p-value.
export function signFlipPValue(differences){
 if(!differences.length||differences.length>20||differences.some(x=>!Number.isFinite(x)))throw Error('statistics.invalid-pairs');
 const observed=differences.reduce((a,b)=>a+b,0);let count=0;
 for(let mask=0;mask<2**differences.length;mask++){
  const sum=differences.reduce((a,x,i)=>a+(mask&(1<<i)?x:-x),0);
  if(sum>=observed-1e-12)count++;
 }
 return count/2**differences.length;
}
