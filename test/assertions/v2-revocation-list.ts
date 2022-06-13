export default {
  '@context': 'https://w3id.org/openbadges/v2',
  type: 'RevocationList',
  id: 'https://blockcerts.learningmachine.com/issuer/5a4fe9931f607f0f3452a65e/revocation.json',
  issuer: 'https://blockcerts.learningmachine.com/issuer/5a4fe9931f607f0f3452a65e.json',
  revokedAssertions: [{
    id: 'https://blockcerts.learningmachine.com/certificate/43f53f7cecad512a829b9d879687bfa2',
    revocationReason: 'Test'
  }, {
    id: 'https://blockcerts.learningmachine.com/certificate/62808269186b5d1fac0edb296fa40bf7',
    revocationReason: 'Please contact the recipient for a link to the re-issued Blockcert.'
  }, {
    id: 'https://blockcerts.learningmachine.com/certificate/da9bbb1781035e03b76ac2245c23a42e',
    revocationReason: 'Incorrect Issue Date. New credential to be issued.'
  }, {
    id: 'https://blockcerts.learningmachine.com/certificate/c4e09dfafc4a53e8a7f630df7349fd39',
    revocationReason: 'Incorrect Issue Date. New credential to be issued.'
  }]
};
