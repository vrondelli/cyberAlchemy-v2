from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(v,msg):
    if not v:raise ValueError(msg)
i=read(HERE/'inputs.json')
for name in ['product_test_manifest','review_contract','prior_preparation_receipt','prior_progress','source_manifest','r07_packet_manifest']:
    row=i[name];check(sha(ROOT/row['path'])==row['sha256'],'input drift: '+name)
for row in read(ROOT/i['source_manifest']['path'])['files']:check(sha(ROOT/row['path'])==row['sha256'],'source drift')
prior=ROOT/i['r07_packet_manifest']['path']
for row in read(prior)['files']:check(sha(prior.parent/row['path'])==row['sha256'],'R07 packet drift')
manifest=read(ROOT/i['product_test_manifest']['path'])
check(manifest['results_sha256']==sha(prior.parent/'RESULTS.json'),'test result binding')
probes=read(HERE/'REVIEW-PROBE-RESULTS.json')
check(probes['manifest_sha256']==i['product_test_manifest']['sha256'],'probe candidate binding')
check(probes['source_currentness']=='PASS unchanged before/after','probe source check')
r=read(HERE/'receipt.json')
for row in r['material_files']:check(sha(HERE/row['path'])==row['sha256'],'review packet drift')
pre=read(HERE/'preacceptance.json')
check(pre['independent_review']=='PASS' and pre['approval_ready'] is True and pre['product_approved'] is False,'preacceptance boundary')
check(r['review_result']=='PASS' and r['result']=='not_evaluable' and r['authority_effect']=='none','decision boundary')
p=read(HERE/'progress.json')
check(p['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json') and p['newly_completed']==[],'progress binding')
check(p['prior_progress']==i['prior_progress'],'progress continuity')
check(p['program_complete'] is False and 'M-RECOVERY' not in p['product_milestones_complete'],'milestone ceiling')
check({x.name for x in HERE.iterdir()}=={x['path'] for x in r['material_files']}|{'receipt.json','progress.json'},'file allowlist')
print(json.dumps({'review_packet_verification':'PASS','independent_review':'PASS','R08':'owner decision pending','product_approved':False}))
