import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createRepository} from '../src/repository.mjs';

const states=new Set(['all','queued','processing','review','succeeded']);
const orderStates=new Set(['queued','processing','review','succeeded']);
const providers=new Set(['stripe','mercadopago','paypal']);
const safeInt=value=>Number.isSafeInteger(value)&&value>=0;
const optionalInt=value=>value===null||safeInt(value);
const invalid=()=>{throw new Error('refund-inspection-response-invalid');};

export class UsageError extends Error {}

export function projectInspection(result){
  if(!result||typeof result!=='object'||!result.counts||typeof result.counts!=='object'||
    !Array.isArray(result.orders)||result.orders.length>20||
    !['queued','processing','review','succeeded'].every(state=>safeInt(result.counts[state]))||
    !['total','due','deferred','expiredLeases'].every(field=>safeInt(result[field]))||
    !optionalInt(result.nextAttempt)||!optionalInt(result.next))invalid();
  const orders=result.orders.map(row=>{
    if(!row||typeof row!=='object'||!safeInt(row.cursor)||
      typeof row.orderId!=='string'||!/^[a-f0-9]{32}$/.test(row.orderId)||
      !orderStates.has(row.state)||!providers.has(row.provider)||
      !['createdAt','attempts','generation','leaseUntil','nextAttempt'].every(field=>safeInt(row[field]))||
      !optionalInt(row.commandStartedAt)||
      !(row.lastReason===null||typeof row.lastReason==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(row.lastReason))||
      ![0,1].includes(row.fullRefundRecorded)||!safeInt(row.reversalReviewCount))invalid();
    return {cursor:row.cursor,orderId:row.orderId,state:row.state,provider:row.provider,
      createdAt:row.createdAt,attempts:row.attempts,generation:row.generation,
      leaseUntil:row.leaseUntil,nextAttempt:row.nextAttempt,commandStartedAt:row.commandStartedAt,
      lastReason:row.lastReason,fullRefundRecorded:Boolean(row.fullRefundRecorded),
      reversalReviewCount:row.reversalReviewCount};
  });
  return {ok:true,mode:'sandbox',counts:{queued:result.counts.queued,processing:result.counts.processing,
    review:result.counts.review,succeeded:result.counts.succeeded},total:result.total,
    due:result.due,deferred:result.deferred,expiredLeases:result.expiredLeases,
    nextAttempt:result.nextAttempt,orders,next:result.next};
}

export async function inspectRefunds(argv,{load=loadConfig,repositoryFactory=createRepository,
  clock=()=>Math.floor(Date.now()/1000)}={}){
  const [path,state='all',cursor='0',...extra]=argv;
  if(!path||extra.length||!states.has(state)||!/^(0|[1-9]\d*)$/.test(cursor)||
    !Number.isSafeInteger(Number(cursor)))throw new UsageError('invalid-arguments');
  const now=clock();
  if(!safeInt(now))invalid();
  const {integration}=await load(path,{requireCurrentQuote:false,role:'worker'});
  const result=await repositoryFactory(integration.ledger)('refund-inspect',{
    state,after:Number(cursor),now,
  });
  return projectInspection(result);
}

export function inspectionError(error){
  return error instanceof ConfigurationError?
    {ok:false,error:'configuration-invalid',issues:error.issues}:
    {ok:false,error:'refund-inspection-failed'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await inspectRefunds(process.argv.slice(2))));}
  catch(error){
    if(error instanceof UsageError)console.error('Usage: node bin/inspect-refunds.mjs <config.json> [all|queued|processing|review|succeeded] [after-cursor]');
    else console.error(JSON.stringify(inspectionError(error)));
    process.exitCode=1;
  }
}
