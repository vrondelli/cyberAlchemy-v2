// Seal r2 exposed model output and compare exact selected paths to sealed r1.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';

const archive='/home/vlad_/are-benchmark-archive';
const root=join(archive,'g02-r11-task8-access-window-exposed-r2-20261003');
const priorPath=join(archive,'g02-r11-code-anchor-model-delivery-exposed-r1-20261003/SEALED-RESPONSES.json');
const priorSha='dcd531ac0404f6208b37feb893350a3201e46cbdf68fdbcbdb135592f43f65b0';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fileSha=path=>sha(readFileSync(path));
const load=name=>JSON.parse(readFileSync(join(root,name),'utf8'));
const need=(ok,reason)=>{if(!ok)throw Error('g02-access-window-seal.'+reason);};
need(fileSha(priorPath)===priorSha&&!existsSync(join(root,'SEALED-RESPONSE.json')),
  'input-or-output');
const packet=load('PACKET.json'),freeze=load('FREEZE.json'),request=load('REQUEST.json');
const started=load('STARTED.json'),response=load('RESPONSE.json'),tokenizer=load('TOKENIZER.json');
const prior=JSON.parse(readFileSync(priorPath)).rows.find(row=>row.ordinal===8);
need(fileSha(join(root,'PACKET.json'))===freeze.packet_sha256&&
  fileSha(join(root,'run-g02-r11-task8-access-window-exposed-r2.mjs'))===freeze.runner_sha256&&
  freeze.status==='frozen-before-model-dispatch'&&prior,'freeze');
const requestSha=sha(stable(request));
const body=JSON.parse(request.messages?.[1]?.content??'null');
need(requestSha===started.request_sha256&&requestSha===response.request_sha256&&
  request.messages[0].content===freeze.prompt&&request.model===freeze.model&&
  request.max_tokens===freeze.maximum_output_tokens&&
  body.issue===packet.issue&&body.instance_id===packet.instance_id&&
  body.base_commit===packet.base_commit&&stable(body.reads)===stable(packet.reads)&&
  response.source_read_ids.join(',')===packet.reads.map(read=>read.read_id).join(','),
  'request-binding');
need(tokenizer.http_status===200&&tokenizer.prompt_tokens<=freeze.maximum_input_tokens&&
  response.status==='valid'&&response.http_status===200&&response.finish_reason==='stop'&&
  response.failure_code==null,'delivery');
const selected=JSON.parse(response.content).selected_read_indexes;
need(stable(selected)===stable(response.selected_read_indexes)&&
  stable(selected.map(index=>packet.reads[index].path))===stable(response.selected_paths)&&
  response.usage.total_tokens===response.usage.prompt_tokens+response.usage.completion_tokens,
  'selection-usage');
const exactRepeat=stable(response.selected_paths)===stable(prior.selected_paths);
const result={schema_version:'are.g02-r11-task8-access-window-seal-r2/v1',
  posture:'exposed-model-output-sealed-before-any-r2-evaluator-lookup',
  packet_sha256:fileSha(join(root,'PACKET.json')),
  freeze_sha256:fileSha(join(root,'FREEZE.json')),
  request_sha256:requestSha,response_sha256:fileSha(join(root,'RESPONSE.json')),
  prior_response_seal_sha256:priorSha,selected_paths:response.selected_paths,
  selected_extra_paths:selected.filter(index=>packet.reads[index].role==='extra')
    .map(index=>packet.reads[index].path),
  exact_prior_selection_repeat:exactRepeat,known_model_tokens:response.usage.total_tokens,
  claim_ceiling:'Exposed source-window comparison only. Identical path selection establishes no additive file-set change relative to r1; no full ARE episode, new native score, independent test, or superiority.',
  open_questions:['Why does the model discount all extra headers?',
    'Is this candidate pool causally relevant enough for the issue?']};
writeFileSync(join(root,'SEALED-RESPONSE.json'),JSON.stringify(result,null,2)+'\n',
  {flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({seal_sha256:fileSha(join(root,'SEALED-RESPONSE.json')),
  exact_prior_selection_repeat:exactRepeat,known_model_tokens:result.known_model_tokens})+'\n');
