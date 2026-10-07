import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {explicitConfigurationTerms,selectDeprecationClosureHints,selectNamedConfigurationImplementationHints,selectSourceRelationshipHints} from './source-relationship-hints.mjs';

test('explicit dotted configuration identifies a source-only relation',()=>{
  assert.deepEqual(explicitConfigurationTerms('Use `tracing.jaeger.enabled` and tracing.backend'),
    [['tracing','jaeger']]);
  assert.deepEqual(explicitConfigurationTerms('Configuration deprecates `ui.enabled`'),[['ui','enabled']]);
  assert.deepEqual(explicitConfigurationTerms('Configuration deprecates ui.enabled'),[['ui','enabled']]);
  assert.deepEqual(explicitConfigurationTerms('Fix a generic timeout'),[]);
});

test('bounded source packet finds defaults, schemas and fixture in tracked source',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-relation-test-'));
  try{
    execFileSync('git',['init','-q'],{cwd:root});
    for(const [path,content] of Object.entries({
      'config/default.yml':'tracing:\n  jaeger:\n    enabled: false\n',
      'config/app.schema.cue':'#tracing: {\n  jaeger?: {enabled?: bool}\n}\n',
      'config/app.schema.json':'{"tracing":{"jaeger":{"enabled":true}}}',
      'internal/config/testdata/advanced.yml':'tracing:\n  jaeger:\n    endpoint: localhost\n',
      'config/unrelated.yml':'database:\n  sqlite: true\n',
    })){
      mkdirSync(join(root,path,'..'),{recursive:true});writeFileSync(join(root,path),content);
    }
    execFileSync('git',['add','.'],{cwd:root});
    const hints=selectSourceRelationshipHints({root,
      problem_statement:'Configuration for `tracing.jaeger.enabled` is inconsistent'});
    assert.deepEqual(hints.map(h=>h.relationship_category),['default','schema','schema','fixture']);
    assert.equal(new Set(hints.map(h=>h.path)).size,4);
    assert.deepEqual(selectSourceRelationshipHints({root,problem_statement:'Generic timeout'}),[]);
    assert.equal(selectSourceRelationshipHints({root,problem_statement:'tracing.jaeger.enabled',
      existingPaths:['config/default.yml']}).some(h=>h.path==='config/default.yml'),false);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('deprecation closure follows the named configuration package only',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-deprecation-test-'));
  try{
    execFileSync('git',['init','-q'],{cwd:root});
    for(const path of ['internal/config/cache.go','internal/config/database.go','internal/config/ui.go','internal/other/ui.go']){
      mkdirSync(join(root,path,'..'),{recursive:true});
      writeFileSync(join(root,path),'package config\n'+(path==='internal/config/ui.go'?'type UIConfig struct { Enabled bool }\n':'')+
        'func (c *Config) deprecations(v *Viper) []deprecation {\n return nil\n}\n');
    }
    execFileSync('git',['add','.'],{cwd:root});
    const select=problem_statement=>selectDeprecationClosureHints({root,problem_statement,
      seedPaths:['internal/config/tracing.go'],existingPaths:['internal/config/cache.go']});
    assert.deepEqual(select('Deprecation warning for tracing.jaeger.enabled').map(h=>h.path),
      ['internal/config/database.go','internal/config/ui.go']);
    assert.deepEqual(select('Change tracing.jaeger.enabled').map(h=>h.path),[]);
    assert.deepEqual(selectDeprecationClosureHints({root,
      problem_statement:'Deprecation warning for tracing.jaeger.enabled',seedPaths:['internal/other/ui.go']}),[]);
    assert.deepEqual(selectNamedConfigurationImplementationHints({root,
      problem_statement:'Configuration deprecates ui.enabled',seedPaths:['internal/config/config.go']}).map(h=>h.path),
      ['internal/config/ui.go']);
  }finally{rmSync(root,{recursive:true,force:true});}
});
