
const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const app = express();
const port = process.env.PORT || 3000;

const instances = new Map();

app.get('/instance/connect/:name', async (req, res) => {
    const name = req.params.name;
    if (instances.has(name)) {
        return res.send('<h2>Instância já criada. Vá para /groups/' + name + '</h2>');
    }

    const client = new Client({
        puppeteer: {
            headless: true,
            args: ['--no-sandbox']
        }
    });

    client.on('qr', async qr => {
        const qrImage = await qrcode.toDataURL(qr);
        const html = \`
            <h2>Escaneie o QR Code abaixo para conectar</h2>
            <img src="\${qrImage}" />
        \`;
        res.send(html);
    });

    client.on('ready', () => {
        console.log(`Cliente ${name} pronto.`);
    });

    client.initialize();
    instances.set(name, client);
});

app.get('/groups/:name', async (req, res) => {
    const name = req.params.name;
    const client = instances.get(name);

    if (!client) {
        return res.status(404).json({ error: true, message: 'Instância não encontrada' });
    }

    try {
        const chats = await client.getChats();
        const groups = chats.filter(c => c.isGroup).map(c => ({
            name: c.name,
            id: c.id._serialized
        }));
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: true, message: err.message });
    }
});

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});
