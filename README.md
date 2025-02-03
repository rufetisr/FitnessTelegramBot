# HealthMentor Bot

HealthMentor Bot is a Telegram bot designed to provide personalized fitness and nutrition recommendations based on user inputs. The bot integrates Google’s Gemini API for generating recommendations and uses MongoDB to store user data and their fitness goals.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=flat-square)](https://web.telegram.org/k/#@health_MentorBot)

## Features
- User-friendly interaction via Telegram commands.
- Personalized fitness and nutrition recommendations.
- Stores user data including location and fitness goals.
- Integration with Google Generative AI (Gemini API).
- Logs activities and errors using Winston logger.

## Technologies Used
- Node.js
- Express.js
- MongoDB & Mongoose
- node-telegram-bot-api
- Google Generative AI (Gemini API)
- Axios for HTTP requests
- Winston for logging

## Prerequisites
- Node.js and npm installed.
- MongoDB Atlas account.
- Telegram Bot Token from [BotFather](https://core.telegram.org/bots#botfather).
- Google Gemini API key.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rufetisr/FitnessTelegramBot.git  
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following content:
   ```env
   PORT=3200
   TG_BOT_TOKEN=your_telegram_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   DB_USERNAME=your_mongodb_username
   DB_PASSWORD=your_mongodb_password
   CLUSTER_NAME=your_mongodb_cluster_name
   ```

4. **Run the bot:**
   ```bash
   node index.js
   ```

## Usage

1. **Start the Bot:**
   Open Telegram, find your bot, and type `/start` to begin.

2. **Follow the prompts:**
   - Select your goal (1: Lose Fat, 2: Gain Muscle, 3: Maintain Weight).
   - Enter your current weight in kg.
   - Enter your height in cm.
   - Specify how many times you exercise per week.

3. **Receive personalized recommendations:**
   The bot will generate and send you a tailored fitness and nutrition plan.

## Project Structure
```
healthmentor-bot/
|│── index.js          # Main application file
|│── models/
|   └── User.js       # Mongoose schema for user data
|│── logger.js        # Winston logger configuration
|│── .env            # Environment variables
|│── package.json    # Project metadata and dependencies
```

## MongoDB Schema

**User Schema:**
- `chatId`: Telegram chat ID (unique).
- `country`, `city`, `ip`, `lat`, `lon`, `isp`: Geolocation data.
- `recommendations`: Array of user’s fitness recommendations.

**Recommendation Schema:**
- `goal`: User’s fitness goal.
- `weight`: User’s weight.
- `height`: User’s height.
- `exerciseFrequency`: Number of exercises per week.
- `text`: Generated recommendation text.

## Logging

The application uses Winston for logging. Logs include user interactions, API responses, and errors. Logs can be viewed in the console or saved to a file depending on your logger configuration in `logger.js`.

## Troubleshooting
- **Bot not responding:** Ensure your bot token is correct and the webhook URL is properly set.
- **Database connection issues:** Verify your MongoDB credentials and network access settings.
- **API key errors:** Make sure your Google Gemini API key is active and correctly configured.

## License

This project is licensed under the MIT License.

