#!/usr/bin/env python3
"""Run the frozen bounded CodeRank/SweRank r56 source-side ranking."""

from __future__ import annotations

import argparse, hashlib, json, os, pathlib, platform, re, time
import numpy as np
import sentence_transformers, torch, transformers
from sentence_transformers import SentenceTransformer

PINS = {
    "r1_projection":"d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e",
    "r2b_projection":"cdee5d69535ff44ac1aca8d8f3fcea4b59f9b7519db504eeb328781738281ea2",
    "r1_queries":"bb35ea15fa9498511e329cd298084c4db7f31a636ca071ef4bb6d142f9b327f2",
    "r2b_queries":"3dabb5d1571bc852d2234bf55dcbdc1934bd2f68579f1c0a052fcebcba328251",
    "r1_are":"12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
    "r2b_are":"2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d",
    "r1_chunk":"1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c",
    "r2b_chunk":"bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f",
}
MODELS = {
    "coderank": ("nomic-ai/CodeRankEmbed", "3c4b60807d71f79b43f3c4363786d9493691f8b1", "827529bcd58aef0d9082e66eeff7e7d53a02f62bd005f841a26b3d3e2fb17ebe"),
    "swerank": ("Salesforce/SweRankEmbed-Small", "745d2a06103a66d3cfa600aa52fc0d3523010daa", "e40687da7f148e684648691facbaa2222503829afb9d21b9b3913034bef14f41"),
}
VERSIONS={"python":"3.13.16","torch":"2.14.1+cpu","transformers":"4.45.1","sentence_transformers":"5.2.3","numpy":"2.5.3"}
TOKEN=re.compile(r"[A-Za-z_][A-Za-z0-9_]{1,}")

def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def jsonl(p): return [json.loads(x) for x in pathlib.Path(p).read_text().splitlines()]
def write_new(p,v):
    fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,"w") as f: json.dump(v,f,sort_keys=True,indent=2); f.write("\n")
def rrf(*rankings):
    scores={}
    for ranking in rankings:
        for i,path in enumerate(ranking): scores[path]=scores.get(path,0.0)+1/(60+i+1)
    return sorted(scores,key=lambda p:(-scores[p],p))
