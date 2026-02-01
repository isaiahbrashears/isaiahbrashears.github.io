import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

app.post('/api/generate-category', async (req, res) => {
  try {
    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs:
            'Generate one unique, creative Scattergories category. ' +
            'Respond with ONLY the category name. No punctuation, no quotes.'
        })
      }
    );

    if (!hfRes.ok) {
      const err = await hfRes.text();
      return res.status(500).send(err);
    }

    const data = await hfRes.json();
    const text = data?.[0]?.generated_text?.trim() || null;

    res.json({ category: text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate category' });
  }
});

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});
