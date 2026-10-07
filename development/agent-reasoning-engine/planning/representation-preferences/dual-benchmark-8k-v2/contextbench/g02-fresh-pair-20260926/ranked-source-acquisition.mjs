// Keep R2c ranking unchanged; bound only its initial problem-statement primer.
// Long ContextBench statements otherwise fail before the first model call.
import {createRankedSourceAcquisition as createBase, rankSourcesTool} from './ranked-source-acquisition-base.mjs';

export {rankSourcesTool};

export function boundedPrimer(text,maximumBytes=1024){
  if(typeof text!=='string'||!text.length)throw Error('ranked-source.invalid-problem');
  const cleaned=text.replace(/<!--[\s\S]*?-->/g,' ').replace(/https?:\/\/\S+/g,' ').trim();
  const source=cleaned||text;
  let output='';
  for(const character of source){
    if(Buffer.byteLength(output+character)>maximumBytes)break;
    output+=character;
  }
  if(!output)throw Error('ranked-source.empty-primer');
  return output;
}

export function createRankedSourceAcquisition(options){
  return createBase({...options,problem_statement:boundedPrimer(options.problem_statement)});
}
