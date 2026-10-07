"""Classify selected G02 read-ID visibility and handle continuity without gold."""
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
        root = BASE / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        result_path = root / 'evidence/run/result.json'
        result = json.loads(result_path.read_text())
        if result['status'] != 'final_context_selected':
            raise RuntimeError(f'nonterminal:{ordinal}')
        selection = result['selection']
        ids = selection['final_read_ids']
        handles = selection['model_context_handles']
        if len(ids) != len(handles) or len(ids) != len(set(ids)):
            raise RuntimeError(f'selection-handle-binding:{ordinal}')
        prompts = [capture['prompt'] for capture in result['captures']]
        final_prompt = prompts[-1]
        absent = [(read_id, handle) for read_id, handle in zip(ids, handles)
                  if read_id not in final_prompt]
        rows.append({
            'ordinal': ordinal,
            'instance_id': result['instance_id'],
            'result_sha256': sha(result_path),
            'recycles': result['recycling']['recycles'],
            'terminal_generation': result['recycling']['generation'],
            'selected_read_ids': len(ids),
            'selected_ids_literal_in_terminal_prompt': len(ids) - len(absent),
            'selected_ids_absent_but_literal_in_prior_prompt': sum(
                any(read_id in prior for prior in prompts[:-1]) for read_id, _ in absent),
            'selected_ids_absent_but_handle_literal_in_terminal_prompt': sum(
                handle in final_prompt for _, handle in absent),
            'selected_ids_absent_and_handle_absent': sum(
                handle not in final_prompt for _, handle in absent),
            'runtime_added_read_ids': len(selection.get('runtime_added_read_ids', [])),
        })
    fields = ['selected_read_ids', 'selected_ids_literal_in_terminal_prompt',
              'selected_ids_absent_but_literal_in_prior_prompt',
              'selected_ids_absent_but_handle_literal_in_terminal_prompt',
              'selected_ids_absent_and_handle_absent', 'runtime_added_read_ids']
    audit = {
        'schema_version': 'are.g02-r11-terminal-prompt-continuity-audit/v2',
        'posture': 'already-exposed-receipt-only-diagnostic',
        'script_sha256': sha(Path(__file__)),
        'rows': rows,
        'summary': {'episodes': len(rows), 'episodes_with_recycling': sum(row['recycles'] > 0 for row in rows),
                    **{field: sum(row[field] for row in rows) for field in fields}},
        'claim_ceiling': 'Literal token presence only: a handle in the final prompt does not prove the model saw or used raw source. No gold, score, model call, new candidate, or superiority claim.',
        'open_questions': [
            'Do source-grounded comparisons help classify needed files when handle continuity already exists?',
            'Does terminal prompt compression remove decisive source bytes despite handle visibility?'
        ],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('x') as stream:
        json.dump(audit, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps(audit['summary'], sort_keys=True))


if __name__ == '__main__':
    main()
