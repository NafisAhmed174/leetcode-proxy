import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

app.use(cors());

app.get('/', async (req, res) => {
  try {
    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query: `
          query {
            allContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com/contest/',
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );

    const upcoming = response.data.data.allContests.filter(c => c.startTime * 1000 > Date.now());

    const contests = upcoming.map(c => ({
      name: c.title,
      start: c.startTime,
      duration: c.duration,
      url: `https://leetcode.com/contest/${c.titleSlug}/`,
    }));

    res.json(contests);
  } catch (error) {
    console.error('LeetCode GraphQL Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch LeetCode contests' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
