const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/generate', (req, res) => {
  const { prompt } = req.body;
  
  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const raw = parsed.content.map(b => b.text || '').join('');
        const clean = raw.replace(/```json|```/g, '').trim();
        const plan = JSON.parse(clean);
        res.json({ plan });
      } catch(e) {
    console.error('Parse error:', e.message, 'Raw data:', data);
    res.status(500).json({ error: 'שגיאה: ' + e.message });
      }
    });
  });

  apiReq.on('error', (e) => {
    res.status(500).json({ error: 'שגיאת רשת' });
  });

  apiReq.write(body);
  apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
