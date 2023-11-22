import type { Blockcerts, UnsignedBlockcerts } from '../../models/Blockcerts';
import { deepCopy } from '../../helpers/object';

export default function retrieveUnsignedBlockcerts (certificateJson: Blockcerts): UnsignedBlockcerts {
  const certificateCopy: Blockcerts = deepCopy<Blockcerts>(certificateJson);
  if ('signature' in certificateCopy) {
    delete certificateCopy.signature;
  } else if ('receipt' in certificateCopy) {
    delete certificateCopy.receipt;
  }
  return certificateCopy;
}
