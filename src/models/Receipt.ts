import type { MerkleProof2017Anchor } from './MerkleProof2017';

export interface Receipt {
  path?: any[];
  merkleRoot?: string;
  targetHash?: string;
  anchors?: string[] | MerkleProof2017Anchor[];
  // below is merkle proof 2017
  type?: string;
  proof?: any[];
}
