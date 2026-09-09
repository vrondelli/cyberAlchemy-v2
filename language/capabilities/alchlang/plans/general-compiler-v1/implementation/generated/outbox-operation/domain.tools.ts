export interface CommitOrderWithOutboxRequest { readonly facts: Readonly<Record<string, unknown>>; }
export interface CommitOrderWithOutboxResult { readonly outcome: string; readonly emittedEvents: readonly string[]; }
export interface CommitOrderWithOutboxPort { execute(request: CommitOrderWithOutboxRequest): Promise<CommitOrderWithOutboxResult>; }
