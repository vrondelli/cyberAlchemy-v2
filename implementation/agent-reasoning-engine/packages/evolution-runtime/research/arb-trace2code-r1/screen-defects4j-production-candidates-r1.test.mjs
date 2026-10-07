import assert from 'node:assert/strict';
import {test} from 'node:test';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';
test('production selection distinguishes source paths from test caller paths', () => {
  for (const path of ['src/main/java/p/Example.java','src/java/p/Parser.java','source/p/Contest.java'])
    assert.equal(productionPath(path), true, path);
  for (const path of ['src/test/java/p/Example.java','tests/p/Foo.java','src/testsrc/p/Foo.java',
    'src/java/p/ExampleTest.java','src/java/p/TestExample.java','src/java/p/ExampleTests.java',
    'src/java/p/ExampleTestCase.java','src/main/java/p/readme.md'])
    assert.equal(productionPath(path), false, path);
});
