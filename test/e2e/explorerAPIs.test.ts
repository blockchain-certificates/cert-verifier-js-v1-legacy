import sinon from 'sinon';
import * as RequestService from '@blockcerts/explorer-lookup/lib/cjs/services/request.js';
import * as ExplorerLookup from '@blockcerts/explorer-lookup';
import type { ExplorerAPI } from '@blockcerts/explorer-lookup';
import Certificate from '../../src/certificate';
import BlockcertsV1 from '../fixtures/v1/testnet-valid-1.2.json';
import issuerProfileV1JsonFixture from '../fixtures/v1/got-issuer_live.json';

describe('explorerAPIs end to end test suite', function () {
  describe('given a custom explorer API with a parsingFunction is set', function () {
    describe('and the verification process occurs', function () {
      it('should call the parsing function', async function () {
        const parsingFunctionStub: sinon.SinonStub = sinon.stub().resolves({
          remoteHash: '68f3ede17fdb67ffd4a5164b5687a71f9fbb68da803b803935720f2aa38f7728',
          issuingAddress: '1Q3P94rdNyftFBEKiN1fxmt2HnQgSCB619',
          time: '2016-10-03T19:52:55.000Z',
          revokedAddresses: []
        });
        const explorerAPI: ExplorerAPI = {
          serviceURL: {
            main: 'https://blockcerts.org/test',
            test: 'https://blockcerts.org/test'
          },
          priority: 0,
          parsingFunction: parsingFunctionStub
        };

        // this stub will target the request function directly from explorer lookup
        const dependencyRequestStub = sinon.stub(RequestService, 'default');
        dependencyRequestStub.withArgs({
          url: 'https://blockcerts.org/test'
        }).resolves('{}');
        dependencyRequestStub.withArgs({
          url: 'https://api.blockcypher.com/v1/btc/test3/txs/140ee9382a5c84433b9c89a5d9fea26c47415838b5841deb0c36a8a4b9121f2e?limit=500'
        }).resolves('{}');
        dependencyRequestStub.withArgs({
          url: 'https://blockstream.info/testnet/api/tx/140ee9382a5c84433b9c89a5d9fea26c47415838b5841deb0c36a8a4b9121f2e'
        }).resolves('{}');
        // this stub will target the same function but as consumed by cert-verifier-js
        const localRequestStub = sinon.stub(ExplorerLookup, 'request');
        localRequestStub.withArgs({
          url: 'http://www.blockcerts.org/mockissuer/issuer/got-issuer_live.json'
        }).resolves(JSON.stringify(issuerProfileV1JsonFixture));
        const instance = new Certificate(BlockcertsV1, { explorerAPIs: [explorerAPI] });
        await instance.init();
        await instance.verify();
        expect(parsingFunctionStub.calledOnce).toBe(true);
        sinon.restore();
      });
    });
  });
});
