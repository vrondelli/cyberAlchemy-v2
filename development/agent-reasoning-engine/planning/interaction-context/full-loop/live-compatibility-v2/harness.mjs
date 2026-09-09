import {PassThrough} from 'node:stream';
import {createInterface} from 'node:readline';
export const prompts = Object.freeze([
  'Explain context management. Include the word jargon.',
  'Avoid jargon. Explain context management plainly.',
  'Explain the context workflow again.',
  'For this response, include the word jargon.',
  'Explain the context workflow plainly.',
  'Explain context management one final time.',
]);
export function scoreOutput(index, text, status) {
  const available = typeof text === 'string' && text.trim().length > 0 && status === 'completed';
  const contains = typeof text === 'string' && /\bjargon\b/i.test(text);
  return {evaluator:'literal-jargon-canary/v1', available,
    passed:available && (index === 0 || index === 3 ? contains : !contains),
    expected:index === 0 || index === 3 ? 'includes-jargon' : 'excludes-jargon',
    claim_limit:'Literal compliance in one conversation; no semantic-quality proof.'};
}
export function createCanaryTransport(raw, wrapper, {onDispatch = () => {}, onServer = () => {}} = {}) {
  const input = new PassThrough(), output = new PassThrough(); let closing = false;
  let clientChain = Promise.resolve(), serverChain = Promise.resolve();
  const send = actions => {
    for (const message of actions.to_server) {if (message.method === 'turn/start') onDispatch(message); raw.input.write(JSON.stringify(message)+'\n');}
    for (const message of actions.to_client) output.write(JSON.stringify(message)+'\n');
  };
  const fail = error => {if (!closing) raw.failure.emit('failure',error);};
  const clientLines = createInterface({input}), serverLines = createInterface({input:raw.output});
  clientLines.on('line',line => {clientChain=clientChain.then(async()=>send(await wrapper.processClientMessage(JSON.parse(line)))).catch(fail);});
  serverLines.on('line',line => {serverChain=serverChain.then(async()=>{const message=JSON.parse(line);onServer(message);send(await wrapper.processServerMessage(message));}).catch(fail);});
  return {input,output,ready:raw.ready,failure:raw.failure,get_failure:raw.get_failure,
    close:async()=>{if(closing)return;closing=true;clientLines.close();serverLines.close();await raw.close();await Promise.allSettled([clientChain,serverChain]);wrapper.close();input.destroy();output.destroy();}};
}
