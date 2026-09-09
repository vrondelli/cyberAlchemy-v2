import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
export function evaluate(interpret, cases) {
 const outcomes=cases.map(c=>({id:c.id,category:c.category,expected:c.expected,actual:interpret(c.input)}));
 const failures=outcomes.filter(c=>!isDeepStrictEqual(c.expected,c.actual));
 const persistent=outcomes.filter(c=>c.expected.kind==='persistent');
 const nonpersistent=outcomes.filter(c=>c.expected.kind!=='persistent');
 return {total:outcomes.length,correct:outcomes.length-failures.length,exact_agreement:(outcomes.length-failures.length)/outcomes.length,persistent_expected:persistent.length,persistent_correct:persistent.filter(c=>isDeepStrictEqual(c.expected,c.actual)).length,false_persistent_promotions:nonpersistent.filter(c=>c.actual.kind==='persistent').length,failures};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const corpusBytes=readFileSync(new URL('./CORPUS.json',import.meta.url));
 const {interpret}=await import(pathToFileURL(process.argv[2]).href);
 console.log(JSON.stringify({corpus_sha256:createHash('sha256').update(corpusBytes).digest('hex'),interpreter_sha256:createHash('sha256').update(readFileSync(process.argv[2])).digest('hex'),...evaluate(interpret,JSON.parse(corpusBytes).cases)},null,2));
}
