import getParentVerificationSteps, { VerificationSteps, SUB_STEPS } from '../../../constants/verificationSteps'; // TODO: circular dependency
import domain from '../../index';
import type VerificationSubstep from '../../verifier/valueObjects/VerificationSubstep';
import type { IVerificationMapItem } from '../../../models/VerificationMap';

export function getVerificationStepsForCurrentCase (): SUB_STEPS[] {
  const verificationSteps = Object.values(SUB_STEPS);

  return verificationSteps;
}

const verificationMap = {
  [VerificationSteps.formatValidation]: [],
  [VerificationSteps.proofVerification]: [],
  [VerificationSteps.statusCheck]: [
    SUB_STEPS.checkRevokedStatus,
    SUB_STEPS.checkExpiresDate
  ]
};

function filterSubStepsForParentStep (parentStepKey: VerificationSteps, substepsList: SUB_STEPS[]): VerificationSubstep[] {
  const childSteps: SUB_STEPS[] = verificationMap[parentStepKey];
  const filteredChildSteps: SUB_STEPS[] = childSteps.filter(childStep => substepsList.includes(childStep));

  return filteredChildSteps.map(childStepKey =>
    domain.verifier.convertToVerificationSubsteps(parentStepKey, childStepKey)
  );
}

function getFullStepsWithSubSteps (verificationSubStepsList: SUB_STEPS[]): IVerificationMapItem[] {
  const steps = getParentVerificationSteps();
  return Object.keys(steps)
    .map(parentStepKey => ({
      ...steps[parentStepKey],
      subSteps: filterSubStepsForParentStep((parentStepKey as VerificationSteps), verificationSubStepsList)
    }));
}

// TODO: move this method to domain.verifier
export default function getVerificationMap (): {
  verificationMap: IVerificationMapItem[];
  verificationProcess: SUB_STEPS[];
} {
  const verificationProcess: SUB_STEPS[] = getVerificationStepsForCurrentCase();
  return {
    verificationProcess,
    verificationMap: getFullStepsWithSubSteps(verificationProcess)
  };
}
