import express from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import path, { dirname } from 'path';
import cookieSession from 'cookie-session';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Bottleneck from 'bottleneck';
import https from 'https';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 0, checkperiod: 150 });

// Restore cached maps if present; else start empty
let userStatuses   = cache.get('userStatuses')   || {};
let adminOverrides = cache.get('adminOverrides') || {};

// ---------- Security headers ----------
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ---------- Parsing ----------
app.use(bodyParser.json({ limit: '50kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, 'frontend')));

// ---------- Sessions ----------
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}));

// ---------- Rate limits ----------
app.set('trust proxy', 1);

const updatesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/updates', updatesLimiter);

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many status changes, please slow down.',
});
app.use('/update-user-status', writeLimiter);

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/login', loginLimiter);

// ---------- Twitch helpers ----------
const twitchLimiter = new Bottleneck({ minTime: 1000, maxConcurrent: 1 });
const agent = new https.Agent({ keepAlive: true });

async function retryFetchWithBackoff(url, options, retries = 3, delay = 2000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying in ${delay} ms... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, delay));
      return retryFetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

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

async function fetchTwitchData(token) {
  // Edit this list to match the Twitch users you want to track
  const users = ['carms', 'm6isnik', 'qellox1', 'stother', 'deeppepper', 'marmormaze', 'chukubala'];
  const queryParams = users.map((u) => `user_login=${u}`).join('&');
  const url = `https://api.twitch.tv/helix/streams?${queryParams}`;

  const options = {
    headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
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
    if (token) cache.set('twitchToken', token, 3600); // 1h
  }
  if (token) {
    const twitchData = await fetchTwitchData(token);
    if (twitchData) cache.set('twitchData', twitchData, 300); // 5m
  }
}, 120000);

// ---------- /updates (frontend pulls) ----------
app.get('/updates', (req, res) => {
  const twitchData = cache.get('twitchData') || { data: [] };
  const finalStatuses = { ...userStatuses, ...adminOverrides }; // admin overrides win
  res.json({ twitch: twitchData, manual: finalStatuses });
});

// ---------- Display name <-> userId mapping ----------
const DISPLAY_TO_ID = {
  'Ralf Paldermaa': 'user1',
  'Mariliis Kaer': 'user2',
  'Kaspar Wang': 'user3',
  // user4 not listed
  'Sebfreiberg': 'user5',
  'Artjom': 'user6',
  'Säm': 'user7',
  'Sidni': 'user8',
  'Estmagicz': 'user9',
  'Kozip Maia': 'user10',
  'Kozip Mihkel': 'user11',
  'TormTuleb': 'user12',
  'Gerhard Trolla': 'user13',
  'Krispoiss': 'user14',
  'Selgrootu': 'user15',
};

function coerceToUserId(raw) {
  const u = String(raw || '').trim();
  if (!u) return null;
  if (u.toLowerCase() === 'admin') return 'admin';
  if (/^user(1[0-5]?|[1-9])$/i.test(u)) return u.toLowerCase(); // already userN
  return DISPLAY_TO_ID[u] || null; // try display name
}

function isValidState(s) { return s === 'on' || s === 'off' || s === 'neutral'; }
function isKnownUserId(u) {
  return [
    'admin','user1','user2','user3','user4','user5','user6','user7','user8',
    'user9','user10','user11','user12','user13','user14','user15'
  ].includes(u);
}

// ---------- Manual status updates (admin/user pages) ----------
app.post('/update-user-status', (req, res) => {
  const { user: rawUser, state, isAdmin } = req.body || {};
  const user = coerceToUserId(rawUser);

  if (!user || !isValidState(state) || !isKnownUserId(user)) {
    return res.status(400).send('Bad request');
  }

  if (isAdmin) {
    // Admin "one-shot" action: write directly and auto-neutralize
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

// ---------- Login (bcrypt hashes via .env) ----------
const VALID_USERS = [
  'admin','user1','user2','user3','user4','user5','user6','user7','user8',
  'user9','user10','user11','user12','user13','user14','user15'
];

function getHashForUser(username) {
  if (!username) return null;
  const key = `PASS_HASH_${username.toUpperCase()}`; // e.g. PASS_HASH_USER1
  return process.env[key] || null;
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!VALID_USERS.includes(username || '')) {
    return res.status(401).send('Invalid username or password');
  }
  const hash = getHashForUser(username);
  if (!hash) return res.status(401).send('Invalid username or password');

  const ok = await bcrypt.compare(password || '', hash);
  if (!ok) return res.status(401).send('Invalid username or password');

  req.session.user = username;
  res.json({ page: `${username}Page.html` });
});

// ---------- Serve whitelisted pages (separate user pages) ----------
app.get('/:userPage', (req, res) => {
  const userPage = req.params.userPage;
  const validPages = [
    'index.html',
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

  if (!validPages.includes(userPage)) {
    return res.status(404).send('Page not found');
  }

  if (userPage === 'adminPage.html') {
    if (req.session.user === 'admin') {
      return res.sendFile(path.join(__dirname, 'frontend', userPage));
    }
    return res.status(403).send('Forbidden');
  }

  // Enforce user -> their own page only
  const expected = `${req.session.user}Page.html`;
  if (req.session.user && userPage === expected) {
    return res.sendFile(path.join(__dirname, 'frontend', userPage));
  }
  return res.status(403).send('Forbidden');
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
