const express = require('express');
const { create } = require('@open-wa/wa-automate');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const sessions = new Map();

// Criar nova instância
app.get('/instance/connect/:instance', async (req, res) => {
  const name = req.params.instance;

  if (sessions.has(name)) {
    return res.json({ message: 'Já conectado', instance: name });
  }

  try {
    const client = await create({
      sessionId: name,
      multiDevice: true,
      qrTimeout: 0,
      headless: true,
      authTimeout: 60,
      cacheEnabled: false,
      useChrome: false
    });

    sessions.set(name, client);

    client.onStateChanged((state) => {
      if (['CONFLICT', 'UNLAUNCHED'].includes(state)) client.forceRefocus();
    });

    res.json({ message: 'Instância criada', instance: name });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Buscar grupos
app.get('/groups/:instance', async (req, res) => {
  const name = req.params.instance;
  const client = sessions.get(name);

  if (!client) return res.status(404).json({ error: 'Instância não encontrada' });

  try {
    const chats = await client.getAllChats();
    const groups = chats.filter(c => c.isGroup).map(g => ({
      name: g.name,
      id: g.id._serialized
    }));

    res.json({ instance: name, groups });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Status
app.get('/instance/status/:instance', (req, res) => {
  const name = req.params.instance;
  res.json({ connected: sessions.has(name) });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});