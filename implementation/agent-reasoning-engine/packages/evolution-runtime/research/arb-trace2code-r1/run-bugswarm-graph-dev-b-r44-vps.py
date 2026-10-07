#!/usr/bin/env python3
"""VPS-only tokenizer and one-shot GLM generation for cohort-B r44."""
from __future__ import annotations

import hashlib, json, os, re, time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path('/opt/are-benchmark-runs/g01-graph-dev-b-entity-r44')
SECRET = Path('/opt/are-keld-presentation/secrets/model_api_key')
PINS = {
    'packets': 'e8050018d1bb3ca956ad2d96487cc314c7fb5f35538d333978f214d44286ae02',
    'packet_seal': '6207ed8cbe4b3e812c0becb97b0b2cc2abd12b65cdda34ed8228149b8a068db6',
    'protocol': '8009f24043f2e8190ad9af707c0b17a81237b15d6e0e962509f1a63d1372c958',
}
MODEL = 'glm-5.3-flash'
TOKENIZER_URL = 'https://api.z.ai/api/paas/v4/tokenizer'
GENERATION_URL = 'https://api.z.ai/api/paas/v4/chat/completions'
MAX_RESPONSE_BYTES = 262_144
TOTAL_PROMPT_CAP = 240_000
CASES = 24


def sha(data): return hashlib.sha256(data).hexdigest()
def need(ok, why):
    if not ok: raise SystemExit('g01-r44.' + why)
def stable(value): return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()
def save(name, value):
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    descriptor = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle: handle.write(data)


def post(url, body, key, timeout):
    request = Request(url, data=body, method='POST', headers={
        'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json',
        'Accept': 'application/json', 'User-Agent': 'ARE-G01-r44/1'})
    try:
        with urlopen(request, timeout=timeout) as response:
            data = response.read(MAX_RESPONSE_BYTES + 1)
            return (response.status, data, None) if len(data) <= MAX_RESPONSE_BYTES else (response.status, b'', 'response-too-large')
    except HTTPError as error: return error.code, error.read(min(MAX_RESPONSE_BYTES, 65_536)), 'http-error'
    except (URLError, TimeoutError, OSError) as error: return None, b'', type(error).__name__


def document(raw):
    try:
        value = json.loads(raw)
        return value if isinstance(value, dict) else None
    except (ValueError, UnicodeDecodeError): return None


def selection(content, packet):
    need(isinstance(content, str), 'selection-content')
    body = content.strip(); fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
    if fence: body = fence.group(1)
    value = json.loads(body)
    need(isinstance(value, dict) and set(value) == {'candidate_ids'} and
         isinstance(value['candidate_ids'], list) and len(value['candidate_ids']) <= 8, 'selection-shape')
    by_path = {item['path']: item['candidate_id'] for item in packet['candidates']}; ids = []
    for item in value['candidate_ids']:
        if isinstance(item, int) and not isinstance(item, bool): candidate_id = item
        elif isinstance(item, str) and re.fullmatch(r'[1-9][0-9]*', item): candidate_id = int(item)
        elif isinstance(item, str) and item in by_path: candidate_id = by_path[item]
        else: raise ValueError('selection-value')
        need(1 <= candidate_id <= packet['candidate_count'], 'selection-range'); ids.append(candidate_id)
    need(len(ids) == len(set(ids)), 'selection-duplicate')
    return ids


