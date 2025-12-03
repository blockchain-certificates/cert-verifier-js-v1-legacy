import getIssuerProfile from '../../../../../src/domain/verifier/useCases/getIssuerProfile';
import fixtureIssuerProfile from '../../../../fixtures/v1/got-issuer_live.json';
import fixtureV1 from '../../../../fixtures/v1/mainnet-valid-1.2.json';

let explorerLookup;

beforeAll(async function () {
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

  explorerLookup = await import('@blockcerts/explorer-lookup');
});

afterAll(function () {
  vi.restoreAllMocks();
});

describe('Verifier domain getIssuerProfile use case test suite', function () {
  describe('given it is called without an issuerAddress parameter', function () {
    it('should throw an error', async function () {
      // @ts-expect-error: we are testing an empty case
      await expect(getIssuerProfile()).rejects.toThrow(
        'Unable to get issuer profile - no issuer address given'
      );
    });
  });

  describe('given it is called with an issuerAddress parameter', function () {
    const issuerAddressV1Fixture = fixtureV1.document.certificate.issuer;

    describe('and the Blockcerts version is v1', function () {
      it('should request the profile address from the issuer object and return the issuer profile', async function () {
        const result = await getIssuerProfile(issuerAddressV1Fixture);
        expect(result).toEqual(fixtureIssuerProfile);
      });
    });

    describe('when the request fails', function () {
      it('should throw an error', async function () {
        const errorMessageFixture = 'Unable to get issuer profile';
        const spy = vi
          .spyOn(explorerLookup, 'request')
          .mockRejectedValue(new Error(errorMessageFixture));

        await expect(getIssuerProfile(issuerAddressV1Fixture))
          .rejects.toThrow(errorMessageFixture);

        spy.mockRestore();
      });
    });
  });
});
