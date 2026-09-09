"""Reproduce prior measured calibration. Open questions: README.md#open-questions."""
import pathlib,json,math
base=pathlib.Path(__file__).resolve().parent.parent/'headroom-generalization-2026-09-07'
differences=[];unknown=0
for batch in ['tuning-02','tuning-03','fixed-evaluation']:
 for path in sorted((base/batch).glob('trial-*/arm-0/visible-trace.json')):
  for receipt in json.loads(path.read_text())['receipts']:
   if receipt['kind']!='model':continue
   actual,bound=receipt.get('input_tokens'),receipt.get('reserved_input_tokens')
   if isinstance(actual,int) and isinstance(bound,int):differences.append(actual-(bound-256))
   else:unknown+=1
maximum=max(differences)
print(json.dumps({'known_samples':len(differences),'unknown_samples':unknown,'maximum_difference':maximum,'selected_margin':math.ceil((max(0,maximum)+128)/128)*128}))
