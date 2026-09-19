import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {isAbsolute, resolve} from 'node:path';

const project = resolve(import.meta.dirname, '..');
const composeFile = resolve(project, 'deploy/compose.security.yaml');
const secret = process.env.ARE_MODEL_API_KEY_FILE;
assert.ok(typeof secret === 'string' && isAbsolute(secret), 'absolute-dedicated-secret-path-required');
const env = {...process.env, ARE_CHAT_BIND_PORT: process.env.ARE_CHAT_BIND_PORT ?? '14194'};
const expectedIdleRetentionSeconds = Number(env.ARE_CHAT_IDLE_RETENTION_SECONDS);
assert.ok(Number.isSafeInteger(expectedIdleRetentionSeconds) && expectedIdleRetentionSeconds > 0, 'idle-retention-required');
const run = args => execFileSync('docker', args, {env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
const compose = args => run(['compose', '-f', composeFile, ...args]);
const services = ['edge', 'public-chat', 'inference-broker', 'provider-gateway'];
const expectedNetworks = {
  edge: ['chat-ingress', 'host-edge'],
  'public-chat': ['chat-ingress', 'inference'],
  'inference-broker': ['inference', 'provider-link'],
  'provider-gateway': ['provider-egress', 'provider-link'],
};
const ids = Object.fromEntries(services.map(service => [service, compose(['ps', '-q', service]).trim()]));
for (const [service, id] of Object.entries(ids)) {
  assert.ok(id, `service-not-running:${service}`);
  const value = JSON.parse(run(['inspect', id]))[0];
  assert.equal(value.State?.Health?.Status, 'healthy', `service-not-healthy:${service}`);
  assert.equal(value.Config?.User, '65532:65532', `service-user-invalid:${service}`);
  assert.equal(value.HostConfig?.ReadonlyRootfs, true, `service-root-writable:${service}`);
  assert.ok(value.HostConfig?.CapDrop?.includes('ALL'), `service-capabilities-not-dropped:${service}`);
  assert.ok(value.HostConfig?.SecurityOpt?.includes('no-new-privileges:true'), `service-new-privileges-enabled:${service}`);
  assert.ok(value.HostConfig?.SecurityOpt?.some(item => item.startsWith('seccomp=')), `service-custom-seccomp-missing:${service}`);
  const networks = Object.keys(value.NetworkSettings?.Networks ?? {}).map(name => name.replace(/^.*_/, '')).sort();
  assert.deepEqual(networks, expectedNetworks[service], `service-network-boundary-invalid:${service}`);
  const status = run(['exec', id, '/nodejs/bin/node', '-e',
    "const s=require('fs').readFileSync('/proc/1/status','utf8');const v=n=>s.match(new RegExp('^'+n+':\\\\s*(.+)$','m'))?.[1];if(v('NoNewPrivs')!=='1'||v('Seccomp')!=='2')process.exit(1)"]);
  assert.equal(status, '');
}

run(['exec', ids['inference-broker'], '/nodejs/bin/node', '-e',
  "fetch('http://provider-gateway:4195/healthz').then(async r=>{const x=await r.json();process.exit(r.ok&&x.status==='ready'?0:1)}).catch(()=>process.exit(1))"]);

const status = JSON.parse(run(['exec', ids.edge, '/nodejs/bin/node', '-e',
  "const http=require('http');const req=http.get({host:'127.0.0.1',port:8080,path:'/are/api/are/status',headers:{host:process.argv[1]}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{if(res.statusCode!==200)process.exit(1);process.stdout.write(Buffer.concat(chunks))})});req.on('error',()=>process.exit(1))",
  `127.0.0.1:${env.ARE_CHAT_BIND_PORT}`]));
assert.equal(status.persistence, 'process-memory', 'chat-persistence-invalid');
assert.equal(status.idle_retention_seconds, expectedIdleRetentionSeconds, 'chat-idle-retention-invalid');

const denyConnect = "import{connect}from'node:net';const targets=JSON.parse(process.argv[1]);const check=([host,port])=>new Promise(resolve=>{const s=connect({host,port});let done=false;const finish=v=>{if(done)return;done=true;s.destroy();resolve(v)};s.once('connect',()=>finish(false));s.once('error',()=>finish(true));setTimeout(()=>finish(true),1500)});if((await Promise.all(targets.map(check))).some(v=>!v))process.exit(1)";
run(['exec', ids['inference-broker'], '/nodejs/bin/node', '--input-type=module', '-e', denyConnect,
  JSON.stringify([['1.1.1.1', 443], ['169.254.169.254', 80]])]);
run(['exec', ids['public-chat'], '/nodejs/bin/node', '--input-type=module', '-e', denyConnect,
  JSON.stringify([['provider-gateway', 4195], ['169.254.169.254', 80]])]);

run(['exec', ids['inference-broker'], '/nodejs/bin/node', '--permission', '--allow-fs-read=/srv',
  '--allow-fs-read=/var/lib/are-broker-quota', '--allow-fs-write=/var/lib/are-broker-quota', '--allow-net',
  '--disable-sigusr1', '--disallow-code-generation-from-strings', '-e',
  "import('node:fs').then(fs=>{try{fs.readFileSync('/run/secrets/model_api_key');process.exit(1)}catch{process.exit(0)}})"]);
run(['exec', ids['provider-gateway'], '/nodejs/bin/node', '--permission', '--allow-fs-read=/srv',
  '--allow-fs-read=/run/secrets/model_api_key', '--allow-fs-read=/etc/ssl/certs', '--allow-net',
  '--disable-sigusr1', '--disallow-code-generation-from-strings', '--input-type=module', '-e',
  "import{lstatSync,readFileSync}from'node:fs';const s=lstatSync('/run/secrets/model_api_key'),b=readFileSync('/run/secrets/model_api_key');const ok=s.isFile()&&!s.isSymbolicLink()&&s.uid===65532&&s.gid===65532&&(s.mode&0o777)===0o400&&b.length>0&&b.length<=4096;b.fill(0);process.exit(ok?0:1)"]);

process.stdout.write(`${JSON.stringify({verified: true, healthy: services, broker_external_denied: true,
  broker_secret_denied: true, gateway_secret_metadata_valid: true, custom_seccomp_active: true,
  idle_retention_seconds: expectedIdleRetentionSeconds, live_model_invoked: false})}\n`);
