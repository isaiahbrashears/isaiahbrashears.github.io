require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

app.post('/api/generate-category', async (_req, res) => {
  try {
    const hfRes = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'HuggingFaceTB/SmolLM3-3B',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Do not use thinking tags. Respond directly and concisely.'
            },
            {
              role: 'user',
              content:
                'Generate one unique, creative Scattergories category. ' +
                'Examples: "Things at a birthday party", "Types of fish", "Household chores". ' +
                'Do NOT repeat any of those examples. Respond with ONLY the category name, nothing else.'
            }
          ],
          max_tokens: 500
        })
      }
    );

    if (!hfRes.ok) {
      const err = await hfRes.text();
      console.error('HuggingFace error:', err);
      return res.status(500).json({ error: 'HuggingFace API error' });
    }

    const data = await hfRes.json();
    let text = data?.choices?.[0]?.message?.content?.trim() || null;

    // Strip <think>...</think> tags (complete or incomplete) the model includes
    if (text) {
      text = text.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();
      // Remove surrounding quotes if present
      text = text.replace(/^["']|["']$/g, '').trim();
    }

    res.json({ category: text });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to generate category' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
