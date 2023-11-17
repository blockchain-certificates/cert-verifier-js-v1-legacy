import { BLOCKCHAINS, isTestChain } from '@blockcerts/explorer-lookup';
import type { IBlockchainObject } from '@blockcerts/explorer-lookup';

export enum SupportedChains {
  Bitcoin = 'bitcoin',
  Ethmain = 'ethmain',
  Ethropst = 'ethropst',
  Ethrinkeby = 'ethrinkeby',
  Mocknet = 'mocknet',
  Regtest = 'regtest',
  Testnet = 'testnet'
}

export {
  BLOCKCHAINS,
  isTestChain,
  IBlockchainObject
};
