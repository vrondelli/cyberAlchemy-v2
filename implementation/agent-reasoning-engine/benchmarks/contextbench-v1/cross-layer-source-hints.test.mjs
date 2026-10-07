import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import test from 'node:test';
import {selectCrossLayerSourceHints} from './cross-layer-source-hints.mjs';

test('source-only objective identifies bounded schema, view, client, and controller surfaces',()=>{
  const root=mkdtempSync(join(tmpdir(),'cross-layer-hints-'));
  try{
    const files={
      'public/openapi/schemas/SettingsObj.yaml':'type: object\nrestrictChat: boolean\n',
      'src/views/admin/settings/user.tpl':'<input id="restrictChat">\n',
      'public/src/client/account/settings.js':'function loadSettings() {}\n',
      'src/controllers/accounts/settings.js':'const settingsController = {};\n',
      'public/src/client/chats.js':'function other() {}\n',
      'src/views/admin/settings/other.tpl':'unrelated\n',
    };
    for(const [path,contents] of Object.entries(files)){mkdirSync(join(root,dirname(path)),{recursive:true});writeFileSync(join(root,path),contents);}
    execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
    const issue='Users need account settings for chat. Existing restrictChat is insufficient.';
    const hints=selectCrossLayerSourceHints({root,problem_statement:issue});
    assert.deepEqual(hints.map(hint=>hint.layer),['schema','view','client','controller']);
    assert.equal(hints.every(hint=>hint.start_line>=1&&hint.end_line>=hint.start_line),true);
    assert.deepEqual(selectCrossLayerSourceHints({root,problem_statement:issue,existingPaths:['src/views/admin/settings/user.tpl']}).map(hint=>hint.layer),['schema','client','controller']);
    assert.deepEqual(selectCrossLayerSourceHints({root,problem_statement:'Investigate chat permissions'}),[]);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('task-title terms propose cross-layer group invitation reads without a camelCase identifier',()=>{
  const root=mkdtempSync(join(tmpdir(),'cross-layer-groups-'));
  try{
    const files={
      'public/openapi/groups/invitations.yaml':'group invitations can be accepted through the API\n',
      'src/views/groups/invitations.tpl':'Group invitations are shown here\n',
      'public/src/client/groups/invitations.js':'render group invitations for the client\n',
      'src/controllers/groups/invitations.js':'handle group invitations for the API\n',
      'src/controllers/other.js':'unrelated\n',
    };
    for(const [path,contents] of Object.entries(files)){mkdirSync(join(root,dirname(path)),{recursive:true});writeFileSync(join(root,path),contents);}
    execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
    const hints=selectCrossLayerSourceHints({root,problem_statement:'Title: API group invitations. Add authenticated routes for group invitations.'});
    assert.deepEqual(hints.map(hint=>hint.layer),['schema','view','client','controller']);
    assert.equal(hints.every(hint=>hint.matched_terms.includes('group')),true);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('a delivered database API call proposes one implementation read per backend',()=>{
  const root=mkdtempSync(join(tmpdir(),'cross-layer-db-'));
  try{
    const files={
      'src/user/email.js':"const db = require('../database');\nawait db.pexpire('confirm:1', 1000);\n",
      'src/database/mongo/main.js':'module.pexpire = async function (key, ms) {};\n',
      'src/database/postgres/main.js':'module.pexpire = async function (key, ms) {};\n',
      'src/database/redis/main.js':'module.pexpire = async function (key, ms) {};\n',
      'src/database/redis/unrelated.js':'module.other = async function () {};\n',
    };
    for(const [path,contents] of Object.entries(files)){mkdirSync(join(root,dirname(path)),{recursive:true});writeFileSync(join(root,path),contents);}
    execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
    const hints=selectCrossLayerSourceHints({root,problem_statement:'Email validation expiry fails',existingPaths:['src/user/email.js']});
    assert.deepEqual(hints.map(hint=>hint.layer),['database-mongo','database-postgres','database-redis']);
    assert.equal(hints.every(hint=>hint.matched_terms.includes('pexpire')),true);
    const siblingHints=selectCrossLayerSourceHints({root,problem_statement:'Bulk database expiration is inconsistent',existingPaths:['src/database/mongo/main.js']});
    assert.deepEqual(siblingHints.map(hint=>hint.layer),['database-postgres','database-redis']);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('Go issue verbs seed CLI and implementation paths before UI homonyms',()=>{
  const root=mkdtempSync(join(tmpdir(),'cross-layer-go-'));
  try{
    const files={
      'go.mod':'module example.com/flipt\n',
      'cmd/flipt/import.go':'func Import() { /* validate namespace version */ }\n',
      'cmd/flipt/export.go':'func Export() { /* export namespace version */ }\n',
      'internal/ext/importer.go':'func ImportYAML() { /* import namespace version */ }\n',
      'internal/ext/exporter.go':'func ExportYAML() { /* export namespace version */ }\n',
      'internal/ext/importer_test.go':'func TestImport() { /* import namespace version */ }\n',
      'ui/src/data/hooks/namespace.ts':'export function namespace() {}\n',
    };
    for(const [path,contents] of Object.entries(files)){mkdirSync(join(root,dirname(path)),{recursive:true});writeFileSync(join(root,path),contents);}
    execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
    const hints=selectCrossLayerSourceHints({root,problem_statement:'Add namespace and version metadata to export files; validate on import.'});
    assert.deepEqual(hints.map(hint=>hint.path),[
      'cmd/flipt/import.go','cmd/flipt/export.go','internal/ext/exporter.go','internal/ext/importer.go']);
    assert.equal(hints.every(hint=>hint.path.endsWith('.go')),true);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('Go action hints bind the method body instead of a shallow file prefix',()=>{
  const root=mkdtempSync(join(tmpdir(),'cross-layer-go-window-'));
  try{
    const files={
      'go.mod':'module example.com/flipt\n',
      'cmd/flipt/import.go':`${'// setup\n'.repeat(60)}func (c *importCommand) run() error {\n  // import namespace version\n  return nil\n}\n`,
      'internal/ext/importer.go':`${'// setup\n'.repeat(70)}func (i *Importer) Import() error {\n  // import namespace version\n  return nil\n}\n`,
    };
    for(const [path,contents] of Object.entries(files)){mkdirSync(join(root,dirname(path)),{recursive:true});writeFileSync(join(root,path),contents);}
    execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
    const hints=selectCrossLayerSourceHints({root,problem_statement:'Import namespace and version metadata.'});
    assert.deepEqual(hints.map(hint=>hint.path),['cmd/flipt/import.go','internal/ext/importer.go']);
    assert.equal(hints.every(hint=>hint.start_line>50&&hint.end_line>=hint.start_line+5),true);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('Go named type closes over its object implementation siblings',()=>{
  const root=mkdtempSync(join(tmpdir(),'cross-layer-go-named-'));
  try{
    const files={
      'go.mod':'module example.com/flipt\n',
      'internal/storage/fs/object/fileinfo.go':'type FileInfo struct {}\nfunc NewFileInfo() *FileInfo { return nil }\n',
      'internal/storage/fs/object/file.go':'type File struct {}\nfunc (f *File) Stat() FileInfo { return FileInfo{} }\n',
      'internal/storage/fs/object/store.go':'func Load() { NewFile() }\n',
      'internal/storage/fs/object/fileinfo_test.go':'func TestFileInfo() {}\n',
      'internal/storage/fs/snapshot.go':'func GetVersion() string { return "namespace version" }\n',
    };
    for(const [path,contents] of Object.entries(files)){mkdirSync(join(root,dirname(path)),{recursive:true});writeFileSync(join(root,path),contents);}
    execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
    const issue='Namespace version is empty in filesystem snapshots. '+
      'The file constructor and FileInfo must expose an ETag; GetVersion must report unknown namespaces.';
    const hints=selectCrossLayerSourceHints({root,problem_statement:issue});
    assert.deepEqual(hints.map(hint=>hint.path),[
      'internal/storage/fs/object/fileinfo.go','internal/storage/fs/object/file.go',
      'internal/storage/fs/object/store.go','internal/storage/fs/snapshot.go']);
  }finally{rmSync(root,{recursive:true,force:true});}
});
