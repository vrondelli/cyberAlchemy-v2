"""Source/receipt-only G02 r11 terminal-prompt continuity audit; no labels or scorer."""
import argparse
import hashlib
import json
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    rows = []
    for ordinal in range(1, 13):
        roots = list(BASE.glob(f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'))
        if len(roots) != 1:
            raise RuntimeError(f'pair-root-missing:{ordinal}')
        root = roots[0]
        result_path = root / 'evidence/run/result.json'
        result = json.loads(result_path.read_text())
        if result['status'] != 'final_context_selected' or not result['captures']:
            raise RuntimeError(f'nonterminal:{ordinal}')
        selected = result['selection']['final_read_ids']
        if len(selected) != len(set(selected)) or not all(isinstance(item, str) for item in selected):
            raise RuntimeError(f'selection-invalid:{ordinal}')
        captures = result['captures']
        final_capture = captures[-1]
        if final_capture['step'] != max(capture['step'] for capture in captures):
            raise RuntimeError(f'capture-order:{ordinal}')
        final_prompt = final_capture['prompt']
        model = [receipt for receipt in result['receipts'] if receipt.get('kind') == 'model']
        if len(model) != len(result['response_captures']):
            raise RuntimeError(f'model-capture-count:{ordinal}')
        recycles = result['recycling']['recycles']
        generation = result['recycling']['generation']
        if not isinstance(recycles, int) or not isinstance(generation, int):
            raise RuntimeError(f'recycling-schema:{ordinal}')
        visible = [read_id for read_id in selected if read_id in final_prompt]
        rows.append({
            'ordinal': ordinal,
            'instance_id': result['instance_id'],
            'result_sha256': sha(result_path),
            'model_calls': len(model),
            'recycles': recycles,
            'terminal_generation': generation,
            'final_capture_step': final_capture['step'],
            'final_prompt_sha256': hashlib.sha256(final_prompt.encode()).hexdigest(),
            'selected_read_ids': len(selected),
            'selected_read_ids_literal_in_final_prompt': len(visible),
            'selected_read_ids_absent_from_final_prompt': len(selected) - len(visible),
        })
    result = {
        'schema_version': 'are.g02-r11-terminal-prompt-continuity-audit/v1',
        'posture': 'already-exposed-read-only-receipt-diagnostic',
        'script_sha256': sha(Path(__file__)),
        'rows': rows,
        'summary': {
            'episodes': len(rows),
            'episodes_with_recycling': sum(row['recycles'] > 0 for row in rows),
            'selected_read_ids': sum(row['selected_read_ids'] for row in rows),
            'selected_read_ids_literal_in_final_prompt': sum(row['selected_read_ids_literal_in_final_prompt'] for row in rows),
            'episodes_with_selected_id_absent': sum(row['selected_read_ids_absent_from_final_prompt'] > 0 for row in rows),
        },
        'claim_ceiling': 'Prompt-byte continuity only; literal ID presence does not prove semantic use, raw source visibility, correctness, or native score. No model call, gold access, fresh task, or superiority claim.',
        'open_questions': [
            'Does a candidate workspace improve discrimination even when ordinary prompt continuity is intact?',
            'Which source-observable evidence distinguishes changed files from merely related files?'
        ],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps(result['summary'], sort_keys=True))


if __name__ == '__main__':
    main()
