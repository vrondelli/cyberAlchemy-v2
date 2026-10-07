// Synthetic scorer-transfer tests. No reserved answer, label, or provider read.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {historicalPrompt, makeRequests, parseJudgment} from
  './run-beam-100k-ie-r13-source-grounded-judge.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const source = await readFile(new URL(
  './run-beam-500k-r12-source-grounded-judge.mjs', import.meta.url), 'utf8');
const system = historicalPrompt(source);
const fixture = () => {
  const wires = Array.from({length: 64}, (_, index) => {
    const question = `Question ${index}?`;
    const reference = `Expected ${index}`;
    const answer = `Response ${index}`;
    const cited = [{source_turn: index, role: 'user',
      content: `Source ${index}`}];
    return {blind_id: index.toString(16).padStart(24, '0'), question,
      reference_answer: reference, cited_turns: cited, answer,
      question_sha256: sha(question), reference_sha256: sha(reference),
      answer_sha256: sha(answer),
      cited_turns_sha256: sha(JSON.stringify([{content: `Source ${index}`,
        role: 'user', source_turn: index}]))};
  });
  return {
    schema_version: 'are.g03-beam-100k-ie-r13-source-grounded-wires/v1',
    status: 'blinded-after-two-human-label-seal-before-judge',
    label_sha256: 'a'.repeat(64),
    source_preflight_sha256:
      'f2c76a591ead557e1ede2ca61a84237e05b650dad60c43187563ec0cb7d6d9bb',
    review_input_sha256:
      '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970',
    answer_audit_sha256:
      'e3cda154789426075cc39b36fe607721099fef9711443c9b0a166eb1ad7b33b8',
    question_pairs: 32, blind_wires: 64, maximum_judge_calls: 128,
    cited_turns_truncated: false,
    max_cited_source_content_chars: 9, wires
  };
};

test('exact historical prompt and 64 valid scorer requests', () => {
  assert.match(system, /strict source-grounded answer evaluator/);
  const requests = makeRequests(fixture(), system);
  assert.equal(requests.length, 64);
  assert.equal(requests[0].request.messages[0].content, system);
  assert.equal(requests[0].request.max_tokens, 512);
  assert.deepEqual(Object.keys(JSON.parse(requests[0].request.messages[1]
    .content)), ['QUESTION', 'REFERENCE_ANSWER', 'CITED_TURNS', 'RESPONSE']);
});

test('prompt drift and answer/cited-source drift fail closed', () => {
  assert.throws(() => historicalPrompt(source.replace(
    'You are a strict source-grounded',
    'You are a permissive source-grounded')), /historical-prompt-drift/);
  const answerDrift = fixture();
  answerDrift.wires[0].answer = 'changed';
  assert.throws(() => makeRequests(answerDrift, system), /wire-row/);
  const citedDrift = fixture();
  citedDrift.wires[0].cited_turns[0].content = 'changed';
  assert.throws(() => makeRequests(citedDrift, system), /wire-row/);
});

test('strict judgment parser rejects invalid and accepts exact shape', () => {
  const response = {status: 200, payload: {choices: [{finish_reason: 'stop',
    message: {content: '{"correct":true,"reason_code":"direct_match"}'}}],
  usage: {prompt_tokens: 100, completion_tokens: 20}}};
  assert.equal(parseJudgment(response).correct, true);
  response.payload.choices[0].message.content =
    '{"correct":true,"reason_code":"direct_match","extra":1}';
  assert.equal(parseJudgment(response).valid, false);
  response.payload.choices[0].message.content =
    '{"correct":true,"reason_code":"direct_match"}';
  response.payload.usage.completion_tokens = 513;
  assert.equal(parseJudgment(response).valid, false);
});
