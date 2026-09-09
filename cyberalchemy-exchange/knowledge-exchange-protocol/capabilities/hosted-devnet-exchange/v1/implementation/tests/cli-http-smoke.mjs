import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {Keypair} from '@solana/web3.js';
import {createAccount,openWorkspace} from '../cli/client.mjs';

const [apiBase,root]=process.argv.slice(2);if(!apiBase||!root)throw Error('usage: cli-http-smoke.mjs API_BASE TEMP_DIRECTORY');
await mkdir(root,{recursive:true,mode:0o700});const keypairPath=join(root,'keypair.json'),recoveryPath=join(root,'recovery.json'),pair=Keypair.generate();await writeFile(keypairPath,JSON.stringify([...pair.secretKey]),{mode:0o600});
const common={apiBase,keypairPath,recoveryPath,approve:async()=>true};const created=await createAccount(common),workspace=await openWorkspace(common);
const exchange={id:crypto.randomUUID(),title:'http-smoke.bin',file:new File([new Uint8Array([0,255,1,128])],'http-smoke.bin',{type:'application/octet-stream'}),policyAccepted:true,direction:'share',history:[]};workspace.exchanges.unshift(exchange);await workspace.session.upload(exchange,workspace.sync);
const status=await workspace.api(`/v1/files/${encodeURIComponent(exchange.context.artifactId)}`);
process.stdout.write(JSON.stringify({walletPublicKey:created.walletPublicKey,identityId:created.publicCard.identityId,artifactId:exchange.context.artifactId,originalBytes:status.original_bytes})+'\n');
