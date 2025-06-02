const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;
const instances = new Map();

app.get('/', (req, res) => {
    res.send('API WhatsApp está no ar.');
});

app.get('/instance/connect/:name', async (req, res) => {
    const name = req.params.name;
    if (instances.has(name)) {
        return res.send(`<h3>Instância "${name}" já foi criada. Escaneie com o WhatsApp!</h3>`);
    }

    const client = new Client({
        puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });

    let qrHtml = "<h3>Aguardando QR Code...</h3>";

    client.on('qr', async (qr) => {
        const qrImage = await qrcode.toDataURL(qr);
        qrHtml = \`
            <h3>Escaneie o QR Code com seu WhatsApp</h3>
            <img src="\${qrImage}" />
        \`;
    });

    client.on('ready', () => {
        console.log(\`Cliente \${name} conectado.\`);
    });

    client.initialize();
    instances.set(name, client);

    setTimeout(() => {
        res.send(qrHtml);
    }, 3000);
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
    console.log(\`🚀 Servidor rodando na porta \${port}\`);
});