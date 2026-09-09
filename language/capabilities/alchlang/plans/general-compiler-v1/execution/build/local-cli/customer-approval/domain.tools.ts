export interface ReleaseCreditRequest { readonly facts: Readonly<Record<string, unknown>>; }
export interface ReleaseCreditResult { readonly outcome: string; readonly emittedEvents: readonly string[]; }
export interface ReleaseCreditPort { execute(request: ReleaseCreditRequest): Promise<ReleaseCreditResult>; }
