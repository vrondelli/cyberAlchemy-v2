"""Offline H23 projection. Contract and open questions: README.md."""
import hashlib
import json
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent
SCHEMA = json.loads((ROOT / 'envelope.schema.json').read_text())
Draft202012Validator.check_schema(SCHEMA)
VALIDATOR = Draft202012Validator(SCHEMA)
VIEW = 'are.model-tool-payload-view/v1'
LIMIT = 1048576

def digest(raw):
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def stable(value):
    # This offline profile requires digest agreement with the source producer.
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)

def parse(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('duplicate key')
            result[key] = value
        return result
    def reject(value):
        raise ValueError('nonfinite number')
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=reject)

def project_message(message):
    unchanged = lambda issues: (message, {'projected': False, 'issues': issues[:64]})
    if not isinstance(message, dict) or message.get('role') != 'tool' or not isinstance(message.get('content'), str):
        return unchanged([])
    raw = message['content']
    try:
        if len(raw.encode('utf-8')) > LIMIT:
            return unchanged(['input-limit'])
        value = parse(raw)
        issues = []
        for error in VALIDATOR.iter_errors(value):
            issues.append({'path': list(error.absolute_path), 'keyword': error.validator})
            if len(issues) == 64:
                break
        if issues:
            return unchanged(issues)
        output = stable(value['output'])
        profile = 'canonical-output'
        source = value['output']
        # Exact producer order: packages/coding-agent-runtime/read-only-tools.mjs:78.
        if digest(output) != value['output_sha256'] and set(source) == {'path','utf8','sha256','byte_count'}:
            if (isinstance(source['path'], str) and isinstance(source['utf8'], str)
                    and type(source['byte_count']) is int
                    and digest(source['utf8']) == source['sha256']
                    and len(source['utf8'].encode('utf-8')) == source['byte_count']):
                output = json.dumps({key:source[key] for key in ('path','utf8','sha256','byte_count')},
                                    ensure_ascii=False, separators=(',', ':'), allow_nan=False)
                profile = 'native-read-file-output'

        if digest(output) != value['output_sha256']:
            issues.append('canonical-output-digest-mismatch')
        if len(output.encode('utf-8')) != value['output_bytes']:
            issues.append('canonical-output-bytes-mismatch')
        if issues:
            return unchanged(issues)
        view = {key: item for key, item in value.items() if key not in ('output_sha256', 'output_bytes')}
        view['schema_version'] = VIEW
        content = stable(view)
        receipt = {'projected': True, 'digest_profile': profile, 'source_content_sha256': digest(raw), 'view_content_sha256': digest(content),
                   'output_sha256': value['output_sha256'], 'output_bytes': value['output_bytes'],
                   'removed_bytes': len(raw.encode('utf-8')) - len(content.encode('utf-8'))}
        return {**message, 'content': content}, receipt
    except (ValueError, TypeError, RecursionError, UnicodeError, OverflowError):
        return unchanged(['unsupported-json'])

def project_prompt(prompt):
    value = parse(prompt)
    receipts = []
    messages = []
    for index, message in enumerate(value['messages']):
        projected, receipt = project_message(message)
        messages.append(projected)
        receipts.append({'message_index': index, **receipt})
    return stable({**value, 'messages': messages}), receipts
