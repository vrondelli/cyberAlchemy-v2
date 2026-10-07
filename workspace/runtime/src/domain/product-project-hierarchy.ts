export interface ThesisView {
  readonly thesisId: string;
  readonly ontologyNodeId: string | null;
  readonly productId: string;
  readonly title: string;
  readonly proposition: string;
  readonly commitment: string;
  readonly sourceRefs: readonly string[];
  readonly claimCeiling: string;
}

export interface ProductView {
  readonly productId: string;
  readonly label: string;
  readonly parentProductId: string | null;
  readonly sourceRefs: readonly string[];
}

export interface ProjectThesisLink {
  readonly projectId: string;
  readonly recordId: string;
  readonly thesisNodeId: string;
  readonly relation: string;
  readonly selector: string | null;
  readonly goalRefs: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface ProductProjectHierarchy {
  readonly authorityEffect: 'none';
  readonly products: readonly ProductView[];
  readonly theses: readonly ThesisView[];
  readonly projectLinks: readonly ProjectThesisLink[];
}

// A project may cite the parent thesis and a more specific thesis. Display it
// at the most specific declared link; retain every link for the detail view.
export function primaryProjectLink(projectId: string, hierarchy: ProductProjectHierarchy): ProjectThesisLink | undefined {
  const links=hierarchy.projectLinks.filter(link=>link.projectId===projectId);
  const rootThesis=new Set(hierarchy.theses.filter(thesis=>hierarchy.products.find(product=>product.productId===thesis.productId)?.parentProductId===null).map(thesis=>thesis.ontologyNodeId));
  return links.find(link=>!rootThesis.has(link.thesisNodeId))??links[0];
}
