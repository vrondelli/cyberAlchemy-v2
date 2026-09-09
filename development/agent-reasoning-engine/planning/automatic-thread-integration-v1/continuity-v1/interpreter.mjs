export const preferences=Object.freeze({
 examples:'Include a concrete example when explaining a concept.',
 concise:'Keep explanations concise.',
 plain:'Use plain language and explain necessary technical terms.'
});
const phrases=new Map([
 ['include examples','examples'],['use examples','examples'],
 ['give an example','examples'],['give a concrete example','examples'],['include a concrete example','examples'],
 ['keep explanations concise','concise'],['keep it short','concise'],
 ['keep it brief','concise'],['keep answers short','concise'],['be concise','concise'],
 ['use plain language','plain'],['avoid jargon','plain'],
 ['use simple language','plain'],['explain in simple terms','plain']
]);
const corrections=new Map([
 ["that's too technical",'plain'],['that is too technical','plain'],['this is too technical','plain'],
 ['that answer was too technical','plain'],['that was too much jargon','plain'],
 ["that's too long",'concise'],['that answer was too long','concise'],['that was too verbose','concise'],
 ['that needed an example','examples'],['that answer needed a concrete example','examples']
]);
function polite(text){return text.replace(/^please /,'').replace(/, please$/,'');}
function request(text){
 const preference=phrases.get(polite(text));
 return preference?{kind:'once',preference}:{kind:'none'};
}
export function interpret(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>16384)return {kind:'none'};
 // Normalize spelling presentation only. Never remove quotation, negation, or clauses.
 const normalized=text.trim().toLowerCase().replace(/’/g,"'").replace(/[.!]$/,'');
 const direct=polite(normalized);
 if(direct==='pause learning')return {kind:'control',mode:'off'};
 if(direct==='resume learning')return {kind:'control',mode:'apply-scoped'};
 if(direct==='remember that preference'||direct==='make that my preference')return {kind:'confirm'};
 if(corrections.has(direct))return {kind:'pending',preference:corrections.get(direct)};
 const future=/^(?:from now on|going forward|in future answers),? (.+)$/.exec(direct)
   ?? /^(.+?) (?:from now on|going forward|in future answers)$/.exec(direct)
   ?? /^(?:always|remember to) (.+)$/.exec(direct);
 if(future){
  const preference=phrases.get(polite(future[1]));
  return preference?{kind:'persistent',preference}:{kind:'none'};
 }
 const once=/^(?:for this answer|for this response|just this time),? (.+)$/.exec(direct);
 if(once){
  if(polite(once[1])==='use technical detail')return {kind:'once',preference:null,instruction:'Use technical detail for this response.'};
  return request(once[1]);
 }
 // Only allowlisted current requests are accepted as questions, never retention or controls.
 const question=/^(?:can you|could you) (.+?)\?$/.exec(direct);
 return request(question?question[1]:direct);
}
