import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(!['contextbench','longmemeval'].includes(config.benchmark))throw Error('unsupported benchmark');
const module=await import(config.benchmark==='longmemeval'?'./longmemeval/run-pair.mjs':'./contextbench/run.mjs');
await module.runPair(config);
