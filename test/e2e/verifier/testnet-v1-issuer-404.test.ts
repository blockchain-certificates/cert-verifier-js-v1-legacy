import { Certificate } from '../../../src';
import FIXTURES from '../../fixtures';

describe('given the certificate\'s issuer returns a 404', function () {
  it('should fail', async function () {
    const certificate = new Certificate(FIXTURES.TestnetV1IssuerUrl404);
    await expect(async () => {
      await certificate.init();
    }).rejects.toThrow('Unable to get issuer profile');
  });
});
