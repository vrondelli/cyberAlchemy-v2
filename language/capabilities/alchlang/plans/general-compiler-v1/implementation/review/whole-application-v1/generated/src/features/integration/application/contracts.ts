import type {ApplicationInput,ApplicationResult} from "../../../integrations/domain-bindings.js";
export interface ProviderAcceptanceReceipt {
  readonly acceptance_boundary_ref:string;
  readonly provider_acknowledgement_ref:string;
  readonly claim_ceiling:"provider-accepted";
  readonly delivery_observed:false;
  readonly consumer_completion_observed:false;
}

export interface ContractOrdersStore {
  readonly "load": (input: ApplicationInput) => Promise<ApplicationResult>;
  readonly "save": (input: ApplicationInput) => Promise<ApplicationResult>;
}

export interface ContractPaymentGateway {
  readonly "provider-call": (input: ApplicationInput) => Promise<ApplicationResult>;
}

export interface ContractPublishOrderPublisher {
  readonly "publish": (input: ApplicationInput) => Promise<ProviderAcceptanceReceipt>;
}
