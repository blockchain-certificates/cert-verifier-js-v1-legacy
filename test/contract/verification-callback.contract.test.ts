import { Certificate, VERIFICATION_STATUSES } from '../../src';
import type { IVerificationStepCallbackAPI } from '../../src/verifier';
import BlockcertsV1 from '../fixtures/v1/mainnet-valid-1.2.json';
import fixtureIssuerProfile from '../fixtures/v1/got-issuer_live.json';

describe('when the certificate verified', function () {
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

  it('should have called the verification callback with the steps information', async function () {
    const calledSteps: Record<string, VERIFICATION_STATUSES> = {};
    function verificationCallback ({ code, status }: IVerificationStepCallbackAPI): void {
      calledSteps[code] = status;
    }
    const instance = new Certificate(BlockcertsV1);
    await instance.init();
    await instance.verify(verificationCallback);
    const expectedOutput = instance.verificationSteps.reduce((acc, curr) => {
      const subStepsCode = curr.subSteps.map(substep => substep.code);
      const suiteStepsCode = curr.suites?.flatMap(
        suite => suite.subSteps.map(substep => substep.code)
      ) ?? [];
      [...subStepsCode, ...suiteStepsCode].forEach(step => {
        acc[step] = VERIFICATION_STATUSES.SUCCESS;
      });
      return acc;
    }, {});
    expect(calledSteps).toEqual(expectedOutput);
  });
});
