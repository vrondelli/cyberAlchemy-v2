export interface Commit {
  "commitId": string;
  "firstParent": string;
  "committedAt": string;
  "subject": string;
}

export interface ChangedFile {
  "path": string;
  "previousPath": string;
  "changeKind": string;
  "fileCommitId": string;
  "inScope": boolean;
  "commitOrder": number;
}

export interface ProjectScope {
  "scopeId": string;
  "projectEntryId": string;
  "pathPrefix": string;
}

export interface RecentView {
  "viewId": string;
  "head": string;
  "indexedHead": string;
  "worktree": string;
  "indexedWorktree": string;
  "scope": string;
  "indexedScope": string;
  "branch": string;
  "indexedBranch": string;
  "historyBoundary": string;
  "indexedHistoryBoundary": string;
  "schemaVersion": string;
  "indexedSchemaVersion": string;
  "commitLimit": number;
  "indexedCommitLimit": number;
  "pathLimit": number;
  "indexedPathLimit": number;
  "mutationRequested": boolean;
}
