import express from 'express';
import rateLimit from 'express-rate-limit'; // Keep only one import here
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
const cache = new NodeCache({ stdTTL: 0, checkperiod: 150 });
let userStatuses = cache.get('userStatuses') || {};
let adminOverrides = cache.get('adminOverrides') || {};

// Middleware to parse incoming request bodies
app.use(bodyParser.json({ limit: '50kb' })); // small safety hardening
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Session Middleware
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
  const users = ['carms', 'm6isnik', 'qellox1', 'stother', 'deeppepper', 'marmormaze', 'chukubala']; // Replace with your users
  const queryParams = users.map((user) => `user_login=${user}`).join('&');
  const url = `https://api.twitch.tv/helix/streams?${queryParams}`;

  const options = {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
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
    if (token) cache.set('twitchToken', token, 3600); // Cache token for 1 hour
  }
  if (token) {
    const twitchData = await fetchTwitchData(token);
    if (twitchData) {
      cache.set('twitchData', twitchData, 300); // Cache Twitch data for 5 minutes
    }
  }
}, 120000);

// Polling endpoint for updates (manual and Twitch)
app.get('/updates', (req, res) => {
  const twitchData = cache.get('twitchData') || { data: [] };
  const finalStatuses = { ...userStatuses, ...adminOverrides }; // Admin overrides take precedence

  res.json({
    twitch: twitchData,
    manual: finalStatuses,
  });
});

// --- Rate limiting ---
// Trust proxy for correct IPs behind hosts like Railway/Render/NGINX
app.set('trust proxy', 1);

// Apply rate-limiting to /updates route (max 100 requests per 15 minutes per IP)
const updatesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/updates', updatesLimiter);

// NEW: Apply a write limiter to /update-user-status (20 writes/min/IP)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many status changes, please slow down.',
});
app.use('/update-user-status', writeLimiter);

// Handle manual status updates (admin or user pages)
app.post('/update-user-status', (req, res) => {
  const { user, state, isAdmin } = req.body;

  if (!user || !state) {
    return res.status(400).send('Missing user or state');
  }

  if (isAdmin) {
    // One-shot override: apply directly to userStatuses, then auto-neutralize admin override
    if (state === 'on' || state === 'off') {
      userStatuses[user] = state;
      cache.set('userStatuses', userStatuses);
      delete adminOverrides[user];
      cache.set('adminOverrides', adminOverrides);
      console.log(`Admin forced ${user} -> ${state} (auto-neutralized)`);
    } else if (state === 'neutral') {
      delete adminOverrides[user];
      cache.set('adminOverrides', adminOverrides);
      console.log(`Admin set ${user} to neutral`);
    }
  } else {
    // Regular user update
    if (state === 'on' || state === 'off') {
      userStatuses[user] = state;
      cache.set('userStatuses', userStatuses);
      console.log(`User ${user} set status -> ${state}`);
    }
  }

  res.json({ success: true });
});

// Route for login handling
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const validUsers = {
    admin: 'jcneojrwäipnrobbevj=(I"!',
    user1: 'oiwrgbäouewi(&/()=',
    user2: 'difc4sw5678¤%&',
    user3: 'djhebwvgiubb/&%¤',
    user4: 'aepovh54#¤%&/()',
    user5: 'user5_¤%&/(passwopwqdrvord',
    user6: '=/&%FVBJGFTR#"',
    user7: 'KVTXE#&/PV',
    user8: 'user8_paoishvcy&CVYssword',
    user9: 'ihyfvc98sgPGYF¤&/',
    user10: 'jubuvcYBREE%¤###2567',
    user11: 'OOIV7894198)/&%',
    user12: 'user12_passjwbqyv%##%&/(75664fgcwFIYSVword',
    user13: 'user12_passjwb##%&/(75664fgcwFIYSVword',
    user14: 'user12_passjwbqyv%##%&/(75IYSVword',
    user15: 'OIHGBunbfe/(=6544567',
  };

  if (validUsers[username] && validUsers[username] === password) {
    req.session.user = username;
    res.json({ page: `${username}Page.html` });
  } else {
    res.status(401).send('Invalid username or password');
  }
});

// Route to serve user pages (user1Page.html, user2Page.html, etc.)
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
    'user13Page.html',
    'user14Page.html',
    'user15Page.html',
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
