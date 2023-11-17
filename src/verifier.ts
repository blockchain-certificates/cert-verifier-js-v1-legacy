import domain from './domain';
import { BlockcertsV1 } from './models/BlockcertsV1';
import { IBlockchainObject } from './constants/blockchains';
import { ExplorerAPI, TransactionData } from '@blockcerts/explorer-lookup';
import { Issuer, IssuerPublicKeyList } from './models/Issuer';
import Versions from './constants/certificateVersions';
import { VerificationSteps, SUB_STEPS } from './constants/verificationSteps';
import { Suite, SuiteAPI } from './models/Suite';
import { VERIFICATION_STATUSES } from './constants/verificationStatuses';
import type { IVerificationMapItem, IVerificationMapItemSuite } from './models/VerificationMap';
import type { Receipt } from './models/Receipt';
import { difference } from './helpers/array';
import VerificationSubstep from './domain/verifier/valueObjects/VerificationSubstep';
import { ensureNotExpired } from './inspectors';
import { MerkleProof2017 } from './models/MerkleProof2017';
import type { Signers } from './certificate';

export interface IVerificationStepCallbackAPI {
  code: string;
  label: string;
  status: VERIFICATION_STATUSES;
  errorMessage?: string;
  parentStep: string;
}

export type IVerificationStepCallbackFn = (update: IVerificationStepCallbackAPI) => any;
type TVerifierProofMap = Map<number, Receipt>;

export interface IFinalVerificationStatus {
  code: VerificationSteps.final;
  status: VERIFICATION_STATUSES;
  message: string;
}

interface StepVerificationStatus {
  code: string;
  status: VERIFICATION_STATUSES;
  message?: string;
}

export enum SupportedVerificationSuites {
  MerkleProof2017 = 'MerkleProof2017',
  ChainpointSHA256v2 = 'ChainpointSHA256v2'
}

export default class Verifier {
  public chain: IBlockchainObject;
  public expires: string;
  public id: string;
  public issuer: Issuer;
  public receipt: any; // TODO: define receipt interface
  public revocationKey: string;
  public version: Versions;
  public transactionId: string;
  public documentToVerify: BlockcertsV1; // TODO: confirm this
  public explorerAPIs: ExplorerAPI[];
  private readonly localHash: string;
  private readonly txData: TransactionData;
  private readonly issuerPublicKeyList: IssuerPublicKeyList;
  private _stepsStatuses: StepVerificationStatus[] = [];

  public proofMap: TVerifierProofMap;
  public verificationSteps: IVerificationMapItem[];
  public supportedVerificationSuites: { [key in SupportedVerificationSuites]: Suite } = {
    [SupportedVerificationSuites.MerkleProof2017]: null,
    [SupportedVerificationSuites.ChainpointSHA256v2]: null
  }; // defined here to later check if the proof type of the document is supported for verification

  public proofVerifiers: Suite[] = [];
  public verificationProcess: SUB_STEPS[];

  constructor (
    { certificateJson, chain, expires, id, issuer, receipt, revocationKey, transactionId, version, explorerAPIs }: {
      certificateJson: BlockcertsV1;
      chain: IBlockchainObject;
      expires: string;
      id: string;
      issuer: Issuer;
      receipt: any;
      revocationKey: string;
      transactionId: string;
      version: Versions;
      explorerAPIs?: ExplorerAPI[];
    }
  ) {
    this.expires = expires;
    this.id = id;
    this.issuer = issuer;
    this.revocationKey = revocationKey;
    this.explorerAPIs = explorerAPIs;

    this.documentToVerify = Object.assign<any, BlockcertsV1>({}, certificateJson);
  }

  getVerificationSteps (): IVerificationMapItem[] {
    return this.verificationSteps;
  }

  async init (): Promise<void> {
    await this.instantiateProofVerifiers();
    this.prepareVerificationProcess();
  }

  async verifyProof (): Promise<void> {
    for (let i = 0; i < this.proofVerifiers.length; i++) {
      await this.proofVerifiers[i].verifyProof();
    }
  }

  async verify (stepCallback: IVerificationStepCallbackFn = () => {}): Promise<IFinalVerificationStatus> {
    this._stepCallback = stepCallback;
    this._stepsStatuses = [];

    await this.verifyProof();

    for (const verificationStep of this.verificationProcess) {
      if (!this[verificationStep]) {
        console.error('verification logic for', verificationStep, 'not implemented');
        return;
      }
      await this[verificationStep]();
    }

    // Send final callback update for global verification status
    const erroredStep = this._stepsStatuses.find(step => step.status === VERIFICATION_STATUSES.FAILURE);
    return erroredStep ? this._failed(erroredStep) : this._succeed();
  }

