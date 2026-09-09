export const factModel = [
  {
    "id": "Commit",
    "fields": [
      {
        "id": "commitId",
        "subject_ref": "Commit",
        "type": "identifier",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "firstParent",
        "subject_ref": "Commit",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "committedAt",
        "subject_ref": "Commit",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "subject",
        "subject_ref": "Commit",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      }
    ]
  },
  {
    "id": "ChangedFile",
    "fields": [
      {
        "id": "path",
        "subject_ref": "ChangedFile",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "previousPath",
        "subject_ref": "ChangedFile",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "changeKind",
        "subject_ref": "ChangedFile",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "fileCommitId",
        "subject_ref": "ChangedFile",
        "type": "identifier",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "inScope",
        "subject_ref": "ChangedFile",
        "type": "boolean",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "commitOrder",
        "subject_ref": "ChangedFile",
        "type": "integer",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      }
    ]
  },
  {
    "id": "ProjectScope",
    "fields": [
      {
        "id": "scopeId",
        "subject_ref": "ProjectScope",
        "type": "identifier",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "projectEntryId",
        "subject_ref": "ProjectScope",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "pathPrefix",
        "subject_ref": "ProjectScope",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      }
    ]
  },
  {
    "id": "RecentView",
    "fields": [
      {
        "id": "viewId",
        "subject_ref": "RecentView",
        "type": "identifier",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "head",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedHead",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "worktree",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedWorktree",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "scope",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedScope",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "branch",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedBranch",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "historyBoundary",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedHistoryBoundary",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "schemaVersion",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedSchemaVersion",
        "subject_ref": "RecentView",
        "type": "string",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "commitLimit",
        "subject_ref": "RecentView",
        "type": "integer",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedCommitLimit",
        "subject_ref": "RecentView",
        "type": "integer",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "pathLimit",
        "subject_ref": "RecentView",
        "type": "integer",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "indexedPathLimit",
        "subject_ref": "RecentView",
        "type": "integer",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      },
      {
        "id": "mutationRequested",
        "subject_ref": "RecentView",
        "type": "boolean",
        "required": true,
        "owner": "cyberalchemy-agent-routing-owner"
      }
    ]
  }
] as const;
