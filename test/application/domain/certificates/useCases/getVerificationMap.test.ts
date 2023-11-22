import domain from '../../../../../src/domain';
import verificationMapAssertion from './assertions/verificationMapAssertion';
import type { IVerificationMapItem } from '../../../../../src/models/VerificationMap';

describe('domain certificates get verification map use case test suite', function () {
  describe('given it is called', function () {
    it('should return a verification map', function () {
      const result: IVerificationMapItem[] = domain.certificates.getVerificationMap().verificationMap;
      expect(result).toEqual(verificationMapAssertion);
    });
  });
});
