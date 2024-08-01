import express from 'express';
import cookieSession from 'cookie-session';
import bodyParser from 'body-parser';
import csurf from 'csurf';
import path from 'path';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import Bottleneck from 'bottleneck';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import findOpenPort from 'find-open-port';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

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
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' https://static-cdn.jtvnw.net data:; script-src 'self'");
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
    return data.access_token;
}

// Function to fetch live stream data from Twitch
async function fetchTwitchData(token) {
    const users = ["krispoissyuh", "rommy1337", "raido_ttv", "ohnePixel", "KuruHS", "Joehills", "NickEh30", "xChocoBars"];
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
            token = await fetchTwitchToken();
            cache.set('twitchToken', token);
        }
        const twitchData = await fetchTwitchData(token);
        res.json(twitchData);
    } catch (error) {
        console.error('Error fetching Twitch data:', error);
        res.status(500).json({ error: 'Failed to fetch Twitch data' });
    }
});

// Route to provide CSRF token
app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Login route with CSRF protection
app.post('/login', csrfProtection, (req, res) => {
    const { username, password } = req.body;

    // Here you would validate the username and password against your database
    if (username === 'admin' && password === 'password') {
        req.session.user = username;
        res.json({ page: 'adminPage.html' });
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// Serve admin page
app.get('/adminPage', (req, res) => {
    if (req.session.user === 'admin') {
        res.sendFile(path.join(__dirname, 'frontend', 'adminPage.html'));
    } else {
        res.status(403).send('Forbidden');
    }
});

// Port finder
findOpenPort().then(openPort => {
    fs.writeFileSync(path.join(__dirname, 'frontend', 'port.txt'), openPort.toString());
    app.listen(openPort, () => {
        console.log(`Server running at http://localhost:${openPort}`);
    });
}).catch(err => {
    console.error('Failed to find an open port:', err);
});
