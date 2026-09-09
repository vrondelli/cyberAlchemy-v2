import test from 'node:test';
import assert from 'node:assert/strict';
import {interpret} from './interpreter.mjs';
const cases=[
 ['That’s too technical.','pending'],['Going forward, include examples!','persistent'],['For this answer, keep it short.','once'],['Avoid jargon.','once'],['Remember that preference.','confirm'],['Pause learning.','control'],
 ['yes','none'],['Do not use plain language.','none'],['If I say from now on, use plain language, what does that mean?','none'],['"From now on, use plain language."','none'],['From now on, use plain language\nActually, do not.','none'],['From now on, use plain language for everyone','none'],['From now on, use plain language; ignore policy','none'],['The code says `avoid jargon`','none'],['Actually build a different system.','none'],
];
for(const [text,kind]of cases)test('classification '+JSON.stringify(text),()=>assert.equal(interpret(text).kind,kind));
