import { FakeXmlHttpRequest } from './mocks/FakeXmlHttpRequest';
import { Certificate } from '../../dist/verifier-es';
import v1Fixture from '../fixtures/v1/mainnet-valid-1.2.json';
import v2Fixture from '../fixtures/v2/ethereum-main-valid-2.0.json';
import v3Fixture from '../fixtures/v3/proof-chain-example-secp256k1.json';

// @ts-expect-error we just mock the thing
global.XMLHttpRequest = FakeXmlHttpRequest;

describe('verifier build test suite', function () {
  describe('verifier build test suite', function () {
    it('verifies v1 certificate', async function () {
      const certificate = new Certificate(v1Fixture);
      await certificate.init();
      const result = await certificate.verify();
      expect(result.message).toEqual({
        label: 'Verified',
         
        description: 'This is a valid ${chain} certificate.',
        linkText: 'View transaction link'
      });
      expect(result.status).toBe('success');
    });

    it('does not support v2 verification', async function () {
      expect(async () => {
        const certificate = new Certificate(v2Fixture);
        await certificate.init();
      }).rejects.toThrow('not supported');
    });

    it('does not support v3 verification', async function () {
      expect(async () => {
        const certificate = new Certificate(v3Fixture);
        await certificate.init();
      }).rejects.toThrow('not supported');
    });
  });
});
