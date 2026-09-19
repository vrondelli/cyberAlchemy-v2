"""Evaluator-only, read-only native bridge. Open questions: SCORER-BRIDGE-BOUNDED-V3.md."""
import argparse, contextlib, hashlib, importlib.util, json, os, sys
from pathlib import Path

def required_paths(gold,pred):
    paths=set(gold.files());traj=pred['traj_data']
    paths.update(traj.get('pred_files') or []);paths.update(traj.get('pred_spans') or {})
    for step in traj.get('pred_steps') or []:
        paths.update(step.get('files') or []);paths.update(step.get('spans') or {})
    if len(paths)>1024:raise ValueError('path-count')
    for p in paths:
        if not isinstance(p,str) or len(p)>1024 or p.startswith('/') or '\\' in p or any(x in ('','.','..') for x in p.split('/')):raise ValueError('path-shape')
    return sorted(paths)

def verify_materialized(base,manifest,paths,commit):
    if manifest['commit']!=commit or sorted([f['path'] for f in manifest['files']]+manifest['missing'])!=paths:raise ValueError('materialized-identity')
    if len(set(paths))!=len(paths):raise ValueError('duplicate-path')
    for f in manifest['files']:
        path=base/f['path']
        if path.is_symlink() or not path.is_file() or base.resolve() not in path.resolve().parents:raise ValueError('materialized-path')
        body=path.read_bytes()
        if len(body)!=f['bytes'] or hashlib.sha256(body).hexdigest()!=f['sha256']:raise ValueError('materialized-drift')
    for p in manifest['missing']:
        if (base/p).exists():raise ValueError('missing-path-drift')

def require_local_parsers(paths):
    from contextbench.extractors import treesitter as ts
    if not ts._TS_AVAILABLE:raise ValueError('parser-missing')
    languages={'python'}|{ts.LANG_MAP[Path(p).suffix.lower()] for p in paths if Path(p).suffix.lower() in ts.LANG_MAP}
    if ts._get_parser.__module__.startswith('tree_sitter_language_pack'):
        from tree_sitter_language_pack import downloaded_languages
        if not languages.issubset(set(downloaded_languages())):raise ValueError('parser-not-preinstalled')
    for lang in languages:
        parser=ts._get_parser(lang)
        if parser is None:raise ValueError('parser-unavailable')
        ts._PARSERS[lang]=parser

def evaluate_materialized(evaluator,gold,pred,base,cache):
    original=evaluator.checkout
    def checkout(_repo,commit,_cache):
        if commit!=pred['commit']:raise ValueError('checkout-commit')
        return str(base)
    evaluator.checkout=checkout
    try:return evaluator.evaluate_instance(pred['instance_id'],gold,pred,cache)
    finally:evaluator.checkout=original

def main():
    p=argparse.ArgumentParser();p.add_argument('--phase',choices=['plan','score'],required=True)
    for key in ['upstream','manifest','gold','pred','wrapper','cache']:p.add_argument('--'+key,required=True)
    p.add_argument('--base');a=p.parse_args()
    spec=importlib.util.spec_from_file_location('pinned_native_wrapper',a.wrapper);native=importlib.util.module_from_spec(spec);spec.loader.exec_module(native)
    manifest=json.loads(Path(a.manifest).read_text());native.verify_sources(Path(a.upstream),manifest)
    expected=next(f['sha256'] for f in manifest['files'] if f['path']=='data/full.parquet')
    if hashlib.sha256(Path(a.gold).read_bytes()).hexdigest()!=expected:raise ValueError('reference-drift')
    sys.path.insert(0,a.upstream)
    from contextbench.parsers.gold import GoldLoader
    import contextbench.evaluate as evaluator
    pred=json.loads(Path(a.pred).read_text());gold=GoldLoader(a.gold).get(pred.get('instance_id'))
    if gold is None:raise ValueError('reference-identity')
    pred,gold=native.prepare_prediction(pred,gold);paths=required_paths(gold,pred)
    if a.phase=='plan':out={'schema':'are.private-scorer-plan/v1','commit':pred['commit'],'paths':paths,'prediction_sha256':hashlib.sha256(Path(a.pred).read_bytes()).hexdigest(),'upstream_revision':manifest['revision']}
    else:
        base=Path(a.base);materialized=json.loads((base/'.scorer-source.json').read_text());verify_materialized(base,materialized,paths,pred['commit']);require_local_parsers([f['path'] for f in materialized['files']]);result=evaluate_materialized(evaluator,gold,pred,base,a.cache)
        if result.get('error'):raise ValueError('native-evaluation-failed')
        out={'upstream_revision':manifest['revision'],'native':result,'authority_effect':'none','edit_location_posture':'reference-patch fallback disabled; native evaluator unchanged'}
    sys.stdout.write(json.dumps(out,separators=(',',':')))
if __name__=='__main__':
    try:main()
    except Exception:
        sys.stderr.write('bounded-evaluator-failed\n');raise SystemExit(2)
