import {readFileSync} from 'node:fs';
import {openTransport} from './transport.mjs';
const input=JSON.parse(readFileSync(0,'utf8'));
const t=openTransport(input.binding);
if(input.action==='send-exit')await t.send(()=>process.exit(0));
else if(input.action==='receive')t.receive(input.response);
else if(input.action==='apply')t.applyResponse();
console.log(JSON.stringify(t.inspect()));
