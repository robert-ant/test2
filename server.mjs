import express from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import path, { dirname } from 'path';
import cookieSession from 'cookie-session';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Bottleneck from 'bottleneck';            // lowercase import on Windows
import https from 'https';
import crypto from 'crypto';                    // for HMAC verification
import bcrypt from 'bcryptjs';                  // for password hashes
import helmet from 'helmet';                    // security headers

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 0, checkperiod: 150 });
let userStatuses = cache.get('userStatuses') || {};
let adminOverrides = cache.get('adminOverrides') || {};

// ---------- Security headers ----------
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ---------- Body parsing ----------
app.use(bodyParser.json({ limit: '50kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, 'frontend')));

// ---------- Session cookie ----------
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],              // set in .env
  maxAge: 24 * 60 * 60 * 1000,                     // 24h
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}));

// ---------- Rate limiting ----------
app.set('trust proxy', 1); // behind Cloudflare/host

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
  max: 20,                           // per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/login', loginLimiter);

const hookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use('/hook', hookLimiter);

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
    } else {
      throw error;
    }
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
  const users = ['carms', 'm6isnik', 'qellox1', 'stother', 'deeppepper', 'marmormaze', 'chukubala']; // edit
  const queryParams = users.map((u) => `user_login=${u}`).join('&');
  const url = `https://api.twitch.tv/helix/streams?${queryParams}`;
  const options = {
    headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
    agent, timeout: 15000,
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

setInterval(async () => {
  let token = cache.get('twitchToken');
  if (!token) {
    token = await fetchTwitchToken();
    if (token) cache.set('twitchToken', token, 3600); // 1h
  }
  if (token) {
    const twitchData = await fetchTwitchData(token);
    if (twitchData) cache.set('twitchData', twitchData, 300); // 5min
  }
}, 120000);

// ---------- Updates (frontend pulls) ----------
app.get('/updates', (req, res) => {
  const twitchData = cache.get('twitchData') || { data: [] };
  const finalStatuses = { ...userStatuses, ...adminOverrides };
  res.json({ twitch: twitchData, manual: finalStatuses });
});

// ---------- HMAC webhook (from OBS/Streamlabs helper) ----------
/**
 * Map userId -> { displayName, secret }
 *  - displayName: EXACT label used on your site
 *  - secret: per-user long random string
 *
 * Move this to a small JSON if you prefer; keep secrets out of Git.
 */
const USER_SECRETS = {
  // user1: { displayName: 'Ralf Paldermaa', secret: process.env.USER1_SECRET },
  // user2: { displayName: 'Mariliis Kaer',   secret: process.env.USER2_SECRET },
};

function verifySignature(req) {
  const userId = req.header('x-user-id');
  const ts     = req.header('x-timestamp');
  const sig    = req.header('x-signature');

  if (!userId || !ts || !sig) return { ok: false, code: 400, msg: 'Missing auth headers' };
  const rec = USER_SECRETS[userId];
  if (!rec) return { ok: false, code: 403, msg: 'Unknown user' };

  const age = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(age) || age > 5 * 60 * 1000) return { ok: false, code: 403, msg: 'Stale timestamp' };

  const payload  = `${req.method}|${req.path}|${ts}`;
  const expected = crypto.createHmac('sha256', rec.secret).update(payload).digest('hex');

  try {
    const ok = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    if (!ok) return { ok: false, code: 403, msg: 'Bad signature' };
  } catch {
    return { ok: false, code: 403, msg: 'Bad signature' };
  }
  return { ok: true, displayName: rec.displayName };
}

app.post('/hook/go-live', (req, res) => {
  const v = verifySignature(req);
  if (!v.ok) return res.status(v.code).send(v.msg);
  userStatuses[v.displayName] = 'on';
  cache.set('userStatuses', userStatuses);
  delete adminOverrides[v.displayName];
  cache.set('adminOverrides', adminOverrides);
  console.log(`[HOOK] ${v.displayName} → on`);
  res.json({ ok: true });
});

app.post('/hook/go-offline', (req, res) => {
  const v = verifySignature(req);
  if (!v.ok) return res.status(v.code).send(v.msg);
  userStatuses[v.displayName] = 'off';
  cache.set('userStatuses', userStatuses);
  delete adminOverrides[v.displayName];
  cache.set('adminOverrides', adminOverrides);
  console.log(`[HOOK] ${v.displayName} → off`);
  res.json({ ok: true });
});

// ---------- Manual status updates (from site) ----------
function isValidState(s) { return s === 'on' || s === 'off' || s === 'neutral'; }
function isKnownUser(u) {
  return [
    'admin','user1','user2','user3','user4','user5','user6','user7','user8',
    'user9','user10','user11','user12','user13','user14','user15'
  ].includes(u);
}

app.post('/update-user-status', (req, res) => {
  const { user, state, isAdmin } = req.body || {};
  if (!isKnownUser(user) || !isValidState(state)) {
    return res.status(400).send('Bad request');
  }

  if (isAdmin) {
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
    if (state === 'on' || state === 'off') {
      userStatuses[user] = state;
      cache.set('userStatuses', userStatuses);
      console.log(`User ${user} set status -> ${state}`);
    }
  }
  res.json({ success: true });
});

// ---------- Login (NO plaintext passwords in code) ----------
/**
 * We keep the list of allowed usernames in code,
 * but the password *hashes* live in environment variables.
 *
 * For each username, set PASS_HASH_<UPPERCASE_USERNAME> in your .env
 * Example: PASS_HASH_ADMIN, PASS_HASH_USER1, ...
 */
const VALID_USERS = [
  'admin','user1','user2','user3','user4','user5','user6','user7','user8',
  'user9','user10','user11','user12','user13','user14','user15'
];

function getHashForUser(username) {
  if (!username) return null;
  const key = `PASS_HASH_${username.toUpperCase()}`;
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

// ---------- Serve user pages ----------
app.get('/:userPage', (req, res) => {
  const userPage = req.params.userPage;
  const validPages = [
    'adminPage.html',
    'user1Page.html','user2Page.html','user3Page.html','user4Page.html','user5Page.html',
    'user6Page.html','user7Page.html','user8Page.html','user9Page.html','user10Page.html',
    'user11Page.html','user12Page.html','user13Page.html','user14Page.html','user15Page.html',
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

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
