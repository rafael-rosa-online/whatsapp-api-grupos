const { Client } = require('whatsapp-web.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const instances = new Map();

app.get('/instance/connect/:name', (req, res) => {
    const name = req.params.name;
    if (instances.has(name)) {
        return res.send(`<p>Instância <strong>${name}</strong> já existe.</p>`);
    }

    const client = new Client({ puppeteer: { headless: true } });

    client.on('qr', (qr) => {
        const qrHtml = `
            <html>
                <body>
                    <h2>Escaneie o QR Code abaixo:</h2>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=250x250" />
                </body>
            </html>
        `;
        res.send(qrHtml);
    });

    client.on('ready', () => {
        console.log(`Cliente ${name} está pronto.`);
    });

    client.initialize();
    instances.set(name, client);
});

app.get('/groups/:name', async (req, res) => {
    const name = req.params.name;
    const client = instances.get(name);
    if (!client) return res.status(404).json({ error: true, message: 'Instância não encontrada' });

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
    console.log(`API rodando na porta ${port}`);
});
