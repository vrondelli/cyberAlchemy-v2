"""Verify the imported baseline and rebuild in disposable storage, never in-place."""
from pathlib import Path
import hashlib,json,shutil,subprocess,tempfile
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'docs/IMPORT-MANIFEST.json').read_text())
changed=[r['path'] for r in m['files'] if not (root/r['path']).is_file() or hashlib.sha256((root/r['path']).read_bytes()).hexdigest()!=r['sha256']]
if changed:raise SystemExit('Imported baseline differs: '+', '.join(changed))
with tempfile.TemporaryDirectory(prefix='keld-build-') as temp:
 dst=Path(temp)/'prototype';shutil.copytree(root/'prototype',dst)
 subprocess.run(['python3','-X','utf8',str(dst/'build.py')],check=True)
 generated=['index.html','shop.html','legend.html','keld-illustrated-standalone.html','keld-shop-standalone.html','keld-legend-standalone.html']
 differences=[p for p in generated if (dst/p).read_bytes()!=(root/'prototype'/p).read_bytes()]
 result={'status':'PASS' if not differences else 'FAIL','imported_files':len(m['files']),'bytes':m['total_bytes'],'build_outputs':len(generated),'build_differences':differences,'claim_limit':'Byte identity and reproducible static build only; no commerce or engine delivery tested.'}
 (root/'evidence').mkdir(exist_ok=True);(root/'evidence/import-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
 if differences:raise SystemExit(1)
