require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const token = process.env.TG_BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;;

const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiApiKey);

const userData = {};
completedPrompt = {};


/*
    input validation for weight and etc

*/

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Reset user data and completed status for this chat when they type /start
    // userData[chatId] = {};

    completedPrompt[chatId] = false;

    bot.sendMessage(
        chatId,
        `Welcome to the HealthMentor Bot! 🏋️‍♂️\n\nPlease select your goal:\n1. Lose Fat\n2. Gain Muscle\n3. Maintain Weight`
    );
    // userData[chatId] = {
    //     step: 1, // Track progress step
    // };
});

// Handle user input
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Initialize user data if not existing
    if (text == '/start') {
        return;
    }
    if (!userData[chatId]) {
        userData[chatId] = { step: 1 }; // Default to step 1
    }

    const user = userData[chatId];

    switch (user.step) {
        case 1:
            // Handle goal selection
            if (text === '1' || text === '2' || text === '3') {
                user.goal = text;
                user.step++; // Move to the next step
                bot.sendMessage(chatId, 'What is your current weight (in kg)?');
            } else {
                bot.sendMessage(chatId, 'Please select a valid option: 1, 2, or 3.');
            }
            break;

        case 2:
            // Handle weight input
            if (!isNaN(text) && Number(text) > 0) {
                user.weight = text;
                user.step++; // Move to the next step
                bot.sendMessage(chatId, 'What is your height (in cm)?');
            } else {
                bot.sendMessage(chatId, 'Please enter a valid weight in kg (e.g., 60).');
            }
            break;

        case 3:
            // Handle height input
            if (!isNaN(text) && Number(text) > 0) {
                user.height = text;
                user.step++; // Move to the next step
                bot.sendMessage(chatId, 'How many times do you exercise per week?');
            } else {
                bot.sendMessage(chatId, 'Please enter a valid height in cm (e.g., 175).');
            }
            break;

        case 4:
            // Handle exercise frequency input
            if (!isNaN(text) && Number(text) >= 0) {
                user.exerciseFrequency = text;
                user.step++; // Move to the final step

                bot.sendMessage(chatId, 'Recommendation is loading...');

                // Generate recommendation
                generateRecommendation(chatId);
            } else {
                bot.sendMessage(chatId, 'Please enter a valid number of times (e.g., 3).');
            }
            break;

        default:
            bot.sendMessage(chatId, 'You’ve completed the process! Type /start to restart.');
            break;
    }
});

// Generate recommendation using Gemini API
async function generateRecommendation(chatId) {
    const { goal, weight, height, exerciseFrequency } = userData[chatId];

    const goalDescription = {
        '1': 'lose fat',
        '2': 'gain muscle',
        '3': 'maintain weight',
    }[goal];

    const prompt = `I am a ${weight} kg, ${height} cm tall individual. I exercise ${exerciseFrequency} times per week. My goal is to ${goalDescription}. Provide a concise and practical fitness and nutrition recommendation to help me achieve my goal. Focus only on necessary actions and avoid unnecessary details.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let recommendation = response.text();
        recommendation = recommendation.replace(/\*\*/g, '');

        recommendation = `Based on your goal: ${goalDescription},
        Your weight: ${weight} kg,
        Your height: ${height} cm,
        Your exercise frequency: ${exerciseFrequency} times per week,
        Here's your recommendation: \n ` + recommendation + '\n\nThank you for using HealthMentor Bot!\nType /start to restart.'

        bot.sendMessage(chatId, recommendation);
    }
    catch (error) {
        console.error('Error generating recommendation:', error);
        bot.sendMessage(chatId, 'Sorry, I could not generate a recommendation at the moment. Please try again later.');
    }

    delete userData[chatId];
}
