
const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-generator');

const app = express();

app.use(bodyParser.json());

app.post('/generate-code', (req, res) => {
  const { text } = req.body;
  const qr = qrcode(0, "L");
  qr.addData(text);
  qr.make();

  res.status(200).send(qr.createImgTag(4));
});

app.post('/execute-code', (req, res) => {
  const { qrcode } = req.body;
  // Execute code here

  res.status(200).send('QR code successfully created!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
