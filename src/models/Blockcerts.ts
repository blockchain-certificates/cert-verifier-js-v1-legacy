import type { BlockcertsV1, UnsignedBlockcertsV1 } from './BlockcertsV1';

export type Blockcerts = BlockcertsV1;
export type UnsignedBlockcerts = UnsignedBlockcertsV1;

// defining input document properties below:
export type AnyProperties = Record<string, any>;

type CustomJsonLDContextDefinition = Record<string, {
  '@id'?: string;
  '@type'?: string;
} | string>;

export type JsonLDContext = Array<string | CustomJsonLDContextDefinition>;
