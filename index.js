const { Client } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const app = express();
const port = process.env.PORT || 3000;

const instances = new Map();

app.get('/instance/connect/:name', (req, res) => {
    const name = req.params.name;

    if (instances.has(name)) {
        return res.json({ message: 'Instance already created' });
    }

    const client = new Client({
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        console.log(`QR for ${name}:`, qr);
    });

    client.on('ready', () => {
        console.log(`Client ${name} is ready!`);
    });

    client.initialize();
    instances.set(name, client);

    return res.json({ message: 'QR Code generated in logs' });
});

app.get('/groups/:name', async (req, res) => {
    const name = req.params.name;
    const client = instances.get(name);

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

app.listen(port, () => {
    console.log(`API running on port ${port}`);
});
