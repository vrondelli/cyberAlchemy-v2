#!/usr/bin/env python3
"""Evaluate sealed r56 rankings against the existing private evaluator labels."""

import argparse, hashlib, json, pathlib
import numpy as np

LABEL_PINS={"r1":"c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0","r2b":"b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2"}
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def metric(ranking,gold):
    ranks=[i+1 for i,p in enumerate(ranking) if p in gold]
    first=min(ranks) if ranks else 10**9
    return {"mrr_at_8":1/first if first<=8 else 0.0,"hit_at_3":1.0 if first<=3 else 0.0,"recall_at_20":sum(1 for p in ranking[:20] if p in gold)/len(gold)}
def interval(values,seed):
    rng=np.random.default_rng(seed); a=np.asarray(values,dtype=np.float64); draws=rng.integers(0,len(a),size=(100000,len(a)))
    means=a[draws].mean(axis=1); return [float(x) for x in np.quantile(means,[.025,.975])]
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--archive",type=pathlib.Path,required=True); ap.add_argument("--source",type=pathlib.Path,required=True); ap.add_argument("--output",type=pathlib.Path,required=True); a=ap.parse_args()
    seal=json.loads((a.source/"SOURCE-SEAL.json").read_text()); rankings=a.source/"RANKINGS.jsonl"
    if seal["status"]!="complete" or seal["cases"]!=48 or seal["rankings_sha256"]!=sha(rankings): raise SystemExit("source seal invalid")
    labels={}
    for cohort,path in (("r1",a.archive/"evaluator-r1/EVALUATOR-AUDIT.json"),("r2b",a.archive/"evaluator-r2b/EVALUATOR-AUDIT.json")):
        if sha(path)!=LABEL_PINS[cohort]: raise SystemExit("label drift")
        for x in json.loads(path.read_text())["per_case_private"]:
            if not x["label_valid"]: raise SystemExit("invalid label")
            labels[(cohort,x["id"])]=set(x["admitted_paths"])
    rows=[json.loads(x) for x in rankings.read_text().splitlines()]
    if len(rows)!=48 or len(labels)!=48: raise SystemExit("denominator drift")
    per=[]
    for x in rows:
        gold=labels[(x["cohort"],x["id"])]; metrics={arm:metric(x[arm],gold) for arm in ("base","coderank","swerank")}
        per.append({"cohort":x["cohort"],"id":x["id"],"repo":x["repo"],"gold":sorted(gold),"metrics":metrics})
    aggregate={arm:{name:float(np.mean([x["metrics"][arm][name] for x in per])) for name in ("mrr_at_8","hit_at_3","recall_at_20")} for arm in ("base","coderank","swerank")}
    clusters=sorted({(x["cohort"],x["repo"]) for x in per}); diffs={}
    for other in ("base","coderank"):
        vals=[]
        for key in clusters:
            group=[x for x in per if (x["cohort"],x["repo"])==key]
            vals.append(float(np.mean([x["metrics"]["swerank"]["mrr_at_8"]-x["metrics"][other]["mrr_at_8"] for x in group])))
        diffs[other]={"mean":aggregate["swerank"]["mrr_at_8"]-aggregate[other]["mrr_at_8"],"cluster_interval_95":interval(vals,5601 if other=="base" else 5602),"cluster_wins":sum(v>0 for v in vals),"cluster_ties":sum(v==0 for v in vals),"cluster_losses":sum(v<0 for v in vals)}
    gate={"all_cases_valid":len(per)==48,"mrr_vs_coderank_at_least_0_03":diffs["coderank"]["mean"]>=.03,"mrr_vs_base_at_least_0_05":diffs["base"]["mean"]>=.05,"lower_bounds_positive":diffs["coderank"]["cluster_interval_95"][0]>0 and diffs["base"]["cluster_interval_95"][0]>0,"hit3_not_lower":aggregate["swerank"]["hit_at_3"]>=max(aggregate["base"]["hit_at_3"],aggregate["coderank"]["hit_at_3"]),"recall20_not_lower":aggregate["swerank"]["recall_at_20"]>=max(aggregate["base"]["recall_at_20"],aggregate["coderank"]["recall_at_20"]),"cluster_wins_vs_coderank_at_least_14":diffs["coderank"]["cluster_wins"]>=14}
    result={"schema_version":"are.g01-r56-evaluation/v1","status":"complete","claim_ceiling":"exposed mechanism selection only","cases":48,"clusters":len(clusters),"aggregate":aggregate,"swerank_differences":diffs,"gate":gate,"advancement_passed":all(gate.values()),"source_seal_sha256":sha(a.source/"SOURCE-SEAL.json"),"label_sha256":LABEL_PINS,"per_case_private":per}
    if a.output.exists(): raise SystemExit("output exists")
    a.output.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n"); print(json.dumps({k:result[k] for k in ("aggregate","swerank_differences","gate","advancement_passed")},sort_keys=True))
if __name__=="__main__": main()
