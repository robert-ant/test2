import { WebSocketServer } from 'ws'; // Import WebSocketServer from ws
import express from 'express';
import cookieSession from 'cookie-session';
import bodyParser from 'body-parser';
import csurf from 'csurf';
import path from 'path';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import Bottleneck from 'bottleneck';
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
app.use(bodyParser.json()); // To parse JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded requests

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Broadcast function to send data to all connected clients
const broadcast = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {  // Correct usage of client.OPEN
            client.send(JSON.stringify(data));
        }
    });
};

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

// Periodically fetch Twitch data and broadcast it to connected clients
setInterval(async () => {
    let token = cache.get('twitchToken');
    if (!token) {
        token = await fetchTwitchToken();
        if (token) cache.set('twitchToken', token, 3600); // Cache token for 1 hour
    }
    if (token) {
        const twitchData = await fetchTwitchData(token);
        cache.set('twitchData', twitchData, 300); // Cache Twitch data for 5 minutes
        broadcast({ type: 'twitch-update', data: twitchData }); // Broadcast Twitch data to all clients
    }
}, 60000); // Fetch every 1 minute

// Handle manual status updates (e.g., from admin or user pages)
app.post('/update-user-status', (req, res) => {
    const { user, state } = req.body || {}; // Ensure req.body exists

    if (!user || !state) {
        return res.status(400).send('Missing user or state'); // Handle missing body data
    }

    if (user && (state === 'on' || state === 'off')) {
        userStatuses[user] = state; // Update user status
        cache.set('userStatuses', userStatuses); // Cache the updated user statuses
        broadcast({ type: 'manual-update', user, state }); // Broadcast manual update to all clients
        res.sendStatus(200);
    } else {
        res.status(400).send('Invalid user or state');
    }
});

// Middleware for serving static files and handling session and CSRF
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'default_secret'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Serve static frontend files (e.g., adminPage, user1Page, etc.)
app.use(express.static(path.join(__dirname, 'frontend')));

// CSRF Protection Middleware
const csrfProtection = csurf({ cookie: false });

// Route to provide CSRF token
app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Route for login handling with CSRF protection
app.post('/login', csrfProtection, (req, res) => {
    const { username, password } = req.body;
    const validUsers = {
        admin: 'password',
        user1: 'password1',
        user2: 'password2',
        user3: 'password3',
        user4: 'password4',
        user5: 'password5',
        user6: 'password6',
        user7: 'password7',
        user8: 'password8',
        user9: 'password9',
        user10: 'password10',
        user11: 'password11',
        user12: 'password12'
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
        'user12Page.html'
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

// Start the server and integrate WebSocket with HTTP server
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});

// Handle WebSocket connection
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    // Send cached Twitch data immediately upon connection
    const cachedTwitchData = cache.get('twitchData');
    if (cachedTwitchData) {
        ws.send(JSON.stringify({ type: 'twitch-update', data: cachedTwitchData }));
    }

    // Send cached user statuses immediately upon connection
    ws.send(JSON.stringify({ type: 'manual-status-update', data: userStatuses }));

    // Send initial welcome message
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WebSocket server' }));
});
