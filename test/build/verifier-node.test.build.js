import { VERIFICATION_STATUSES } from '../../src';
import FIXTURES from '../fixtures';
import fetch from 'node-fetch';

jest.setTimeout(30000);

// disable node build for the moment
xdescribe('verifier build test suite', function () {
  it('works as expected with a v1 certificate', async function () {
    const verificationStatus = await fetch('http://localhost:4000/verification', {
      body: JSON.stringify({
        blockcerts: FIXTURES.TestnetV1Valid,
        version: 'v1'
      }),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then((res) => res.json());
    expect(verificationStatus.status).toBe(VERIFICATION_STATUSES.SUCCESS);
  });
});