  getSignersData (): Signers[] {
    return this.proofVerifiers.map(proofVerifier => ({
      signingDate: proofVerifier.getSigningDate(),
      signatureSuiteType: proofVerifier.getProofType(),
      issuerPublicKey: proofVerifier.getIssuerPublicKey(),
      issuerName: proofVerifier.getIssuerName(),
      issuerProfileDomain: proofVerifier.getIssuerProfileDomain(),
      issuerProfileUrl: proofVerifier.getIssuerProfileUrl(),
      chain: proofVerifier.getChain?.(),
      transactionId: proofVerifier.getTransactionIdString?.(),
      transactionLink: proofVerifier.getTransactionLink?.(),
      rawTransactionLink: proofVerifier.getRawTransactionLink?.()
    }));
  }

  private getProofMap (document: BlockcertsV1): TVerifierProofMap {
    const proofMap = new Map();
    if ('signature' in document) {
      proofMap.set(0, document.signature);
    } else if ('receipt' in document) {
      proofMap.set(0, document.receipt);
    }
    return proofMap;
  }

  private getProofTypes (): string[] {
    const proofTypes: string[] = [];
    this.proofMap.forEach(proof => {
      let { type } = proof;
      if (Array.isArray(type)) {
        // Blockcerts v2/MerkleProof2017
        type = type[0] as unknown as string[];
      }
      proofTypes.push(type as unknown as string);
    });

    return proofTypes;
  }

  private async instantiateProofVerifiers (): Promise<void> {
    this.proofMap = this.getProofMap(this.documentToVerify);
    const proofTypes: string[] = this.getProofTypes();

    const unsupportedVerificationSuites = difference(Object.keys(this.supportedVerificationSuites), proofTypes);

    if (unsupportedVerificationSuites.length) {
      throw new Error(`No support for proof verification of type: ${unsupportedVerificationSuites.join(', ')}`);
    }

    // we have checked and now know the types of proof are supported, mutation is ok
    await this.loadRequiredVerificationSuites(proofTypes as SupportedVerificationSuites[]);

    this.proofMap.forEach((proof, index) => {
      const suiteOptions: SuiteAPI = {
        executeStep: this.executeStep.bind(this),
        document: this.documentToVerify,
        proof: proof as MerkleProof2017,
        explorerAPIs: this.explorerAPIs,
        issuer: this.issuer
      };

      this.proofVerifiers.push(new this.supportedVerificationSuites[proofTypes[index]](suiteOptions));
    });

    for (const proofVerifierSuite of this.proofVerifiers) {
      await proofVerifierSuite.init();
    }
  }

  private async loadRequiredVerificationSuites (documentProofTypes: SupportedVerificationSuites[]): Promise<void> {
    if (documentProofTypes.includes(SupportedVerificationSuites.MerkleProof2017)) {
      const { default: MerkleProof2017VerificationSuite } = await import('./suites/MerkleProof2017');
      this.supportedVerificationSuites.MerkleProof2017 = MerkleProof2017VerificationSuite as unknown as Suite;
    }

    if (documentProofTypes.includes(SupportedVerificationSuites.ChainpointSHA256v2)) {
      const { default: MerkleProof2017VerificationSuite } = await import('./suites/MerkleProof2017');
      this.supportedVerificationSuites.ChainpointSHA256v2 = MerkleProof2017VerificationSuite as unknown as Suite;
    }
  }

  private prepareVerificationProcess (): void {
    const verificationModel = domain.certificates.getVerificationMap();
    this.verificationSteps = verificationModel.verificationMap;
    this.verificationProcess = verificationModel.verificationProcess;

    this.registerSignatureVerificationSteps();

    this.verificationSteps = this.verificationSteps.filter(parentStep =>
      parentStep.subSteps?.length > 0 || parentStep.suites?.some(suite => suite.subSteps.length > 0)
    );
  }

  private registerSignatureVerificationSteps (): void {
    const parentStep = VerificationSteps.proofVerification;
    this.verificationSteps
      .find(step => step.code === parentStep)
      .suites = this.getSuiteSubsteps(parentStep);
  }

