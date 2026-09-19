// domainspec.typescript-exact-uint64/v1
// checkout-quote:checkout-amounts
export interface ExactRecord {
  readonly "checkout_id": string;
  readonly "subtotal_minor": bigint | number;
  readonly "shipping_minor": bigint | number;
}
