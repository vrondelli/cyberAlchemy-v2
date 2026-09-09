import copy
import json
import unittest
from projection import ROOT, VIEW, digest, stable, project_message, project_prompt


def envelope(output=None):
    output = output if output is not None else {'path':'note.md', 'utf8':'完整 source 🔬', 'next_offset':7, 'nested':{'unfamiliar':[False, None, 3]}}
    body = stable(output)
    return {'schema_version':'are.coding-agent-tool-result/v1', 'ok':True, 'tool_name':'read-file',
            'arguments':{'path':'note.md','offset':0}, 'output':output, 'output_sha256':digest(body),
            'output_bytes':len(body.encode()), 'effect_calls':0, 'authority_effect':'none'}

def message(value):
    return {'role':'tool','tool_call_id':'call-123','extra':'retained','content':stable(value)}

class ProjectionTests(unittest.TestCase):
    def test_preservation_and_idempotence(self):
        source = message(envelope()); before = copy.deepcopy(source)
        result, receipt = project_message(source)
        self.assertTrue(receipt['projected']); self.assertEqual(source, before)
        original = json.loads(source['content']); view = json.loads(result['content'])
        self.assertEqual(view['schema_version'], VIEW)
        for key in original.keys() - {'schema_version','output_bytes','output_sha256'}:
            self.assertEqual(view[key], original[key])
        self.assertEqual({k:v for k,v in result.items() if k!='content'}, {k:v for k,v in source.items() if k!='content'})
        self.assertEqual(project_message(result)[0], result)

    def test_whole_schema_diagnostics(self):
        value = envelope(); value.update(ok=False, effect_calls='0', tool_name=2, surprise='unknown'); del value['arguments']
        source = message(value); result, receipt = project_message(source)
        self.assertEqual(result,source)
        self.assertGreaterEqual(len(receipt['issues']),5)

    def test_unsupported_and_corruption(self):
        mutations = [{'schema_version':'unknown'}, {'ok':False}, {'output_sha256':'0'*64}, {'output_bytes':1}, {'unknown':0}, {'effect_calls':True}]
        for mutation in mutations:
            source = message({**envelope(), **mutation})
            self.assertEqual(project_message(source)[0], source)
        for raw in ['{"ok":true,"ok":false}', '{', '[1]', '{"n":NaN}', 'x'*1048577]:
            source = {'role':'tool','content':raw}
            self.assertEqual(project_message(source)[0],source)
        source = {**message(envelope()), 'role':'user'}
        self.assertEqual(project_message(source)[0],source)

    def test_payload_heavy_negative_control(self):
        source = message(envelope({'utf8':'large source evidence\n'*15000, 'path':'large.md'}))
        result, receipt = project_message(source)
        self.assertTrue(receipt['projected'])
        self.assertEqual(json.loads(result['content'])['output'], json.loads(source['content'])['output'])
        self.assertLess(receipt['removed_bytes'], 150)
        self.assertGreater(len(result['content']),300000)

    def test_all_completed_h22_renders(self):
        paths = sorted((ROOT.parent/'measured-pressure-episode-v1/live').glob('*/rendered.json'))
        self.assertEqual(len(paths),18)
        totals = {'trials':18,'prompts':0,'projected_messages':0,'removed_content_bytes':0,'provider_calls':0}
        sources = []
        for path in paths:
            raw = path.read_text(); source_hash = digest(raw)
            for row in json.loads(raw):
                original = json.loads(row['prompt'])
                projected, receipts = project_prompt(row['prompt']); view = json.loads(projected)
                self.assertEqual({k:v for k,v in original.items() if k!='messages'}, {k:v for k,v in view.items() if k!='messages'})
                self.assertEqual(len(original['messages']),len(view['messages']))
                for before, after, receipt in zip(original['messages'], view['messages'], receipts):
                    if receipt['projected']:
                        a,b = json.loads(before['content']),json.loads(after['content'])
                        self.assertEqual({k:v for k,v in a.items() if k not in ('schema_version','output_bytes','output_sha256')}, {k:v for k,v in b.items() if k!='schema_version'})
                        self.assertEqual({k:v for k,v in before.items() if k!='content'}, {k:v for k,v in after.items() if k!='content'})
                        totals['projected_messages'] += 1
                        totals['removed_content_bytes'] += receipt['removed_bytes']
                    else:
                        self.assertEqual(before,after)
                totals['prompts'] += 1
            self.assertEqual(digest(path.read_text()), source_hash)
            sources.append({'path':str(path),'sha256':source_hash})
        self.assertGreater(totals['projected_messages'],0)
        (ROOT/'preservation-report.json').write_text(json.dumps({'counts':totals,'sources':sources,'token_savings':None,'live_quality':None,'open_questions_ref':'README.md'},indent=2)+'\n')

if __name__ == '__main__':
    unittest.main()
