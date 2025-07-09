import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

// 🟢 Route for upcoming contests
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

// 🟣 New Route: /all => all problems
app.get('/all', async (req, res) => {
  try {
    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query: `
          query problemsetQuestionList($limit: Int, $skip: Int) {
            problemsetQuestionList: questionList(
              limit: $limit
              skip: $skip
              filters: {}
            ) {
              total
              questions {
                title
                titleSlug
                difficulty
                topicTags {
                  name
                }
              }
            }
          }
        `,
        variables: {
          limit: 1000,
          skip: 0,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com/problemset/all/',
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );

    const problems = response.data.data.problemsetQuestionList.questions;

    const formatted = problems.map((q) => ({
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty,
      tags: q.topicTags.map(t => t.name),
      url: `https://leetcode.com/problems/${q.titleSlug}/`
    }));

    res.json(formatted);
  } catch (error) {
    console.error('LeetCode Problems Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch LeetCode problems' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
