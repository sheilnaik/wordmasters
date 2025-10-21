require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// File path for storing words
const WORDS_FILE = path.join(__dirname, 'words.json');

// Load words from JSON file
let words = [];
let nextId = 1;

function loadWords() {
  try {
    if (fs.existsSync(WORDS_FILE)) {
      const data = fs.readFileSync(WORDS_FILE, 'utf8');
      words = JSON.parse(data);
      // Find the highest ID to set nextId
      if (words.length > 0) {
        nextId = Math.max(...words.map(w => w.id)) + 1;
      }
      console.log(`Loaded ${words.length} words from file`);
    } else {
      console.log('No words file found, starting with empty list');
    }
  } catch (error) {
    console.error('Error loading words:', error);
    words = [];
  }
}

function saveWords() {
  try {
    fs.writeFileSync(WORDS_FILE, JSON.stringify(words, null, 2));
    console.log(`Saved ${words.length} words to file`);
  } catch (error) {
    console.error('Error saving words:', error);
  }
}

// Load words on startup
loadWords();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API Routes

// Get all words
app.get('/api/words', (req, res) => {
  res.json(words);
});

// Add a new word
app.post('/api/words', (req, res) => {
  const { word, partOfSpeech, definition } = req.body;
  const newWord = {
    id: nextId++,
    word,
    partOfSpeech,
    definition
  };
  words.push(newWord);
  saveWords();
  res.json(newWord);
});

// Delete a word
app.delete('/api/words/:id', (req, res) => {
  const id = parseInt(req.params.id);
  words = words.filter(w => w.id !== id);
  saveWords();
  res.json({ success: true });
});

// Bulk add words
app.post('/api/words/bulk', (req, res) => {
  const { wordsList } = req.body;

  if (!Array.isArray(wordsList)) {
    return res.status(400).json({ error: 'wordsList must be an array' });
  }

  const addedWords = [];
  const errors = [];

  wordsList.forEach((item, index) => {
    if (!item.word || !item.partOfSpeech || !item.definition) {
      errors.push(`Row ${index + 1}: Missing required fields`);
      return;
    }

    const newWord = {
      id: nextId++,
      word: item.word.trim(),
      partOfSpeech: item.partOfSpeech.trim().toLowerCase(),
      definition: item.definition.trim()
    };

    words.push(newWord);
    addedWords.push(newWord);
  });

  saveWords();

  res.json({
    success: true,
    added: addedWords.length,
    errors: errors.length > 0 ? errors : null,
    words: addedWords
  });
});

// Generate analogy with multiple choice
app.post('/api/generate-analogy', async (req, res) => {
  try {
    const { wordData } = req.body;

    const prompt = `Create a fun analogy question for a 4th grader. The target word is "${wordData.word}" (${wordData.partOfSpeech}): ${wordData.definition}

IMPORTANT:
- The word "${wordData.word}" should ONLY appear as the highlighted word on the LEFT side of the analogy (before the ::)
- You can use ANY words you want for the other parts of the analogy (WORD1, WORD2, etc.)
- The student will choose from a list of answer options to fill in the blank
- The correct answer and wrong answers should be simple, common words that a 4th grader knows

Generate a response in the following JSON format:
{
  "analogy": "WORD1 : WORD2 :: ${wordData.word} : ____",
  "correctAnswer": "the correct word to complete the analogy",
  "wrongAnswers": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
  "explanation": "brief explanation of why the correct answer works"
}

Example: If the target word is "hot", you might create:
{
  "analogy": "hot : cold :: day : ____",
  "correctAnswer": "night",
  "wrongAnswers": ["sun", "bright", "time"],
  "explanation": "Hot and cold are opposites, just like day and night are opposites"
}

Make sure the analogy is age-appropriate and tests understanding of the word's meaning. The wrong answers should be plausible but incorrect.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful educational assistant creating vocabulary analogies for elementary school students. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Error generating analogy:', error);
    res.status(500).json({ error: 'Failed to generate analogy' });
  }
});

// Generate hint
app.post('/api/generate-hint', async (req, res) => {
  try {
    const { wordData, analogy } = req.body;

    const prompt = `The student is trying to solve this analogy: "${analogy}"
The target word is "${wordData.word}" (${wordData.partOfSpeech}): ${wordData.definition}

Generate a helpful hint for a 4th grader that guides them toward the answer without giving it away directly. The hint should be encouraging and educational. Respond with only the hint text, one or two sentences maximum.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful educational assistant providing hints to elementary school students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const hint = completion.choices[0].message.content.trim();
    res.json({ hint });
  } catch (error) {
    console.error('Error generating hint:', error);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// Generate explanation for wrong answer
app.post('/api/generate-explanation', async (req, res) => {
  try {
    const { wordData, analogy, selectedAnswer, correctAnswer } = req.body;

    const prompt = `The student answered "${selectedAnswer}" for the analogy: "${analogy}"
The correct answer was "${correctAnswer}".
The target word is "${wordData.word}" (${wordData.partOfSpeech}): ${wordData.definition}

Generate a brief, encouraging explanation (2-3 sentences) for a 4th grader explaining why their answer was incorrect and why the correct answer works better. Be supportive and educational.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive educational assistant helping elementary school students learn from their mistakes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const explanation = completion.choices[0].message.content.trim();
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`WordMasters app listening on port ${PORT}`);
  console.log(`Game: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
