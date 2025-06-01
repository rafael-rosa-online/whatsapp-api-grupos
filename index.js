const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const app = express();
const PORT = process.env.PORT || 10000;

const instances = new Map();

app.get('/instance/connect/:instanceName', async (req, res) => {
  const { instanceName } = req.params;

  if (instances.has(instanceName)) {
    return res.json({ message: 'Instance already exists' });
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: instanceName }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', qr => {
    console.log(`QR for ${instanceName}:`);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log(`Client ${instanceName} is ready!`);
  });

  client.initialize();
  instances.set(instanceName, client);

  return res.json({ message: 'QR Code generated in logs' });
});

app.get('/groups/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const client = instances.get(instanceName);

  if (!client) {
    return res.status(404).json({ error: true, message: 'Instance not found' });
  }

  try {
    const chats = await client.getChats();
    const groups = chats
      .filter(chat => chat.isGroup)
      .map(chat => ({ name: chat.name, id: chat.id._serialized }));

    return res.json(groups);
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API ready at http://localhost:${PORT}`);
});