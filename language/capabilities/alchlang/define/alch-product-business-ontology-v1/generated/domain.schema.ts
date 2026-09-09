export const factModel = [
  {
    "id": "GovernedDomainDescription",
    "fields": [
      {
        "id": "descriptionId",
        "subject_ref": "GovernedDomainDescription",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "domainName",
        "subject_ref": "GovernedDomainDescription",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "domainOwnerId",
        "subject_ref": "GovernedDomainDescription",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "authorityDeclared",
        "subject_ref": "GovernedDomainDescription",
        "type": "boolean",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "status",
        "subject_ref": "GovernedDomainDescription",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      }
    ]
  },
  {
    "id": "OntologyTerm",
    "fields": [
      {
        "id": "termId",
        "subject_ref": "OntologyTerm",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "name",
        "subject_ref": "OntologyTerm",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "meaning",
        "subject_ref": "OntologyTerm",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "termOwnerId",
        "subject_ref": "OntologyTerm",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "disposition",
        "subject_ref": "OntologyTerm",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      }
    ]
  },
  {
    "id": "OntologyEdge",
    "fields": [
      {
        "id": "edgeId",
        "subject_ref": "OntologyEdge",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "sourceTermRef",
        "subject_ref": "OntologyEdge",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "relationType",
        "subject_ref": "OntologyEdge",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "targetTermRef",
        "subject_ref": "OntologyEdge",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "businessSentence",
        "subject_ref": "OntologyEdge",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "edgeOwnerId",
        "subject_ref": "OntologyEdge",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      }
    ]
  },
  {
    "id": "DomainDeclaration",
    "fields": [
      {
        "id": "declarationId",
        "subject_ref": "DomainDeclaration",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "family",
        "subject_ref": "DomainDeclaration",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "representation",
        "subject_ref": "DomainDeclaration",
        "type": "string",
        "required": true,
        "owner": "alch-language-owner"
      },
      {
        "id": "declarationOwnerId",
        "subject_ref": "DomainDeclaration",
        "type": "identifier",
        "required": true,
        "owner": "alch-language-owner"
      }
    ]
  }
] as const;
