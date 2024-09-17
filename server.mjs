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
import dotenv from 'dotenv'; // Import dotenv

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy headers set by Vercel or other reverse proxies
app.set('trust proxy', 1); // Trust the first proxy

const PORT = process.env.PORT || 3000; // Use Vercel's port or default to 3000

// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Cookie session middleware
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'default_session_secret'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CSRF protection middleware
const csrfProtection = csurf({ cookie: false });

// Set CSP headers
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https://static-cdn.jtvnw.net; script-src 'self'");
    next();
});

// Rate limiting middleware for incoming requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Rate limiter for Twitch API requests
const apiLimiter = new Bottleneck({
    minTime: 75, // Minimum time between requests, Twitch allows 800 requests per minute
    maxConcurrent: 1 // Ensure only one request at a time
});

// Function to fetch Twitch OAuth token
async function fetchTwitchToken() {
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            })
        });

        const data = await response.json();

        // Log the response for debugging
        console.log('Twitch Token Response:', data);

        if (!response.ok) {
            throw new Error(`Error fetching token: ${data.error} - ${data.message}`);
        }

        return data.access_token;
    } catch (error) {
        console.error('Failed to fetch Twitch OAuth token:', error);
        return null; // Return null if the token fetch fails
    }
}

// Function to fetch live stream data from Twitch
async function fetchTwitchData(token) {
    const users = ["SidneyEweka", "fl0m", "Ranger", "ohnePixel", "jasontheween", "BLASTPremier", "trausi", "Fibii", "PRXf0rsakeN", "Dashy", "s0mcs", "d0cc_tv", "Smacko"];
    const queryParams = users.map(user => `user_login=${user}`).join('&');
    const response = await apiLimiter.schedule(() =>
        fetch(`https://api.twitch.tv/helix/streams?${queryParams}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`
            }
        })
    );
    const data = await response.json();
    return data;
}

// Cache setup
const cache = new NodeCache({ stdTTL: 300, checkperiod: 150 });

// Route to get live Twitch streams
app.get('/twitch/live', csrfProtection, async (req, res) => {
    try {
        let token = cache.get('twitchToken');
        if (!token) {
            console.log('No cached token found. Fetching a new one...');
            token = await fetchTwitchToken();
            if (!token) {
                return res.status(500).json({ error: 'Failed to fetch Twitch OAuth token' });
            }
            cache.set('twitchToken', token, 3600); // Cache token for 1 hour (3600 seconds)
        }

        let twitchData = cache.get('twitchData');
        if (!twitchData) {
            console.log('No cached Twitch data found. Fetching new data...');
            twitchData = await fetchTwitchData(token);
            if (!twitchData) {
                return res.status(500).json({ error: 'Failed to fetch Twitch data' });
            }
            cache.set('twitchData', twitchData, 300); // Cache data for 5 minutes
        }

        res.json(twitchData);
    } catch (error) {
        console.error('Error in /twitch/live route:', error);  // Log the exact error
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Store user statuses
const userStatuses = {};

// Endpoint to update user status
app.post('/update-user-status', (req, res) => {
    const { user, state } = req.body;
    if (user && (state === 'on' || state === 'off')) {
        userStatuses[user] = state;
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

// Endpoint to get user status
app.get('/user-status', (req, res) => {
    res.json(userStatuses);
});

// Route to provide CSRF token
app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Login route with CSRF protection
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

// Serve user pages
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

// Start the server on the correct port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
