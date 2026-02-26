require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { BotRunner } = require('./bot');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;
const SERVER_GROQ_KEY = process.env.GROQ_API_KEY || '';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, './frontend')));

const activeBots = new Map();
const sessions = new Map();

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'bi bot' }));

app.post('/api/test/start', (req, res) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) return res.status(400).json({ error: 'URL을 입력해주세요.' });
    try { new URL(targetUrl); } catch { return res.status(400).json({ error: '올바른 URL 형식이 아닙니다.' }); }
    const sessionId = uuidv4();
    sessions.set(sessionId, { targetUrl, config: req.body });
    res.json({ sessionId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/test/:sessionId/stop', (req, res) => {
  const bot = activeBots.get(req.params.sessionId);
  if (bot) { bot.stop(); activeBots.delete(req.params.sessionId); }
  res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userGroqKey } = req.body;
    const apiKey = userGroqKey || SERVER_GROQ_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Groq API 키가 없습니다.' });
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: '당신은 웹사이트 테스트 AI "bi bot"입니다. 한국어로 간결하게 답변하세요.' }, ...messages.slice(-10)],
        max_tokens: 600, temperature: 0.7
      }),
    });
    if (!groqRes.ok) { const e = await groqRes.json(); return res.status(groqRes.status).json({ error: e.error?.message || 'Groq 오류' }); }
    const data = await groqRes.json();
    res.json({ reply: data.choices?.[0]?.message?.content || '응답 없음' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

wss.on('connection', (ws) => {
  let sessionId = null;
  ws.on('message', async (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'join') {
      sessionId = msg.sessionId;
      const session = sessions.get(sessionId);
      if (!session) { send(ws, { type: 'error', message: '세션 없음' }); return; }
      send(ws, { type: 'connected', targetUrl: session.targetUrl });
      const bot = new BotRunner(sessionId, session.config, (event) => {
        const e = { ...event };
        if (e.screenshot) { send(ws, { type: 'screenshot', data: e.screenshot }); delete e.screenshot; }
        send(ws, e);
      });
      activeBots.set(sessionId, bot);
      bot.run().finally(() => activeBots.delete(sessionId));
    }
    if (msg.type === 'stop' && sessionId) {
      const bot = activeBots.get(sessionId);
      if (bot) { bot.stop(); activeBots.delete(sessionId); }
      send(ws, { type: 'stopped' });
    }
  });
});

server.listen(PORT, () => console.log(`bi bot running on port ${PORT}`));