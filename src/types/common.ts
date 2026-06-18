// Branded primitive type aliases for domain safety
export type DecimalString    = string & { readonly _brand: 'DecimalString' };
export type UInt64String     = string & { readonly _brand: 'UInt64String' };
export type InstrumentName   = string & { readonly _brand: 'InstrumentName' };
export type IdempotencyKey   = string & { readonly _brand: 'IdempotencyKey' };

export interface Money {
  amount:   DecimalString;
  currency: string;
}
