import domain from './domain';
import parseJSON, { type ParsedCertificate } from './parser';
import Verifier, { type IFinalVerificationStatus, type IVerificationStepCallbackFn } from './verifier';
import { DEFAULT_OPTIONS } from './constants';
import currentLocale from './constants/currentLocale';
import { type BlockcertsV1 } from './models/BlockcertsV1';
import { type IBlockchainObject } from './constants/blockchains';
import type Versions from './constants/certificateVersions';
import { deepCopy } from './helpers/object';
import type { ExplorerAPI } from '@blockcerts/explorer-lookup';
import { type Issuer } from './models/Issuer';
import { type ProofValue } from './models/MerkleProof2019';
import { type IVerificationMapItem } from './models/VerificationMap';

export interface Signers {
  chain?: IBlockchainObject;
  issuerName?: string;
  issuerProfileDomain?: string;
  issuerProfileUrl?: string;
  issuerPublicKey: string;
  rawTransactionLink?: string;
  signatureSuiteType: string;
  signingDate: string;
  transactionId?: string;
  transactionLink?: string;
}

export type {
  ExplorerAPI
};

export interface CertificateOptions {
  locale?: string;
  explorerAPIs?: ExplorerAPI[];
}

export default class Certificate {
  public certificateImage?: string;
  public certificateJson: BlockcertsV1;
  public chain: IBlockchainObject;
  public description?: string; // v1
  public expires: string;
  public explorerAPIs: ExplorerAPI[] = [];
  public id: string;
  public isFormatValid: boolean;
  public issuedOn: string;
  public issuer: Issuer;
  public locale: string; // enum?
  public metadataJson: any; // TODO: define metadataJson interface. As abstract as can be as keys and values are open.
  public name?: string; // TODO: not formally set in V3
  public options: CertificateOptions;
  public publicKey?: string;
  public rawTransactionLink: string;
  public receipt: ProofValue | any; // TODO: define receipt interface for v1, v2
  public recipientFullName: string;
  public recordLink: string;
  public signers: Signers[] = [];
  public revocationKey: string;
  public sealImage?: string; // v1
  public signature?: string; // v1
  public signatureImage?: string; // v1
  public subtitle?: string; // v1
  public transactionId: string;
  public transactionLink: string;
  public verificationSteps: IVerificationMapItem[];
  public version: Versions;
  public verifier: Verifier;

  constructor (certificateDefinition: BlockcertsV1 | string, options: CertificateOptions = {}) {
    // Options
    this._setOptions(options);

    if (typeof certificateDefinition !== 'object') {
      try {
        certificateDefinition = JSON.parse(certificateDefinition);
      } catch (err) {
        throw new Error(domain.i18n.getText('errors', 'certificateNotValid'));
      }
    }

    // Keep certificate JSON object
    this.certificateJson = deepCopy<BlockcertsV1>(certificateDefinition);
  }

  async init (): Promise<void> {
    // Parse certificate
    await this.parseJson(this.certificateJson);
    this.verifier = new Verifier({
      certificateJson: this.certificateJson,
      chain: this.chain,
      expires: this.expires,
      id: this.id,
      issuer: this.issuer,
      receipt: this.receipt,
      revocationKey: this.revocationKey,
      transactionId: this.transactionId,
      version: this.version,
      explorerAPIs: deepCopy<ExplorerAPI[]>(this.explorerAPIs)
    });
    await this.verifier.init();
    this.verificationSteps = this.verifier.getVerificationSteps();
  }

  async parseJson (certificateDefinition): Promise<void> {
    const parsedCertificate: ParsedCertificate = await parseJSON(certificateDefinition);
    if (!parsedCertificate.isFormatValid) {
      throw new Error(parsedCertificate.error);
    }
    this._setProperties(parsedCertificate);
  }

  async verify (stepCallback?: IVerificationStepCallbackFn): Promise<IFinalVerificationStatus> {
    const result = await this.verifier.verify(stepCallback);
    this.setSigners();
    return result;
  }

  private setSigners (): void {
    this.signers = this.verifier.getSignersData();
  }

  _setOptions (options): void {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    // Set locale
    this.locale = domain.i18n.ensureIsSupported(this.options.locale === 'auto' ? domain.i18n.detectLocale() : this.options.locale);
    this.explorerAPIs = this.options.explorerAPIs ?? [];

    currentLocale.locale = this.locale;
  }

  _setProperties ({
    certificateImage,
    chain,
    description,
    expires,
    id,
    isFormatValid,
    issuedOn,
    issuer,
    metadataJson,
    name,
    publicKey,
    receipt,
    recipientFullName,
    recordLink,
    revocationKey,
    sealImage,
    signature,
    signatureImage,
    subtitle,
    version
  }): void {
    this.isFormatValid = isFormatValid;
    this.certificateImage = certificateImage;
    this.chain = chain;
    this.description = description;
    this.expires = expires;
    this.id = id;
    this.issuedOn = issuedOn;
    this.issuer = issuer;
    this.metadataJson = metadataJson;
    this.name = name;
    this.publicKey = publicKey;
    this.receipt = receipt;
    this.recipientFullName = recipientFullName;
    this.recordLink = recordLink;
    this.revocationKey = revocationKey;
    this.sealImage = sealImage;
    this.signature = signature;
    this.signatureImage = signatureImage;
    this.subtitle = subtitle;

    // Get the full verification step-by-step map
    this.verificationSteps = domain.certificates.getVerificationMap(chain);

    this.version = version as Versions;
  }
}
