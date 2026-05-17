import express from 'express';
import { webSearch } from '../services/aiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Query is required' });
    }

    const results = await webSearch(query.trim());
    res.json(results);
  } catch (error) {
    console.error('Web search error:', error);
    if (error.status === 429) {
      return res.status(429).json({ error: 'RATE_LIMIT', message: 'Too many requests. Try again later.' });
    }
    res.status(500).json({ error: 'SEARCH_FAILED', message: 'Web search failed. Please try again.' });
  }
});

export default router;
