const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 10000;

const instances = new Map();

app.get('/instance/connect/:instanceName', (req, res) => {
    const name = req.params.instanceName;

    if (instances.has(name)) {
        return res.json({ message: 'Instance already exists' });
    }

    const client = new Client({ puppeteer: { headless: true } });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        console.log(`QR Code for ${name}:`, qr);
    });

    client.on('ready', () => {
        console.log(`Client ${name} is ready!`);
    });

    client.initialize();
    instances.set(name, client);

    res.json({ message: 'QR Code generated in logs' });
});

app.get('/groups/:instanceName', async (req, res) => {
    const name = req.params.instanceName;
    const client = instances.get(name);

    if (!client) return res.status(404).json({ error: true, message: 'Instance not found' });

    try {
        const chats = await client.getChats();
        const groups = chats.filter(chat => chat.isGroup).map(chat => ({
            name: chat.name,
            id: chat.id._serialized
        }));
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: true, message: err.message });
    }
});

app.listen(port, () => {
    console.log(`API ready at http://localhost:${port}`);
});