// domainspec.typescript-exact-uint64/v1
// quantity-price:quote-request
export interface ExactRecord {
  readonly "request_id": string;
  readonly "requested_currency": string;
  readonly "requested_quantity": bigint | number;
}
