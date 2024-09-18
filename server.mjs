import express from 'express';
import cookieSession from 'cookie-session';
import bodyParser from 'body-parser';
import csurf from 'csurf';
import path from 'path';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 300, checkperiod: 150 });
const userStatuses = cache.get('userStatuses') || {}; // Load cached userStatuses from NodeCache

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// SSE endpoint for real-time updates
const clients = new Set(); // Keep track of connected SSE clients

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Function to send data
    const sendData = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send welcome message and cached data on connect
    sendData({ type: 'welcome', message: 'Connected to SSE server' });

    // Send both Twitch data and manual status on connect
    const cachedTwitchData = cache.get('twitchData');
    if (cachedTwitchData) {
        sendData({ type: 'twitch-update', data: cachedTwitchData });
    }

    const cachedStatuses = cache.get('userStatuses');
    if (cachedStatuses) {
        sendData({ type: 'manual-status-update', data: cachedStatuses });
    }

    // Store client connection
    clients.add({ res });

    // Clean up when the client disconnects
    req.on('close', () => {
        clients.delete({ res });
        res.end();
    });
});

// Function to broadcast updates to all connected clients
function broadcast(message) {
    clients.forEach(client => {
        if (client.res) {
            client.res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
    });
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

// Periodically fetch Twitch data and replace the old cache
setInterval(async () => {
    let token = cache.get('twitchToken');
    if (!token) {
        token = await fetchTwitchToken();
        if (token) cache.set('twitchToken', token, 3600); // Cache token for 1 hour
    }
    if (token) {
        const twitchData = await fetchTwitchData(token);
        cache.set('twitchData', twitchData, 300); // Cache Twitch data for 5 minutes

        // Broadcast Twitch data to all clients
        broadcast({ type: 'twitch-update', data: twitchData });
    }
}, 60000); // Fetch every 1 minute

// Handle manual status updates (admin or user pages)
app.post('/update-user-status', (req, res) => {
    const { user, state } = req.body || {};

    if (!user || !state) {
        return res.status(400).send('Missing user or state');
    }

    if (user && (state === 'on' || state === 'off')) {
        userStatuses[user] = state;
        cache.set('userStatuses', userStatuses); // Cache the updated user statuses

        // Broadcast manual update instantly
        broadcast({
            type: 'manual-status-update',
            data: userStatuses // Send updated statuses to all clients
        });

        res.sendStatus(200);
    } else {
        res.status(400).send('Invalid user or state');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
