export interface AcceptDomainMeaningRequest { readonly facts: Readonly<Record<string, unknown>>; }
export interface AcceptDomainMeaningResult { readonly outcome: string; readonly emittedEvents: readonly string[]; }
export interface AcceptDomainMeaningPort { execute(request: AcceptDomainMeaningRequest): Promise<AcceptDomainMeaningResult>; }
