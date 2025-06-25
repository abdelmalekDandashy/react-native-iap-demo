const express = require('express');
const app = express();
app.use(express.json()); // parse JSON bodies

app.post('/iap/webhook', (req, res) => {
  console.log('🔔 Webhook payload received:');
  console.dir(req.body, { depth: null, colors: true });
  // Pseudo logic for subscription lifecycle events
  const { type, applicationUsername, purchases } = req.body;
  if (type === 'purchases.updated') {
    Object.values(purchases || {}).forEach(purchase => {
      if (!purchase.lastRenewalDate) {
        console.log(`➡️  Subscription created for ${applicationUsername}: ${purchase.productId}`);
      } else if (purchase.isExpired) {
        console.log(`❌ Subscription expired/cancelled for ${applicationUsername}: ${purchase.productId}`);
      } else {
        console.log(`🔄 Subscription updated for ${applicationUsername}: ${purchase.productId}`);
      }
    });
  }
  // respond 200 so Iaptic knows you got it
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook listener running on http://localhost:${PORT}/iap/webhook`);
});
