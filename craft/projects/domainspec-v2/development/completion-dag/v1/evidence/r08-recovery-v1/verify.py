from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(x):return json.loads(x.read_text())
def sha(x):return hashlib.sha256(x.read_bytes()).hexdigest()
def check(value,message):
    if not value:raise ValueError(message)
for row in read(HERE/'source-manifest.json')['files']:check(sha(ROOT/row['path'])==row['sha256'],'source drift')
r=read(HERE/'receipt.json')
for key,name in [('source_manifest_sha256','source-manifest.json'),('review_request_sha256','review-request.json'),('preacceptance_sha256','preacceptance.json')]:check(r[key]==sha(HERE/name),'receipt binding')
for row in r['input_receipt_refs']+[r['product_test_manifest']]:check(sha(ROOT/row['path'])==row['sha256'],'input binding')
pre=read(HERE/'preacceptance.json');check(pre['approval_ready'] is False and pre['product_approved'] is False,'decision ceiling')
review=read(HERE/'review-request.json');check(review['status']=='prepared-not-dispatched' and review['repository_write_scope']==[],'review ceiling')
p=read(HERE/'progress.json');check(p['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json') and p['newly_completed']==[],'progress binding')
check(p['current_attempt']['result']=='not_evaluable' and r['result']=='not_evaluable','R08 ceiling')
check(sha(ROOT/p['prior_progress']['path'])==p['prior_progress']['sha256'],'prior progress')
check({x.name for x in HERE.iterdir()}=={'README.md','review-request.json','preacceptance.json','source-manifest.json','receipt.json','progress.json','verify.py'},'file allowlist')
print(json.dumps({'preparation_verification':'PASS','R08':'not_evaluable','independent_review':'pending','product_approved':False}))
