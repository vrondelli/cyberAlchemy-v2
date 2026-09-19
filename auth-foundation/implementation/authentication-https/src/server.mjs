import http from 'node:http';
import net from 'node:net';
import {chmod,unlink,readFile} from 'node:fs/promises';
import {createApp} from './app.mjs';
process.chdir(new URL('..',import.meta.url).pathname);
const c=JSON.parse(await readFile('.runtime/config.json'));
const handler=await createApp(c);
const server=http.createServer((req,res)=>void handler(req,res));server.requestTimeout=5000;server.headersTimeout=5000;server.maxHeadersCount=40;
// Linux Unix socket addresses are length-limited; use this short path from our fixed cwd.
const socket='.runtime/socket/app.sock';
await new Promise((resolve,reject)=>{const probe=net.connect(socket);probe.on('connect',()=>{probe.destroy();reject(Error('HTTPS app already running'))});probe.on('error',async e=>{if(!['ENOENT','ECONNREFUSED'].includes(e.code))return reject(e);try{await unlink(socket)}catch(x){if(x.code!=='ENOENT')return reject(x)}resolve()})});
server.listen(socket,async()=>{await chmod(socket,0o660);console.log(`Auth Foundation HTTPS: ${c.origin}`)});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
