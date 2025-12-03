import { Certificate } from '../../src';
import verificationsStepsV1Mainnet from '../assertions/verification-steps-v1-mainnet';
import BlockcertsV1 from '../fixtures/v1/mainnet-valid-1.2.json';
import fixtureIssuerProfile from '../fixtures/v1/got-issuer_live.json';

beforeAll(async function () {
  vi.mock('@blockcerts/explorer-lookup', async (importOriginal) => {
    const original = await importOriginal();

    return {
      ...original,
      request: async function ({ url }) {
        if (url === 'http://www.blockcerts.org/mockissuer/issuer/got-issuer_live.json') {
          return JSON.stringify(fixtureIssuerProfile);
        }
      }
    };
  });
});

afterAll(function () {
  vi.restoreAllMocks();
});

describe('Certificate API Contract test suite', function () {
  describe('verificationSteps property', function () {
    it('is available for a Mainnet certificate', async function () {
      const instance = new Certificate(BlockcertsV1);
      await instance.init();
      expect(instance.verificationSteps).toEqual(verificationsStepsV1Mainnet);
    });
  });
});