  private getSuiteSubsteps (parentStep: VerificationSteps): IVerificationMapItemSuite[] {
    const targetMethodMap = {
      [VerificationSteps.proofVerification]: 'getProofVerificationSteps'
    };
    return this.proofVerifiers.map(proofVerifier => ({
      proofType: proofVerifier.type,
      subSteps: proofVerifier[targetMethodMap[parentStep]](parentStep)
    }));
  }

  private getRevocationListUrl (): string {
    return this.issuer.revocationList;
  }

  private async executeStep (step: string, action: () => any, verificationSuite?: string): Promise<any> {
    if (this._isFailing()) {
      return;
    }

    if (step) {
      this._updateStatusCallback(step, VERIFICATION_STATUSES.STARTING, verificationSuite);
    }

    try {
      const res: any = await action();
      if (step) {
        this._updateStatusCallback(step, VERIFICATION_STATUSES.SUCCESS, verificationSuite);
        this._stepsStatuses.push({ code: step, status: VERIFICATION_STATUSES.SUCCESS });
      }
      return res;
    } catch (err) {
      console.error(err);
      if (step) {
        this._updateStatusCallback(step, VERIFICATION_STATUSES.FAILURE, verificationSuite, err.message);
        this._stepsStatuses.push({
          code: step,
          message: err.message,
          status: VERIFICATION_STATUSES.FAILURE
        });
      }
    }
  }

  private _stepCallback (update: IVerificationStepCallbackAPI): any { // TODO: unsure type is indeed any
    // defined by this.verify interface
  }

  private async checkRevokedStatus (): Promise<void> {
    const revocationListUrl = this.getRevocationListUrl();

    if (!revocationListUrl) {
      console.warn('No revocation list url was set on the issuer.');
      await this.executeStep(SUB_STEPS.checkRevokedStatus, () => true);
      return;
    }
    const revokedCertificatesIds = await this.executeStep(
      null,
      async () => await domain.verifier.getRevokedAssertions(revocationListUrl, this.id)
    );

    const { default: ensureNotRevoked } = await import('./inspectors/ensureNotRevoked');

    await this.executeStep(SUB_STEPS.checkRevokedStatus, () => { ensureNotRevoked(revokedCertificatesIds, this.id); }
    );
  }

  private async checkExpiresDate (): Promise<void> {
    await this.executeStep(SUB_STEPS.checkExpiresDate, () => { ensureNotExpired(this.expires); }
    );
  }

  private findStepFromVerificationProcess (code: string, verificationSuite: string): VerificationSubstep {
    return domain.verifier.findVerificationSubstep(code, this.verificationSteps, verificationSuite);
  }

  private _failed (errorStep: StepVerificationStatus): IFinalVerificationStatus {
    const { message } = errorStep;
    return this._setFinalStep({ status: VERIFICATION_STATUSES.FAILURE, message });
  }

  private _isFailing (): boolean {
    return this._stepsStatuses.some(step => step.status === VERIFICATION_STATUSES.FAILURE);
  }

  private _succeed (): IFinalVerificationStatus {
    let message;

    if (this.proofVerifiers.length === 1) {
      message = domain.chains.isMockChain(this.proofVerifiers[0].getChain())
        ? domain.i18n.getText('success', 'mocknet')
        : domain.i18n.getText('success', 'blockchain');
    }

    return this._setFinalStep({ status: VERIFICATION_STATUSES.SUCCESS, message });
  }

  private _setFinalStep ({ status, message }: { status: VERIFICATION_STATUSES; message: string }): IFinalVerificationStatus {
    return { code: VerificationSteps.final, status, message };
  }

  private _updateStatusCallback (code: string, status: VERIFICATION_STATUSES, verificationSuite = '', errorMessage = ''): void {
    if (code != null) {
      const step: VerificationSubstep = this.findStepFromVerificationProcess(code, verificationSuite);
      if (step === undefined) {
        // TODO: this happens when the verification method references a public key in a hosted issuer profile
        // TODO: as it is not considered a DID, CVJS does not add an identity verification check
        // TODO: we should likely enforce identity verification when the verification method is set
        console.warn('step with code', code, 'was not found for suite', verificationSuite, 'ignoring but you should not.');
        return;
      }
      const update: IVerificationStepCallbackAPI = {
        code,
        status,
        parentStep: step.parentStep,
        label: step.labelPending
      };
      if (errorMessage) {
        update.errorMessage = errorMessage;
      }
      this._stepCallback(update);
    }
  }
}