def choose_window(root,path,query):
    rel=pathlib.PurePosixPath(path)
    if rel.is_absolute() or ".." in rel.parts: raise ValueError("unsafe path")
    target=root.joinpath(*rel.parts).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file(): raise ValueError("path escape")
    lines=target.read_text(encoding="utf-8",errors="replace").splitlines()
    q={x.casefold() for x in TOKEN.findall(query)}
    best=(-1,0,[])
    starts=range(max(1,len(lines)-79))
    for start in starts:
        window=lines[start:start+80]
        score=sum(1 for x in TOKEN.findall("\n".join(window)) if x.casefold() in q)
        if score>best[0]: best=(score,start,window)
    return f"# path: {path}\n"+"\n".join(best[2]),best[1],best[0]

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--archive",type=pathlib.Path,required=True); ap.add_argument("--output",type=pathlib.Path,required=True); ap.add_argument("--cache",type=pathlib.Path,required=True); a=ap.parse_args()
    current={"python":platform.python_version(),"torch":torch.__version__,"transformers":transformers.__version__,"sentence_transformers":sentence_transformers.__version__,"numpy":np.__version__}
    if current!=VERSIONS: raise SystemExit(f"environment drift {current}")
    files={"r1_projection":a.archive/"source-projection-r1/SOURCE-PROJECTION-RECEIPT.json","r2b_projection":a.archive/"source-projection-r2b/SOURCE-PROJECTION-RECEIPT.json","r1_queries":a.archive/"query-projection-r1/QUERIES.jsonl","r2b_queries":a.archive/"query-projection-r2b/QUERIES.jsonl","r1_are":a.archive/"are-rankings-r1/ARE-RANKINGS.jsonl","r2b_are":a.archive/"are-rankings-r2b/ARE-RANKINGS.jsonl","r1_chunk":a.archive/"chunk-bm25-rankings-r1/CHUNK-BM25-RANKINGS.jsonl","r2b_chunk":a.archive/"chunk-bm25-rankings-r2b/CHUNK-BM25-RANKINGS.jsonl"}
    for name,p in files.items():
        if sha(p)!=PINS[name]: raise SystemExit(f"input drift {name}")
    if a.output.exists(): raise SystemExit("output exists")
    a.output.mkdir(parents=True)
    cases=[]; docs=[]
    for cohort in ("r1","r2b"):
        proj={x["case"]:x for x in json.loads(files[f"{cohort}_projection"].read_text())["records"]}
        queries={x["id"]:x for x in jsonl(files[f"{cohort}_queries"])}; ars={x["id"]:x for x in jsonl(files[f"{cohort}_are"])}; chunks={x["id"]:x for x in jsonl(files[f"{cohort}_chunk"])}
        for cid in sorted(queries):
            ar=ars[cid]["ranked_files"]; ch=chunks[cid]["ranked_files"]; base=rrf(ar,ch)
            candidates=[]
            for p in ar[:10]+ch[:10]:
                if p not in candidates: candidates.append(p)
            candidates=candidates[:20]; root=pathlib.Path(proj[cid]["root"]).resolve(strict=True)
            windows=[]
            for p in candidates:
                text,start,score=choose_window(root,p,queries[cid]["query"]); windows.append({"path":p,"start_line":start+1,"overlap":score,"text":text}); docs.append(text)
            cases.append({"cohort":cohort,"id":cid,"repo":queries[cid]["repo"],"base_commit":queries[cid]["base_commit"],"query":queries[cid]["query"],"query_sha256":queries[cid]["query_sha256"],"are":ar,"chunk":ch,"base":base,"candidates":candidates,"windows":windows})
    if len(cases)!=48 or len(docs)>960: raise SystemExit("denominator drift")
    freeze={"schema_version":"are.g01-r56-source-freeze/v1","cases":48,"candidate_cap":20,"window_lines":80,"maximum_sequence_length":512,"batch_size":16,"rrf_k":60,"models":MODELS,"environment":VERSIONS,"input_sha256":PINS,"script_sha256":sha(__file__),"gold_opened":False}
    write_new(a.output/"RUN-FREEZE.json",freeze); write_new(a.output/"WINDOWS.json",[{k:v for k,v in c.items() if k not in ("are","chunk","base")} for c in cases])
    offset=0
    for name,(model_id,revision,_) in MODELS.items():
        local_model=a.cache/("models--"+model_id.replace("/","--"))/"snapshots"/revision
        if not local_model.is_dir(): raise SystemExit(f"missing pinned model snapshot {name}")
        started=time.monotonic(); model=SentenceTransformer(str(local_model),trust_remote_code=True,device="cpu",cache_folder=str(a.cache)); model.max_seq_length=512
        qtexts=["Represent this query for searching relevant code: "+c["query"] for c in cases]
        qvec=model.encode(qtexts,batch_size=16,normalize_embeddings=True,convert_to_numpy=True,show_progress_bar=False)
        dvec=model.encode(docs,batch_size=16,normalize_embeddings=True,convert_to_numpy=True,show_progress_bar=False)
        cursor=0
        for i,c in enumerate(cases):
            n=len(c["candidates"]); vals=dvec[cursor:cursor+n]@qvec[i]; cursor+=n
            sem=sorted(c["candidates"],key=lambda p:(-float(vals[c["candidates"].index(p)]),p)); complete=sem+[p for p in c["base"] if p not in sem]
            c[name]=rrf(c["are"],c["chunk"],complete); c[name+"_scores"]={p:float(vals[j]) for j,p in enumerate(c["candidates"])}
        write_new(a.output/f"{name.upper()}-RECEIPT.json",{"model":model_id,"revision":revision,"elapsed_ms":round((time.monotonic()-started)*1000),"documents":len(docs),"queries":48})
        del model,qvec,dvec
    rows=[{"schema_version":"are.g01-r56-ranking/v1",**{k:v for k,v in c.items() if k not in ("query","windows","are","chunk")}} for c in cases]
    out=a.output/"RANKINGS.jsonl"; out.write_text("".join(json.dumps(x,sort_keys=True)+"\n" for x in rows))
    write_new(a.output/"SOURCE-SEAL.json",{"schema_version":"are.g01-r56-source-seal/v1","status":"complete","cases":48,"rankings_sha256":sha(out),"windows_sha256":sha(a.output/"WINDOWS.json"),"freeze_sha256":sha(a.output/"RUN-FREEZE.json"),"gold_opened":False})
    print(json.dumps(json.loads((a.output/"SOURCE-SEAL.json").read_text()),sort_keys=True))
if __name__=="__main__": main()
