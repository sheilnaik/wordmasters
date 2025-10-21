# WordMasters Challenge App

A fun and colorful vocabulary learning game for 4th graders participating in the WordMasters Challenge competition.

## Features

- 🎮 **Interactive Game Interface** - Engaging multiple choice analogy questions
- 🎨 **Colorful Animations** - Confetti, bouncing elements, and smooth transitions
- 💡 **AI-Powered Hints** - GPT-4o-mini generates helpful hints when students need help
- 🎯 **Score Tracking** - Points and streak tracking to encourage learning
- 📱 **Mobile & Desktop** - Fully responsive design that works on all devices
- ⌨️ **Keyboard Controls** - Number keys (1-4) to select answers, H for hints
- 📚 **Admin Panel** - Easy word management interface (no password needed)
- 🤖 **AI-Generated Content** - Analogies, hints, and explanations powered by OpenAI

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   - Game: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## How to Use

### Playing the Game

1. Open the game at http://localhost:3000
2. Read the analogy on screen
3. Choose the correct answer by:
   - Clicking/tapping on a choice
   - Pressing number keys 1-4 on your keyboard
4. Need help? Click the "Hint" button or press H
5. Get immediate feedback with explanations
6. Build your score and streak!

### Managing Words (Admin Panel)

1. Open the admin panel at http://localhost:3000/admin
2. Fill in the form with:
   - Word
   - Part of Speech (noun, verb, adjective, etc.)
   - Definition
3. Click "Add Word" to save
4. View all words in the list below
5. Delete words you no longer need

## Game Scoring

- ✅ Correct answer without hint: **10 points**
- ✅ Correct answer with hint: **5 points**
- 🔥 Build your streak for consecutive correct answers!

## Default Words

The app comes with 20 sample vocabulary words suitable for 4th graders. You can replace these with your own WordMasters word list through the admin panel.

## Technical Details

- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4o-mini for dynamic content generation
- **Storage**: In-memory (resets on server restart)
- **Frontend**: Vanilla JavaScript with CSS animations

## Notes

- The app uses in-memory storage, so words will be reset when you restart the server. For permanent storage, you can add a database (MongoDB, SQLite, etc.)
- Make sure to keep your OpenAI API key secure and never commit it to version control
- The AI generates unique analogies each time, making every game session fresh and engaging

## Troubleshooting

**Words not loading?**
- Check that you've added words in the admin panel
- Verify your OpenAI API key is set correctly in the `.env` file

**Analogies not generating?**
- Ensure your OpenAI API key is valid and has available credits
- Check the server console for error messages

## License

MIT