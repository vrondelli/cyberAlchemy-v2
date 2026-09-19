import {pathToFileURL} from 'node:url';
const [compiler,source]=process.argv.slice(2);
const api=await import(pathToFileURL(compiler+'/dist/index.js'));
const value=api.compileProject(source);
api.validateCompiledProjectCertificate(value.graph,value.certificate);
process.stdout.write(JSON.stringify(value));
