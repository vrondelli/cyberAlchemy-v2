import type {WorkspaceRecord} from './workspace';
import type {ReactNode} from 'react';
import {primaryProjectLink,type ProductProjectHierarchy as Hierarchy,type ProductView} from './product-project-hierarchy';

interface Props {
  readonly hierarchy:Hierarchy;
  readonly projects:readonly WorkspaceRecord[];
  readonly focus:'products'|'projects';
  readonly selectedId:string;
  readonly onSelectProject:(recordId:string)=>void;
}

export function ProductProjectHierarchy({hierarchy,projects,focus,selectedId,onSelectProject}:Props){
 const thesisByProduct=new Map(hierarchy.theses.map(thesis=>[thesis.productId,thesis]));
 const projectIds=[...new Set(hierarchy.projectLinks.map(link=>link.projectId))];
 const projectById=new Map(projects.map(project=>[project.recordId,project]));
 const draw=(product:ProductView,depth:number):ReactNode=>{
  const thesis=thesisByProduct.get(product.productId);
  const children=hierarchy.products.filter(candidate=>candidate.parentProductId===product.productId);
  const linked=thesis?projectIds.map(id=>primaryProjectLink(id,hierarchy)).filter(link=>link?.thesisNodeId===thesis.ontologyNodeId):[];
  return <section className={`hierarchy-product hierarchy-depth-${Math.min(depth,2)}`} key={product.productId} aria-label={`${product.label} product`}>
   <header className="hierarchy-product-head"><span className="hierarchy-kind">Product</span><h3>{product.label}</h3><code>{product.productId}</code></header>
   {thesis?<div className="hierarchy-thesis"><div className="hierarchy-thesis-head"><span className="hierarchy-kind">Product thesis · {thesis.commitment}</span><strong>{thesis.title}</strong></div><p>{thesis.proposition}</p><details><summary>Thesis provenance and limit</summary><p>{thesis.sourceRefs.join(' · ')}</p><p>{thesis.claimCeiling}</p></details></div>:<p className="hierarchy-gap">No Product Thesis record is linked in this projection.</p>}
   {linked.length>0&&<div className="hierarchy-projects"><p className="hierarchy-subhead">Projects connected to this thesis <span>{linked.length}</span></p>{linked.map(link=>{if(!link)return null;const record=projectById.get(link.recordId);return <button className={`hierarchy-project${selectedId===link.recordId?' selected':''}`} key={`${link.projectId}:${link.thesisNodeId}`} type="button" onClick={()=>onSelectProject(link.recordId)}><span><strong>{record?.label??link.projectId}</strong><small>{link.projectId}</small></span><span className="hierarchy-project-relation">{link.relation.replaceAll('_',' ')}{link.selector?` · ${link.selector}`:''}</span>{focus==='projects'&&record?.meaning&&<span className="hierarchy-project-purpose">{record.meaning}</span>}</button>})}</div>}
   {children.length>0&&<div className="hierarchy-children">{children.map(child=>draw(child,depth+1))}</div>}
  </section>;
 };
 const roots=hierarchy.products.filter(product=>!product.parentProductId);
 const tree=roots.map(product=>draw(product,0));
 const unlinked=projects.filter(project=>!hierarchy.projectLinks.some(link=>link.recordId===project.recordId||link.projectId===project.recordId.split('@')[0]));
 return <section className="product-project-hierarchy" aria-label="Product and project hierarchy">
  <div className="hierarchy-intro"><div><p className="eyebrow">Source-declared relationships</p><h2>{focus==='projects'?'How projects relate to product theses':'Products, theses, and projects'}</h2></div><p>Projects sharing a thesis are shown together; that is not a declared dependency between them. Select a project to inspect its source record below.</p></div>
  <div className="hierarchy-trees">{tree}</div>
  {unlinked.length>0&&<details className="hierarchy-unlinked"><summary>{unlinked.length} project record(s) without a thesis link in this projection</summary><ul>{unlinked.map(project=><li key={project.recordId}>{project.label} · {project.recordId}</li>)}</ul></details>}
 </section>;
}
