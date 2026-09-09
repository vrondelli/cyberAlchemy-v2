export interface GovernedDomainDescription {
  "descriptionId": string;
  "domainName": string;
  "domainOwnerId": string;
  "authorityDeclared": boolean;
  "status": string;
}

export interface OntologyTerm {
  "termId": string;
  "name": string;
  "meaning": string;
  "termOwnerId": string;
  "disposition": string;
}

export interface OntologyEdge {
  "edgeId": string;
  "sourceTermRef": string;
  "relationType": string;
  "targetTermRef": string;
  "businessSentence": string;
  "edgeOwnerId": string;
}

export interface DomainDeclaration {
  "declarationId": string;
  "family": string;
  "representation": string;
  "declarationOwnerId": string;
}

export interface SemanticIdentity {
  readonly "id": string;
  readonly "boundedContext": string;
}
export const SemanticIdentityEqualityFields = ["id","boundedContext"] as const;

export type SemanticDisposition = "reuse" | "specialize" | "propose" | "open";
export const SemanticDispositionValues = [{"id":"reuse","description":"Use an existing owned definition without changing its meaning"},{"id":"specialize","description":"Narrow an existing definition to the bounded context"},{"id":"propose","description":"Introduce a candidate definition for owner review"},{"id":"open","description":"Preserve unresolved required meaning"}] as const;

export type DeclarationFamily = "identity" | "immutable-value" | "data-shape" | "vocabulary" | "rule" | "state" | "behavior" | "authority" | "integration" | "presentation";
export const DeclarationFamilyValues = [{"id":"identity","description":"Identity-bearing domain concept"},{"id":"immutable-value","description":"Immutable value semantics"},{"id":"data-shape","description":"Closed typed field shape"},{"id":"vocabulary","description":"Closed named value set"},{"id":"rule","description":"Domain constraint or invariant"},{"id":"state","description":"Lifecycle state and transition semantics"},{"id":"behavior","description":"Requested or evaluated domain behavior"},{"id":"authority","description":"Permission and decision scope"},{"id":"integration","description":"Transport, normalization and persistence contract"},{"id":"presentation","description":"Interaction and presentation contract"}] as const;
