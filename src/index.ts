import Certificate from './certificate';
import VerificationSubstep from './domain/verifier/valueObjects/VerificationSubstep';

if (typeof globalThis.setImmediate === 'undefined') {
  globalThis.setImmediate = ((fn: (...args: any[]) => void, ...args: any[]) => {
      return setTimeout(fn, 0, ...args);
  }) as any;
}

export { Certificate, VerificationSubstep };
export { VERIFICATION_STATUSES } from './constants/verificationStatuses';
export * as STEPS from './constants/verificationSteps';
export { getSupportedLanguages } from './domain/i18n/useCases';
export { BLOCKCHAINS, CERTIFICATE_VERSIONS } from './constants';
export { SignatureImage } from './models';
export { retrieveBlockcertsVersion } from './parsers';