def main():
    paths = {'packets': ROOT/'PACKETS.jsonl', 'packet_seal': ROOT/'PACKET-SEAL.json',
             'protocol': ROOT/'TREATMENT-PROTOCOL.md'}
    need(ROOT.is_dir() and not (ROOT/'RUN-FREEZE.json').exists() and
         all(sha(paths[name].read_bytes()) == digest for name, digest in PINS.items()), 'root-prior-or-input')
    packets = [json.loads(line) for line in paths['packets'].read_text().splitlines()]
    seal = json.loads(paths['packet_seal'].read_bytes())
    need(len(packets) == seal['cases'] == CASES and seal['packets_sha256'] == PINS['packets'] and
         seal['fixed_graph_prefix'] == 4, 'packet-denominator')
    for packet in packets:
        need(packet['candidate_count'] == len(packet['candidates']) <= 30 and
             packet['prompt_bytes'] == len(packet['prompt'].encode()) <= 24_000 and
             packet['fixed_graph_prefix'] == 4 and packet['gold_opened'] is False and
             [item['candidate_id'] for item in packet['candidates']] == list(range(1, packet['candidate_count']+1)),
             f"packet-{packet.get('ordinal')}")
    key = SECRET.read_text().strip(); need(8 <= len(key) <= 8192, 'secret')
    save('RUN-FREEZE.json', {'schema_version':'are.g01-r44-run-freeze/v1','packets_sha256':PINS['packets'],
         'packet_seal_sha256':PINS['packet_seal'],'protocol_sha256':PINS['protocol'],
         'runner_sha256':sha(Path(__file__).read_bytes()),'model':MODEL,'maximum_tokenizer_calls':CASES,
         'maximum_generation_calls':CASES,'maximum_output_tokens':512,'reasoning_effort':'low',
         'prompt_plus_reserve_limit':8192,'total_prompt_cap':TOTAL_PROMPT_CAP,'automatic_retries':0,
         'failure_policy':'stop-no-retry','gold_available':False})
    token_rows=[]; token_sum=0
    for packet in packets:
        body=stable({'model':MODEL,'messages':[{'role':'user','content':packet['prompt']}]}); started=time.monotonic()
        status,raw,failure=post(TOKENIZER_URL,body,key,30); doc=document(raw); elapsed=round((time.monotonic()-started)*1000)
        tokens=doc.get('usage',{}).get('prompt_tokens') if doc else None
        if not isinstance(tokens,int) or isinstance(tokens,bool): tokens=None
        if tokens is not None: token_sum+=tokens
        admitted=status==200 and failure is None and tokens is not None and tokens+512<=8192 and token_sum<=TOTAL_PROMPT_CAP
        row={'schema_version':'are.g01-r44-tokenizer-case/v1','ordinal':packet['ordinal'],'id':packet['id'],
             'prompt_sha256':sha(packet['prompt'].encode()),'request_sha256':sha(body),'response_sha256':sha(raw),
             'http_status':status,'failure_code':failure,'prompt_tokens':tokens,'elapsed_ms':elapsed,'admitted':admitted}
        save(f"TOKENIZER-{packet['ordinal']:02d}.json",row);token_rows.append(row)
        print(json.dumps({'phase':'tokenizer','ordinal':packet['ordinal'],'status':status,'tokens':tokens,'admitted':admitted}),flush=True)
        if not admitted: break
    admitted=len(token_rows)==CASES and all(row['admitted'] for row in token_rows)
    save('TOKENIZER-RESULT.json',{'schema_version':'are.g01-r44-tokenizer-result/v1','status':'admitted' if admitted else 'not-admitted',
         'attempts':len(token_rows),'admitted':sum(row['admitted'] for row in token_rows),'summed_prompt_tokens':token_sum,
         'maximum_prompt_tokens':max((row['prompt_tokens'] or 0 for row in token_rows),default=0),
         'summed_elapsed_ms':sum(row['elapsed_ms'] for row in token_rows),'packets_sha256':PINS['packets']})
    need(admitted,'tokenizer-not-admitted')
    calls=valid=known_prompt=known_completion=elapsed_sum=0;stopped=False
    for packet in packets:
        body=stable({'model':MODEL,'messages':[{'role':'user','content':packet['prompt']}],
                     'stream':False,'max_tokens':512,'reasoning_effort':'low'});started=time.monotonic()
        status,raw,failure=post(GENERATION_URL,body,key,120);doc=document(raw);elapsed=round((time.monotonic()-started)*1000)
        choice=doc.get('choices',[{}])[0] if doc and doc.get('choices') else {};usage=doc.get('usage') if doc else None
        save(f"GENERATION-{packet['ordinal']:02d}.json",{'schema_version':'are.g01-r44-call/v1','ordinal':packet['ordinal'],
             'id':packet['id'],'prompt_sha256':sha(packet['prompt'].encode()),'request_sha256':sha(body),
             'response_sha256':sha(raw),'http_status':status,'failure_code':failure,'elapsed_ms':elapsed,
             'finish_reason':choice.get('finish_reason'),'usage':usage,'provider_payload':doc})
        calls+=1;elapsed_sum+=elapsed
        if isinstance(usage,dict) and isinstance(usage.get('prompt_tokens'),int):known_prompt+=usage['prompt_tokens']
        if isinstance(usage,dict) and isinstance(usage.get('completion_tokens'),int):known_completion+=usage['completion_tokens']
        if status!=200 or failure is not None or known_prompt>TOTAL_PROMPT_CAP:stopped=True
        ids=None;error=None
        if status==200 and choice.get('finish_reason')=='stop':
            try:ids=selection(choice.get('message',{}).get('content'),packet);valid+=1
            except (ValueError,TypeError,json.JSONDecodeError,SystemExit) as exception:error=str(exception)[:160]
        else:error='provider-status-finish-or-content'
        selected=[packet['candidates'][item-1]['path'] for item in ids] if ids is not None else []
        save(f"DECISION-{packet['ordinal']:02d}.json",{'schema_version':'are.g01-r44-decision/v1','ordinal':packet['ordinal'],
             'id':packet['id'],'listwise_valid':ids is not None,'listwise_error':error,'selected_ids':ids,
             'selected_paths':selected,'stopped_after_case':stopped})
        print(json.dumps({'phase':'generation','ordinal':packet['ordinal'],'status':status,'valid':ids is not None,
              'prompt_tokens':usage.get('prompt_tokens') if isinstance(usage,dict) else None,
              'completion_tokens':usage.get('completion_tokens') if isinstance(usage,dict) else None,'stopped':stopped}),flush=True)
        if stopped:break
    result={'schema_version':'are.g01-r44-run-result/v1','status':'complete' if calls==CASES and not stopped else 'terminal-failed',
            'attempts':calls,'valid_responses':valid,'known_prompt_tokens':known_prompt,
            'known_completion_tokens':known_completion,'summed_elapsed_ms':elapsed_sum,
            'transport_stopped':stopped,'packets_sha256':PINS['packets']}
    save('RUN-RESULT.json',result);print(json.dumps(result,sort_keys=True),flush=True)
    need(result['status']=='complete','generation-terminal-failed')


if __name__=='__main__':main()
