import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());

// Route for upcoming contests
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
    console.error('LeetCode Contest Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch LeetCode contests' });
  }
});

// Route for LeetCode Problems
app.get('/all', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;

  try {
    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query: `
          query getQuestionList($categorySlug: String!, $limit: Int!, $skip: Int!) {
            problemsetQuestionListV2(
              categorySlug: $categorySlug,
              limit: $limit,
              skip: $skip
            ) {
              hasMore
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
          categorySlug: "algorithms",
          limit,
          skip,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com/problemset/all/',
          'User-Agent': 'Mozilla/5.0',
          'cookie': `LEETCODE_SESSION=${process.env.LEETCODE_SESSION}; csrftoken=${process.env.LEETCODE_CSRF}`,
          'x-csrftoken': process.env.LEETCODE_CSRF,
        },
      }
    );

    const data = response.data?.data?.problemsetQuestionListV2;

    if (!data || !Array.isArray(data.questions)) {
      console.error("Invalid structure:", response.data);
      return res.status(500).json({ error: "LeetCode response structure invalid" });
    }

    const formatted = data.questions.map((q) => ({
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty,
      tags: q.topicTags.map(t => t.name),
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
    }));

    res.json({
      hasMore: data.hasMore,
      problems: formatted,
    });

  } catch (error) {
    console.error("LeetCode Problems Fetch Error:");
    console.error(error.response?.data || error.message || error);
    res.status(500).json({ error: "Failed to fetch LeetCode problems" });
  }
});





const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
