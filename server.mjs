import express from 'express';
import bodyParser from 'body-parser';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import path from 'path';
import cookieSession from 'cookie-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import Bottleneck from 'bottleneck';
import https from 'https';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 0, checkperiod: 150 });  // Set stdTTL to 0 for no expiration
let userStatuses = cache.get('userStatuses') || {};  // Cache for manual box statuses

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Session Middleware
app.use(
    cookieSession({
        name: 'session',
        keys: [process.env.SESSION_SECRET],
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    })
);

// Bottleneck to limit Twitch API requests
const twitchLimiter = new Bottleneck({
    minTime: 1000,
    maxConcurrent: 1,
});

// Agent to reuse connections
const agent = new https.Agent({
    keepAlive: true,
});

// Retry function with exponential backoff for fetch failures
async function retryFetchWithBackoff(url, options, retries = 3, delay = 2000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying in ${delay} ms... (${retries} retries left)`);
            await new Promise((res) => setTimeout(res, delay));
            return retryFetchWithBackoff(url, options, retries - 1, delay * 2);
        } else {
            throw error;
        }
    }
}

// Fetch Twitch OAuth token
async function fetchTwitchToken() {
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials',
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`Error fetching token: ${data.error} - ${data.message}`);
        return data.access_token;
    } catch (error) {
        console.error('Failed to fetch Twitch OAuth token:', error);
        return null;
    }
}

// Fetch Twitch data with retries and throttling
async function fetchTwitchData(token) {
    const users = ['LeekBeats', 'fl0m', 'Ranger', 'ohnePixel', 'jasontheween'];
    const queryParams = users.map((user) => `user_login=${user}`).join('&');
    const url = `https://api.twitch.tv/helix/streams?${queryParams}`;

    const options = {
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`,
        },
        agent,
        timeout: 15000,
    };

    try {
        const response = await twitchLimiter.schedule(() => retryFetchWithBackoff(url, options));
        console.log('Fetched Twitch Data:', response);
        return response;
    } catch (error) {
        console.error('Error fetching Twitch data after retries:', error);
        return null;
    }
}

// Periodically fetch Twitch data and cache it
setInterval(async () => {
    let token = cache.get('twitchToken');
    if (!token) {
        token = await fetchTwitchToken();
        if (token) cache.set('twitchToken', token, 3600);  // Cache token for 1 hour
    }
    if (token) {
        const twitchData = await fetchTwitchData(token);
        if (twitchData) {
            cache.set('twitchData', twitchData, 300);  // Cache Twitch data for 5 minutes
        }
    }
}, 120000);

// Polling endpoint for updates (manual and Twitch)
app.get('/updates', (req, res) => {
    const twitchData = cache.get('twitchData') || { data: [] };  // Ensure twitchData is always an array
    const manualStatuses = cache.get('userStatuses') || {};  // Ensure manual statuses are retrieved and cached

    res.json({
        twitch: twitchData,
        manual: manualStatuses
    });
});

// Handle manual status updates (admin or user pages)
app.post('/update-user-status', (req, res) => {
    const { user, state } = req.body || {};

    if (!user || !state) {
        return res.status(400).send('Missing user or state');
    }

    if (state === 'on' || state === 'off') {
        userStatuses[user] = state;
        cache.set('userStatuses', userStatuses);  // Cache the updated user statuses
        return res.sendStatus(200);
    }

    return res.status(400).send('Invalid state');
});

// Route for login handling
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const validUsers = {
        admin: 'admin_password',
        user1: 'user1_password',
        user2: 'user2_password',
        user3: 'user3_password',
        user4: 'user4_password',
        user5: 'user5_password',
        user6: 'user6_password',
        user7: 'user7_password',
        user8: 'user8_password',
        user9: 'user9_password',
        user10: 'user10_password',
        user11: 'user11_password',
        user12: 'user12_password',
    };

    if (validUsers[username] && validUsers[username] === password) {
        req.session.user = username;
        res.json({ page: `${username}Page.html` });
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// Route to serve user pages (adminPage, user1Page, etc.)
app.get('/:userPage', (req, res) => {
    const userPage = req.params.userPage;
    const validPages = [
        'adminPage.html',
        'user1Page.html',
        'user2Page.html',
        'user3Page.html',
        'user4Page.html',
        'user5Page.html',
        'user6Page.html',
        'user7Page.html',
        'user8Page.html',
        'user9Page.html',
        'user10Page.html',
        'user11Page.html',
        'user12Page.html',
    ];

    if (validPages.includes(userPage)) {
        if (req.session.user && userPage === `${req.session.user}Page.html`) {
            res.sendFile(path.join(__dirname, 'frontend', userPage));
        } else {
            res.status(403).send('Forbidden');
        }
    } else {
        res.status(404).send('Page not found');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
