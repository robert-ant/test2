import express from 'express';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import csurf from 'csurf';
import helmet from 'helmet';
import xss from 'xss-clean';
import path from 'path';
import { fileURLToPath } from 'url';
import validator from 'validator';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

dotenv.config();

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
}

const app = express();
const port = process.env.PORT || 3001;

const users = {
    "user1": { password: await bcrypt.hash("password1", 10), page: "user1Page" },
    "user2": { password: await bcrypt.hash("password2", 10), page: "user2Page" },
    "admin": { password: await bcrypt.hash("adminpassword", 10), page: "adminPage" }
};

const twitchUsers = ['krispoissyuh', 'rommy1337', 'raido_ttv', 'ohnePixel', 'KuruHS', 'Joehills'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middlewares
app.use(helmet());
app.use(xss());
app.use(express.json({ limit: '10kb' }));

// Content Security Policy to allow loading Twitch thumbnails
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "data:", "https://static-cdn.jtvnw.net"]
        }
    })
);

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Session middleware
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Ensures the browser only sends the cookie over HTTPS
    httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not client JavaScript
    sameSite: 'strict' // Ensures the cookie is only sent for same-site requests
}));

// CSRF protection middleware
const csrfProtection = csurf({ cookie: false }); // Use session-based tokens instead of cookie-based tokens
app.use(csrfProtection);

// CSRF token endpoint
app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/login', limiter);

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).send('Invalid input');
    }

    // Sanitize inputs
    const sanitizedUsername = validator.escape(username);
    const sanitizedPassword = validator.escape(password);

    const user = users[sanitizedUsername];
    if (user && await bcrypt.compare(sanitizedPassword, user.password)) {
        req.session.username = sanitizedUsername;
        res.status(200).json({ page: user.page });
    } else {
        res.status(401).send('Invalid username or password');
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/dashboard', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You are not authenticated');
    }
    const user = users[req.session.username];
    if (!user) {
        return res.status(403).send('Access denied');
    }
    res.redirect(`/${user.page}`);
});

app.get('/adminPage', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You are not authenticated');
    }
    const user = users[req.session.username];
    if (user.page !== 'adminPage') {
        return res.status(403).send('Access denied');
    }
    res.sendFile(path.join(__dirname, 'frontend', 'adminPage.html'));
});

// Define routes for other user pages
app.get('/user1Page', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You are not authenticated');
    }
    const user = users[req.session.username];
    if (user.page !== 'user1Page') {
        return res.status(403).send('Access denied');
    }
    res.sendFile(path.join(__dirname, 'frontend', 'user1Page.html'));
});

app.get('/user2Page', (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('You are not authenticated');
    }
    const user = users[req.session.username];
    if (user.page !== 'user2Page') {
        return res.status(403).send('Access denied');
    }
    res.sendFile(path.join(__dirname, 'frontend', 'user2Page.html'));
});

// Add more routes for other users

// Twitch token fetch function
async function fetchTwitchToken() {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
        method: 'POST'
    });
    const data = await response.json();
    return data.access_token;
}

// Get Twitch live streams
async function getTwitchLiveStreams(token) {
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUsers.join('&user_login=')}`, {
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

app.get('/twitch/live', async (req, res) => {
    try {
        const cachedData = cache.get('twitchLiveData');
        if (cachedData) {
            return res.json(cachedData);
        }

        const token = await fetchTwitchToken();
        const data = await getTwitchLiveStreams(token);
        cache.set('twitchLiveData', data);

        res.json(data);
    } catch (error) {
        console.error('Error fetching Twitch data:', error);
        res.status(500).json({ error: 'Failed to fetch Twitch data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
