const express = require('express');
const app = express();
app.use(express.json()); // parse JSON bodies

app.post('/iap/webhook', (req, res) => {
  console.log('🔔 Webhook payload received:');
  console.dir(req.body, { depth: null, colors: true });
  // respond 200 so Iaptic knows you got it
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook listener running on http://localhost:${PORT}/iap/webhook`);
});
