require('dotenv').config();

const express = require('express');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '8kb' }));
app.use(express.static(__dirname));

app.post('/api/submit-score', async (req, res) => {
  const privateKey = process.env.DREAMLO_PRIVATE_KEY?.trim();
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const score = Number(req.body?.score);
  const rightAnswers = Number(req.body?.rightAnswers);

  if (!privateKey) {
    return res.status(503).json({ error: 'Server is missing DREAMLO_PRIVATE_KEY in .env.' });
  }

  if (!name || name.length > 15 ||
      !Number.isSafeInteger(score) || score < 0 ||
      !Number.isSafeInteger(rightAnswers) || rightAnswers < 0) {
    return res.status(400).json({ error: 'Invalid player name or score.' });
  }

  const url = `https://dreamlo.com/lb/${privateKey}/add/${encodeURIComponent(name)}/${score}/${rightAnswers}`;

  try {
    const response = await fetch(url);
    const result = await response.text();

    if (!response.ok || /^\s*fail/i.test(result)) {
      console.error('Dreamlo rejected score submission:', result);
      return res.status(502).json({ error: 'Dreamlo rejected the score.' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Dreamlo request failed:', error);
    res.status(502).json({ error: 'Could not reach Dreamlo.' });
  }
});

app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
});