const express = require('express');
const bodyParser = require('body-parser');
const certVerifierJs = require('../../../dist/verifier-node');

const server = express();
server.use(bodyParser.json({ limit: '5mb' }));

const port = 4000;

server.post('/verification', async (req, res) => {
  if (req.body.blockcerts) {
    const blockcertsData = req.body.blockcerts;
    try {
      const certificate = new certVerifierJs.Certificate(blockcertsData);
      await certificate.init();
      await certificate
        .verify()
        .then(({ status, message }) => {
          console.log(`${req.body.version} Status:`, status);

          if (status === 'failure') {
            console.log(`The certificate ${req.body.blockcerts.id} is not valid. Error: ${message}`);
          }

          return res.json({
            version: req.body.version,
            status,
            message
          });
        })
        .catch(err => {
          console.error(req.body.version, err);
          res.json({
            version: req.body.version,
            status: 'failure',
            message: err
          });
        });
    } catch (e) {
      console.error(req.body.version, 'Certificate creation error:', e);
      res.json({
        version: req.body.version,
        status: 'failure',
        message: e
      });
    }
  }
});

server.listen(port, () => {
  console.log(`Server listening at ${port}`);
});
