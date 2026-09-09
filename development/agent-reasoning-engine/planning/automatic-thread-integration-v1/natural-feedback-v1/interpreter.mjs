export const preferences=Object.freeze({examples:'Include a concrete example when explaining a concept.',concise:'Keep explanations concise.',plain:'Use plain language and explain necessary technical terms.'});
const phrases=new Map([
 ['include examples','examples'],['use examples','examples'],['keep explanations concise','concise'],['keep it short','concise'],['use plain language','plain'],['avoid jargon','plain'],
]);
export function interpret(text){
 if(typeof text!=='string'||text.length>16384)return {kind:'none'};
 const normalized=text.trim().toLowerCase().replace(/[.!]$/,'');
 // Whole-input matching keeps quotations, conditionals, negation and extra instructions out.
 if(normalized==='pause learning')return {kind:'control',mode:'off'};
 if(normalized==='resume learning')return {kind:'control',mode:'apply-scoped'};
 if(normalized==='remember that preference'||normalized==='make that my preference')return {kind:'confirm'};
 if(["that's too technical",'that’s too technical','that is too technical','this is too technical'].includes(normalized))return {kind:'pending',preference:'plain'};
 const persistent=/^(?:from now on|going forward|in future answers),? (.+)$/.exec(normalized);
 if(persistent&&phrases.has(persistent[1]))return {kind:'persistent',preference:phrases.get(persistent[1])};
 const once=/^(?:for this answer|just this time),? (.+)$/.exec(normalized);
 if(once&&phrases.has(once[1]))return {kind:'once',preference:phrases.get(once[1])};
 if(once&&once[1]==='use technical detail')return {kind:'once',preference:null,instruction:'Use technical detail for this response.'};
 if(phrases.has(normalized))return {kind:'once',preference:phrases.get(normalized)};
 return {kind:'none'};
}
