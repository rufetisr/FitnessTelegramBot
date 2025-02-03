require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const requestIp = require('request-ip');

const app = express();
const port = process.env.PORT || 3200;


const User = require('./models/User');

const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const cluster_name = process.env.CLUSTER_NAME;

const token = process.env.TG_BOT_TOKEN;
const webhookUrl = `https://fitnesstelegrambot.onrender.com/${token}`;

const bot = new TelegramBot(token, { webHook: true });

bot.setWebHook(webhookUrl);

app.use(express.json());

app.post(`/${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Bot server is running on port ${port}`);
});

const geminiApiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(geminiApiKey);

const logger = require('./logger')
const mongoose = require('mongoose');
const axios = require('axios');

const userData = {};

// Handle polling errors
bot.on('polling_error', (error) => logger.error(`Polling error: ${error.message}`));



async function getUserData() {
    try {
        const response = await axios.get('https://api64.ipify.org?format=json');

        const ip = await response?.data?.ip;

        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
        const geoData = await geoResponse?.data;


        return {
            ip: ip,
            country: geoData?.country,
            city: geoData.city,
            lat: geoData.lat,
            lon: geoData.lon,
            org: geoData.org,
        };
    } catch (error) {
        logger.error('Error fetching IP:', error.message);
    }
}



// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    geoData = await getUserData()
    logger.info(`User ${chatId} input: ${text}, IP: ${geoData.ip}, Country: ${geoData.country}, City: ${geoData.city}, Lat: ${geoData.lat}, Lon: ${geoData.lon}, Isp: ${geoData.org}`);

    userData[chatId] = { step: 0 };

    bot.sendMessage(chatId, "Welcome to HealthMentor Bot! 🏋️‍♂️\n\nPlease select your goal:\n1. Lose Fat\n2. Gain Muscle\n3. Maintain Weight");
});

// Handle user input
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // const ip = requestIp.getClientIp(msg);


    if (text === '/start' || !userData[chatId]) return;

    const user = userData[chatId];

    switch (user.step) {
        case 0:
            if (["1", "2", "3"].includes(text)) {
                user.goal = text;
                user.step++;
                bot.sendMessage(chatId, "What is your current weight (in kg)?");
            } else {
                bot.sendMessage(chatId, "Please select a valid option: 1, 2, or 3.");
            }
            break;

        case 1:
            if (!isNaN(text) && Number(text) > 0) {
                user.weight = text;
                user.step++;
                bot.sendMessage(chatId, "What is your height (in cm)?");
            } else {
                bot.sendMessage(chatId, "Please enter a valid weight in kg (e.g., 60).");
            }
            break;

        case 2:
            if (!isNaN(text) && Number(text) > 0) {
                user.height = text;
                user.step++;
                bot.sendMessage(chatId, "How many times do you exercise per week?");
            } else {
                bot.sendMessage(chatId, "Please enter a valid height in cm (e.g., 175).");
            }
            break;

        case 3:
            if (!isNaN(text) && Number(text) >= 0) {
                user.exerciseFrequency = text;
                user.step++;
                bot.sendMessage(chatId, "Generating your recommendation...");
                generateRecommendation(chatId);
            } else {
                bot.sendMessage(chatId, "Please enter a valid number of times (e.g., 3).");
            }
            break;
    }
});

// Generate recommendation using Gemini API
async function generateRecommendation(chatId) {
    const { goal, weight, height, exerciseFrequency } = userData[chatId];

    const goalDescriptions = { '1': 'lose fat', '2': 'gain muscle', '3': 'maintain weight' };
    const goalText = goalDescriptions[goal];

    const prompt = `I am a ${weight} kg, ${height} cm tall individual. I exercise ${exerciseFrequency} times per week. My goal is to ${goalText}. Provide a concise and practical fitness and nutrition recommendation.`;

    let geoData = await getUserData()
    let { ip, country, city, lat, lon, org } = geoData;


    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let recommendation = response.text();
        recommendation = recommendation.replace(/\*\*/g, '');

        if (mongoose.connection.readyState !== 1) {
            logger.error("DB is not connected.");
            bot.sendMessage(chatId, "Connection issue. Please try again later with /start.");
            return;
        }

        const user = await User.findOneAndUpdate(
            { chatId },
            {
                chatId,
                ip,
                country,
                city,
                lat,
                lon,
                isp: org,
                lon,
                $push: {
                    recommendations: {
                        goal,
                        weight,
                        height,
                        exerciseFrequency,
                        text: recommendation
                    }
                }
            },
            { upsert: true, new: true }
        );
        logger.info(`User ${chatId} updated successfully.`);


        const message = `🏋️‍♂️ Based on your goal (${goalText}):\n\n- Weight: ${weight} kg\n- Height: ${height} cm\n- Exercise: ${exerciseFrequency} times/week\n\n📌 Recommendation:\n${recommendation}\n\nThank you for using HealthMentor Bot! Type /start to restart.`;

        bot.sendMessage(chatId, message);
    } catch (error) {
        logger.error('Error generating recommendation:', error);
        bot.sendMessage(chatId, "Sorry, I couldn't generate a recommendation. Please try again later with /start.");
    }

    delete userData[chatId];
}

mongoose.connect(`mongodb+srv://${db_username}:${db_password}@${cluster_name}.tssdm.mongodb.net/?retryWrites=true&w=majority&appName=${cluster_name}`
    , {
        serverSelectionTimeoutMS: 30000,
    }
)
    .then(() => {
        logger.info('Connected to MongoDb');
    })
    .catch((err) => {
        logger.error('Connection failed to MongoDb: ', err.message);
    });