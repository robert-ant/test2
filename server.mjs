import express from 'express';
import bodyParser from 'body-parser';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 }); // Cache Twitch data for 60 seconds
const userStatuses = cache.get('userStatuses') || {};

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiter to limit excessive requests from clients
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per minute
    message: 'Too many requests, please try again later.'
});

// Apply rate limiter to all requests
app.use(apiLimiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Fetch Twitch OAuth token
async function fetchTwitchToken() {
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`Error fetching token: ${data.error} - ${data.message}`);
        return data.access_token;
    } catch (error) {
        console.error('Failed to fetch Twitch OAuth token:', error);
        return null;
    }
}

// Fetch Twitch data
async function fetchTwitchData(token) {
    const users = ["SidneyEweka", "fl0m", "Ranger", "ohnePixel", "jasontheween", "BLASTPremier", "trausi", "Fibii", "PRXf0rsakeN", "Dashy", "s0mcs", "d0cc_tv", "Smacko"];
    const queryParams = users.map(user => `user_login=${user}`).join('&');
    const response = await fetch(`https://api.twitch.tv/helix/streams?${queryParams}`, {
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

// Fetch and cache Twitch data if it's not in cache or expired
async function getTwitchData() {
    let cachedData = cache.get('twitchData');
    if (!cachedData) {
        let token = cache.get('twitchToken');
        if (!token) {
            token = await fetchTwitchToken();
            if (token) cache.set('twitchToken', token, 3600); // Cache token for 1 hour
        }
        if (token) {
            const twitchData = await fetchTwitchData(token);
            cache.set('twitchData', twitchData, 60); // Cache Twitch data for 1 minute
            return twitchData;
        }
    }
    return cachedData;
}

// Polling endpoint for updates (manual and Twitch)
app.get('/updates', async (req, res) => {
    try {
        const twitchData = await getTwitchData();
        const manualStatuses = cache.get('userStatuses') || {};
        res.json({
            twitch: twitchData,
            manual: manualStatuses
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

// Handle manual status updates (admin or user pages)
app.post('/update-user-status', (req, res) => {
    const { user, state } = req.body || {};

    if (!user || !state) {
        return res.status(400).send('Missing user or state');
    }

    if (user && (state === 'on' || state === 'off')) {
        userStatuses[user] = state;
        cache.set('userStatuses', userStatuses); // Cache the updated user statuses
        res.sendStatus(200);
    } else {
        res.status(400).send('Invalid user or state');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
