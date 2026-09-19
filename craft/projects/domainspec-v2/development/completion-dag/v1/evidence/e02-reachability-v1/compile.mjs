import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const compiler = await import(pathToFileURL(path.resolve(process.argv[2], 'dist/index.js')));
for (const name of ['system-model', 'example-project']) {
  const source = path.join(root, name);
  const {graph, certificate} = compiler.compileProject(source);
  compiler.validateCompiledProjectCertificate(graph, certificate);
  const second = compiler.compileProject(source);
  if (JSON.stringify(second) !== JSON.stringify({graph, certificate})) throw Error('Compilation drift');
  const output = path.join(root, 'compiled', name);
  fs.mkdirSync(output, {recursive: true});
  for (const [file, value] of [['graph.json', graph], ['certificate.json', certificate]]) {
    fs.writeFileSync(path.join(output, file), JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
  }
  console.log(JSON.stringify({name, nodes: graph.nodes.length, edges: graph.relationships.length,
    graph_sha256: certificate.graph_sha256, certificate_valid: true, repeat_identical: true}));
}
