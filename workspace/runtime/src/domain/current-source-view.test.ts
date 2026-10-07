import {describe,expect,it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CURRENT_SOURCE_VIEW} from './current-source-view.generated';
import {CURRENT_ONTOLOGY_GRAPHS} from '../features/ontology/current-graphs.generated';
import {CURRENT_PRODUCT_PROJECT_HIERARCHY} from './current-hierarchy.generated';
import {ProductProjectHierarchy} from './ProductProjectHierarchy';
import {primaryProjectLink} from './product-project-hierarchy';
import {validateGraph} from '../features/ontology/graph';

describe('current working-tree source views',()=>{
 it('preserves source identities and a non-authorizing projection ceiling',()=>{
  expect(CURRENT_SOURCE_VIEW.authorityEffect).toBe('none');
  expect(CURRENT_SOURCE_VIEW.definitions.length).toBeGreaterThan(70);
  expect(CURRENT_SOURCE_VIEW.products.length).toBeGreaterThan(30);
  expect(CURRENT_SOURCE_VIEW.projects.length).toBeGreaterThan(8);
  expect(CURRENT_SOURCE_VIEW.ontologies.length).toBeGreaterThan(30);
  for(const collection of ['definitions','products','projects','ontologies'] as const){
   const records=CURRENT_SOURCE_VIEW[collection];
   expect(new Set(records.map(record=>record.recordId)).size).toBe(records.length);
   for(const record of records){expect(record.sourceRefs.length).toBeGreaterThan(0);expect(record.sourceEpoch).toBe(CURRENT_SOURCE_VIEW.sourceEpoch);expect(record.claimCeiling.length).toBeGreaterThan(0);}
  }
 });
 it('includes the current Orchestrator product and AlchLang capability without calling them admitted',()=>{
  expect(CURRENT_SOURCE_VIEW.products.some(record=>record.recordId==='CA2-PRODUCT-ORCHESTRATOR'&&record.status==='candidate')).toBe(true);
  expect(CURRENT_SOURCE_VIEW.products.some(record=>record.recordId==='CA2-CAP-ALCHLANG-MODEL-GOVERNED-DOMAINS')).toBe(true);
 });
 it('retains exact ontology relations in the graphable source packages',()=>{
  expect(CURRENT_ONTOLOGY_GRAPHS.length).toBeGreaterThan(30);
  for(const graph of CURRENT_ONTOLOGY_GRAPHS){
   expect(graph.profilePath.startsWith('cyberAlchemy-v2/')).toBe(true);
   expect(validateGraph(graph.source)).toEqual([]);
   expect(graph.source.authorityEffect).toBe('none');
  }
 });
 it('makes Define visible beneath the declared CyberAlchemy thesis without fabricating project dependencies',()=>{
  const hierarchy=CURRENT_PRODUCT_PROJECT_HIERARCHY;
  expect(hierarchy.authorityEffect).toBe('none');
  const root=hierarchy.theses.find(thesis=>thesis.productId==='CA2-PRODUCT-CYBERALCHEMY');
  expect(root?.ontologyNodeId).toBe('CA2-THESIS-GOVERNED-HMI');
  expect(root?.proposition).toContain('CyberAlchemy helps people and machines');
  const define=primaryProjectLink('CA2-PROJECT-DEFINE',hierarchy);
  expect(define).toMatchObject({recordId:'CA2-PROJECT-DEFINE',thesisNodeId:'CA2-THESIS-GOVERNED-HMI',relation:'realizes_part_of'});
  expect(define?.goalRefs).toContain('CA2-GOAL-DEFINE-FIRST-CLASS-OWNERSHIP');
  expect(define?.sourceRefs[0]).toContain('goals/projects/define/project.json');
  expect(hierarchy.projectLinks.every(link=>link.sourceRefs.length>0)).toBe(true);
  expect(hierarchy.products.find(product=>product.productId==='CA2-PRODUCT-CRAFT')?.parentProductId).toBe('CA2-PRODUCT-CYBERALCHEMY');
  const html=renderToStaticMarkup(createElement(ProductProjectHierarchy,{hierarchy,projects:CURRENT_SOURCE_VIEW.projects,focus:'projects',selectedId:'CA2-PROJECT-DEFINE',onSelectProject:()=>{}}));
  expect(html).toContain('CyberAlchemy Product Thesis');
  expect(html).toContain('CyberAlchemy v2 Define');
  expect(html).toContain('realizes part of');
 });
});
