import Certificate from '../../src/certificate';
import BlockcertsV1 from '../fixtures/v1/mainnet-valid-1.2.json';
import fixtureIssuerProfile from '../fixtures/v1/got-issuer_live.json';

describe('End-to-end i18n test suite', function () {
  describe('given the language is set to spanish', function () {
    let certificate;
    let verificationResult;

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
      certificate = new Certificate(BlockcertsV1, { locale: 'es' });
      await certificate.init();
      verificationResult = await certificate.verify();
    });

    afterAll(function () {
      vi.restoreAllMocks();
    });

    it('should set the locale to es', async function () {
      expect(certificate.locale).toBe('es');
    });

    it('should provide the verification in spanish', async function () {
      const expectedOutput = {
        code: 'final',
        message: {
          // eslint-disable-next-line no-template-curly-in-string
          description: 'Este es un certificado válido de ${chain}.',
          label: 'Verificado',
          linkText: 'Ver enlace de transacción'
        },
        status: 'success'
      };
      expect(verificationResult).toEqual(expectedOutput);
    });
  });
});
