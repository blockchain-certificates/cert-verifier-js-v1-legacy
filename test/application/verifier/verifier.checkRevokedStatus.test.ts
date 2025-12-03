import Verifier from '../../../src/verifier';
import fixtureV1 from '../../fixtures/v1/mainnet-valid-1.2.json';
import fixtureIssuerProfile from '../../fixtures/v1/got-issuer_live.json';

describe('Verifier checkRevokedStatus method test suite', function () {
  beforeAll(function () {
    vi.mock('@blockcerts/explorer-lookup', async (importOriginal) => {
      const original = await importOriginal();

      return {
        ...original,
        request: async function ({ url }) {
          if (url === 'http://www.blockcerts.org/mockissuer/issuer/got-issuer_live.json') {
            return JSON.stringify(fixtureIssuerProfile);
          }
        },
        lookForTx: () => ({
          remoteHash: '68f3ede17fdb67ffd4a5164b5687a71f9fbb68da803b803935720f2aa38f7728',
          issuingAddress: '1Q3P94rdNyftFBEKiN1fxmt2HnQgSCB619',
          time: '2016-10-03T19:52:55.000Z',
          revokedAddresses: [
            '1AAGG6jirbu9XwikFpkHokbbiYpjVtFe1G',
            '1K4P4LKXWZZ5bS2i34zLaJkHxbFBreDoTa',
            '18AaFyeWmsasbSh2GsjGTtrNHqiJgsN6nB',
            '16wyA4kLFiaQSEE9xZEFTEMXTzWsGf4Zki',
            '1PrmJ6pGbfe4ucNCVbe4tbXRRHMsDDSxvY',
            '1Q3P94rdNyftFBEKiN1fxmt2HnQgSCB619'
          ]
        })
      };
    });
  });

  afterAll(function () {
    vi.restoreAllMocks();
  });

  describe('given the revocation of the certificate is handled by the legacy (Blockcerts) approach', function () {
    // WE DO NOT HAVE A REVOKED V1 CERT to test with
    // describe('and the certificate is revoked', function () {
    //   it('should record the verification step failure', async function () {
    //     const fixture = MainnetV2Revoked;
    //     const verifier = new Verifier({
    //       certificateJson: fixture,
    //       expires: '',
    //       id: fixture.id,
    //       issuer: fixture.badge.issuer,
    //       revocationKey: null,
    //       explorerAPIs: undefined
    //     });
    //     await verifier.init();
    //     await (verifier as any).checkRevokedStatus(); // private method
    //     expect((verifier as any)._stepsStatuses).toEqual([{
    //       code: 'checkRevokedStatus',
    //       message: 'This certificate has been revoked by the issuer. Reason given: Incorrect Issue Date. New credential to be issued.',
    //       status: 'failure'
    //     }]);
    //   });
    // });

    describe('and the certificate is not revoked', function () {
      it('should record the verification step success', async function () {
        const fixture = fixtureV1;
        const verifier = new Verifier({
          certificateJson: fixture,
          expires: '',
          id: fixture.document.assertion.id,
          issuer: fixtureIssuerProfile,
          revocationKey: null,
          explorerAPIs: undefined
        });
        await verifier.init();
        await (verifier as any).checkRevokedStatus(); // private method
        expect((verifier as any)._stepsStatuses).toEqual([{
          code: 'checkRevokedStatus',
          status: 'success'
        }]);
      });
    });
  });
});
