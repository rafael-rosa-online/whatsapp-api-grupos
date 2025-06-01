const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('📲 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Cliente conectado com sucesso!');
});

app.get('/', (req, res) => {
  res.send('API WhatsApp conectada');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  client.initialize();
});
