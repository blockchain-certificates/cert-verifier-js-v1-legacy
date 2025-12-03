import { Certificate, VERIFICATION_STATUSES } from '../../../src';
import fixtureIssuerProfile from '../../fixtures/v1/got-issuer_live.json';
import fixtureBlockcertsV1 from '../../fixtures/v1/mainnet-valid-1.2.json';

describe('given the certificate is a valid testnet (v1.2)', function () {
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

  it('should verify successfully', async function () {
    const certificate = new Certificate(fixtureBlockcertsV1 as any);
    await certificate.init();
    const result = await certificate.verify();
    expect(result.status).toBe(VERIFICATION_STATUSES.SUCCESS);
  });
});
