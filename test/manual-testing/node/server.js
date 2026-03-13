import express from 'express';
import {json} from 'body-parser';
import {Certificate} from '../../../dist/verifier-node';

const server = express();
server.use(json({limit: '5mb'}));

const port = 4000;

server.post('/verification', async (req, res) => {
  if (req.body.blockcerts) {
    const blockcertsData = req.body.blockcerts;
    try {
      const certificate = new Certificate(blockcertsData);
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
