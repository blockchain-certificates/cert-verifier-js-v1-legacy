import { VERIFICATION_STATUSES } from '../../src';
import FIXTURES from '../fixtures';
import { FakeXmlHttpRequest } from './mocks/FakeXmlHttpRequest';
const verifier = require('../../dist/verifier-es');

// @ts-expect-error we just mock the thing
global.XMLHttpRequest = FakeXmlHttpRequest;

describe('verifier build test suite', function () {
  it('works as expected with a v1 certificate', async function () {
    const certificate = new verifier.Certificate(FIXTURES.TestnetV1Valid);
    await certificate.init();
    const result = await certificate.verify();
    expect(result.status).toBe(VERIFICATION_STATUSES.SUCCESS);
  });
});
