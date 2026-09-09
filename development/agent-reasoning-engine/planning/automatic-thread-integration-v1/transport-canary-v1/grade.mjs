export function grade(text,expected){
 try{
  const normalized=text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  const value=JSON.parse(normalized);
  return {ok:typeof value.explanation==='string'&&value.explanation.trim().length>0&&value.source_digest===expected,value};
 }catch{return {ok:false,reason:'response-not-json'};}
}
