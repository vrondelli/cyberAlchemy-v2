"""Read-only validation of reconstructed source voices and Craft semantic admission."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def load(path):
    return json.loads(path.read_text())

def validate():
    manifest = load(HERE / 'manifest.json')
    canonical = (ROOT / manifest['canonical_ref']).read_text()
    index = (ROOT / manifest['index_ref']).read_text()
    for ref in [*manifest['source_inputs'].values(), manifest['historical_decision']]:
        assert digest(ROOT / ref['ref']) == ref['sha256'], ref['ref']
    for entry in manifest['definitions']:
        heading = entry['selector']
        assert canonical.count(heading + '\n') == 1, heading
        section = canonical.split(heading + '\n', 1)[1].split('\n## ', 1)[0]
        section = (heading + '\n' + section).strip()
        assert hashlib.sha256(section.encode()).hexdigest() == entry['selector_sha256'], heading
        source = load(ROOT / entry['source_ref'])
        records = source.get('handled_definitions', source.get('revisions', []))
        record = next(r for r in records if r.get('record_id', r.get('candidate_id')) == entry['source_record_id'])
        for key in ['normative_voice', 'formal_voice', 'plain_language_voice', 'domain_context_voice', 'boundary']:
            assert record[key] in section, (heading, key)
        assert index.count('| ' + entry['definition_id'] + ' |') == 1, heading
    language = load(HERE / 'language-v3.json')
    assert language['shared_definition_bindings'] == [{k:e[k] for k in ['definition_id','term','selector','selector_sha256']} for e in manifest['definitions']]
    assert digest(ROOT / language['predecessor_ref']['ref']) == language['predecessor_ref']['sha256']
    state = 'candidate-validated'
    if (HERE / 'admission.json').exists():
        admission = load(HERE / 'admission.json')
        for ref in admission['subjects']:
            assert digest(ROOT / ref['ref']) == ref['sha256'], ref['ref']
        assert admission['state'] == 'admitted'
        assert admission['authority_effect'] == 'craft-orodi-definition-admission-only'
        binding = load(HERE.parent / 'definition-bindings.json')
        assert binding['language_ref'] == str((HERE / 'language-v3.json').relative_to(ROOT))
        assert binding['decision_ref'] == str((HERE / 'admission.json').relative_to(ROOT))
        assert binding['shared_definition_ids'] == [e['definition_id'] for e in manifest['definitions']]
        previous = load(HERE / 'previous-definition-bindings.json')
        assert binding['preserved_capability_ids'] == previous['preserved_capability_ids']
        state = 'admitted-semantic-binding-validated'
    return {'result':'pass','definitions':10,'source_voices':50,'state':state,'authority_effect':'none','runtime_claim':'none'}

if __name__ == '__main__':
    print(json.dumps(validate(), sort_keys=True))
