"""Inspect pinned ContextBench identities and annotation availability, not model results.
Open questions: README.md. Does not print annotation contents or reference patches.
"""
import argparse,json,sys
from pathlib import Path
from score_native import verify_sources

def main():
    p=argparse.ArgumentParser();p.add_argument('--upstream',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    manifest=json.loads(Path(__file__).with_name('source-manifest.json').read_text());verify_sources(a.upstream,manifest)
    sys.path.insert(0,str(a.upstream));from contextbench.parsers.gold import GoldLoader
    from contextbench.extractors.treesitter import _get_parser_for_lang
    loader=GoldLoader(str(a.upstream/'data/full.parquet'));failures=[];empty=[];rows=manifest['dataset']['instances']
    for row in rows:
        gold=loader.get(row['instance_id'])
        if gold is None or gold.commit!=row['base_commit'] or gold.repo_url!=row['repo_url']:failures.append(row['instance_id'])
        elif not gold.files():empty.append(row['instance_id'])
    parsers={lang:_get_parser_for_lang(lang) is not None for lang in sorted(manifest['dataset']['language_counts'])}
    result={'status':'passed' if not failures and not empty and all(parsers.values()) else 'incomplete','task_count':len(rows),'unique_task_ids':len({r['instance_id'] for r in rows}),'repositories':len({r['repo'] for r in rows}),'parser_available':parsers,'identity_failures':failures,'empty_gold_tasks':empty,'nonempty_gold_tasks':len(rows)-len(empty)-len(failures),'claim_ceiling':'Identity metadata and annotation availability; repository line validity and live traces unverified. Empty gold is never a model success.','authority_effect':'none','open_questions_ref':'README.md'}
    a.out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'tasks':len(rows),'empty_gold':len(empty),'identity_failures':len(failures),'parsers':all(parsers.values())}))
if __name__=='__main__':main()
