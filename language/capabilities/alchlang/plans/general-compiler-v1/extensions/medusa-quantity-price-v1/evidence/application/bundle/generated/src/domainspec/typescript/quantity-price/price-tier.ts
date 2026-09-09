// domainspec.typescript-exact-uint64/v1
// quantity-price:price-tier
export interface ExactRecord {
  readonly "price_id": string;
  readonly "currency": string;
  readonly "amount_minor": bigint | number;
  readonly "min_quantity": bigint | number;
  readonly "max_quantity": bigint | number;
}
