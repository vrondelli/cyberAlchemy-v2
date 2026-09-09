#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {acknowledgeReceipt,createAccount,openWorkspace,receiveFile,sendFile} from './client.mjs';
import {writePrivateJson} from './storage.mjs';

const args=process.argv.slice(2),command=args.shift(),subcommand=command==='account'?args.shift():null;
const take=name=>{const index=args.indexOf(name);if(index<0)return undefined;const value=args[index+1];if(!value||value.startsWith('--'))throw Error(`${name} requires a value.`);args.splice(index,2);return value;};
const flag=name=>{const index=args.indexOf(name);if(index<0)return false;args.splice(index,1);return true;};
const json=flag('--json'),apiBase=take('--api'),keypairPath=take('--keypair'),recoveryPath=take('--recovery');
const required=(value,label)=>{if(!value)throw Error(`Missing ${label}.`);return value;};
const effectApproval=async event=>{if(event.kind==='transaction'&&!globalThis.__kepTransactionsApproved)throw Error('Transaction approval missing.');return true;};
const base=()=>({apiBase:required(apiBase,'--api'),keypairPath:required(keypairPath,'--keypair'),recoveryPath:required(recoveryPath,'--recovery'),approve:effectApproval});
function output(value){process.stdout.write(JSON.stringify(value,null,json?0:2)+'\n');}
function help(){process.stdout.write(`KEP CLI\n\naccount create --api ORIGIN --keypair FILE --recovery FILE\nlogin --api ORIGIN --keypair FILE --recovery FILE\nidentity export --api ORIGIN --keypair FILE --recovery FILE --output FILE\nexchanges list --api ORIGIN --keypair FILE --recovery FILE\nsend FILE --to RECIPIENT.json --handoff-output FILE [--journal FILE] --api ORIGIN --keypair FILE --recovery FILE --accept-retention --approve-transactions\nreceive HANDOFF.json --output FILE --api ORIGIN --keypair FILE --recovery FILE --accept-retention\nacknowledge RECEIPT.json --api ORIGIN --keypair FILE --recovery FILE\n\nAn interrupted send resumes from its encrypted journal when the same command is repeated. Use --json for machine-readable output. Private keys and recovery material are never printed. Reissue is outside this first release.\n`);}
try{
 let result;
 if(command==='account'&&subcommand==='create')result=await createAccount({...base(),recoveryPath:required(recoveryPath,'--recovery')});
 else if(command==='login'){const workspace=await openWorkspace(base());result={authenticated:true,walletPublicKey:workspace.account.wallet,identityId:workspace.publicCard.identityId,exchanges:workspace.exchanges.length};}
 else if(command==='identity'&&args[0]==='export'){args.shift();const outputPath=required(take('--output'),'--output'),workspace=await openWorkspace(base());await writePrivateJson(outputPath,workspace.publicCard,{overwrite:flag('--overwrite')});result={identityId:workspace.publicCard.identityId,outputPath};}
 else if(command==='exchanges'&&args[0]==='list'){args.shift();const workspace=await openWorkspace(base());result=workspace.exchanges.map(({id,title,direction,context,history,receipt})=>({id,title,direction,artifactId:context?.artifactId,history,acknowledged:!!receipt}));}
 else if(command==='send'){const filePath=required(args.shift(),'file path'),recipientPath=required(take('--to'),'--to'),handoffPath=required(take('--handoff-output'),'--handoff-output'),journalPath=take('--journal');globalThis.__kepTransactionsApproved=flag('--approve-transactions');result=await sendFile({...base(),filePath,recipientPath,handoffPath,journalPath,acceptRetention:flag('--accept-retention'),approveTransactions:globalThis.__kepTransactionsApproved,overwrite:flag('--overwrite')});}
 else if(command==='receive'){const handoffPath=required(args.shift(),'handoff path'),outputPath=required(take('--output'),'--output');result=await receiveFile({...base(),handoffPath,outputPath,acceptRetention:flag('--accept-retention'),overwrite:flag('--overwrite')});}
 else if(command==='acknowledge'){const receiptPath=required(args.shift(),'receipt path');result=await acknowledgeReceipt({...base(),receiptPath});}
 else if(command==='--help'||command==='help'){help();}
 else {help();process.exitCode=command?2:0;}
 if(args.length)throw Error(`Unknown arguments: ${args.join(' ')}`);if(result!==undefined)output(result);
}catch(error){process.stderr.write(`KEP: ${error.message}\n`);process.exitCode=1;}
