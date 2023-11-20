import sinon from 'sinon';
import fixture from '../../fixtures/v1/v1.json';
import { BLOCKCHAINS, CERTIFICATE_VERSIONS, VERIFICATION_STATUSES } from '../../../src';
import Verifier from '../../../src/verifier';
import domain from '../../../src/domain';
import { ExplorerAPI } from 'certificate';
import * as ExplorerLookup from '@blockcerts/explorer-lookup';
import issuerProfileV1JsonFixture from '../../fixtures/v1/got-issuer_live.json';

describe('Verifier entity test suite', function () {
  let verifierInstance: Verifier;
  const verifierParamFixture = {
    certificateJson: fixture,
    chain: BLOCKCHAINS.bitcoin,
    expires: '',
    id: fixture.document.assertion.uid,
    issuer: fixture.document.certificate.issuer,
    receipt: fixture.receipt,
    revocationKey: null,
    transactionId: fixture.receipt.anchors[0].sourceId,
    version: CERTIFICATE_VERSIONS.V1_2,
    explorerAPIs: undefined
  };

  let stubRequest;

  beforeEach(async function () {
    stubRequest = sinon.stub(ExplorerLookup, 'request');
    stubRequest.withArgs({
      url: 'http://www.blockcerts.org/mockissuer/issuer/got-issuer_live.json'
    }).resolves(JSON.stringify(issuerProfileV1JsonFixture));
  });

  afterEach(function () {
    stubRequest.restore();
    verifierInstance = null;
  });

  describe('constructor method', function () {
    beforeEach(function () {
      verifierInstance = new Verifier(verifierParamFixture);
    });

    describe('given all parameters are passed', function () {
      it('should set the expires to the verifier object', function () {
        expect(verifierInstance.expires).toBe(verifierParamFixture.expires);
      });

      it('should set the id to the verifier object', function () {
        expect(verifierInstance.id).toBe(verifierParamFixture.id);
      });

      it('should set the issuer to the verifier object', function () {
        expect(verifierInstance.issuer).toEqual(verifierParamFixture.issuer);
      });

      it('should set the revocationKey to the verifier object', function () {
        expect(verifierInstance.revocationKey).toBe(verifierParamFixture.revocationKey);
      });

      describe('explorerAPIs', function () {
        describe('given the verifier is called with a custom explorerAPI', function () {
          it('should pass the property to the lookForTx function', async function () {
            const fixtureExplorerAPI: ExplorerAPI = {
              serviceURL: 'https://test.com'
            };
            const parametersWithExporerAPI = {
              ...verifierParamFixture,
              explorerAPIs: [
                fixtureExplorerAPI
              ]
            };

            const lookForTxSpy: sinon.SinonStub = sinon.stub(domain.verifier, 'lookForTx');
            const instance = new Verifier(parametersWithExporerAPI);
            await instance.init();
            await instance.verify();
            expect(lookForTxSpy.firstCall.args[0].explorerAPIs).toEqual(parametersWithExporerAPI.explorerAPIs);
            lookForTxSpy.restore();
          });
        });
      });

      it('should set the documentToVerify to the verifier object', function () {
        const documentAssertion = JSON.parse(JSON.stringify(fixture));
        expect(verifierInstance.documentToVerify).toEqual(documentAssertion);
      });
    });
  });

  describe('isFailing method', function () {
    beforeEach(function () {
      verifierInstance = new Verifier(verifierParamFixture);
    });

    describe('when all checks are successful', function () {
      it('should return false', function () {
        (verifierInstance as any)._stepsStatuses.push({ step: 'testStep 1', status: VERIFICATION_STATUSES.SUCCESS, action: 'Test Step 1' });
        (verifierInstance as any)._stepsStatuses.push({ step: 'testStep 2', status: VERIFICATION_STATUSES.SUCCESS, action: 'Test Step 2' });

        expect((verifierInstance as any)._isFailing()).toBe(false);
      });
    });
    describe('when one check is failing', function () {
      it('should return true', function () {
        (verifierInstance as any)._stepsStatuses.push({ step: 'testStep 1', status: VERIFICATION_STATUSES.SUCCESS, action: 'Test Step 1' });
        (verifierInstance as any)._stepsStatuses.push({ step: 'testStep 2', status: VERIFICATION_STATUSES.FAILURE, action: 'Test Step 2' });

        expect((verifierInstance as any)._isFailing()).toBe(true);
      });
    });
  });
});
