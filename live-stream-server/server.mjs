import express from 'express';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import findOpenPort from 'find-open-port';

dotenv.config();

const app = express();
const defaultPort = process.env.PORT || 3001;

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

const youtubeCache = new NodeCache({ stdTTL: 300, checkperiod: 150 }); // Cache for 5 minutes
const twitchCache = new NodeCache({ stdTTL: 300, checkperiod: 150 }); // Cache for 5 minutes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to get Twitch OAuth token
async function getTwitchOAuthToken() {
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', twitchClientId);
    params.append('client_secret', twitchClientSecret);
    params.append('grant_type', 'client_credentials');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: params
        });
        const data = await response.json();
        if (data.access_token) {
            console.log('Twitch OAuth token fetched successfully:', data.access_token);
            return data.access_token;
        } else {
            console.error('Error obtaining Twitch Access Token:', data);
        }
    } catch (error) {
        console.error('Error fetching Twitch OAuth token:', error);
    }
}

let twitchOAuthToken;

// Periodic task to update Twitch OAuth token
cron.schedule('0 * * * *', async () => {
    twitchOAuthToken = await getTwitchOAuthToken();
    console.log('Twitch OAuth token updated:', twitchOAuthToken);
});

// Function to fetch YouTube live streams
async function fetchYouTubeLiveStreams() {
    const youtubeChannelIds = ["UCx27Pkk8plpiosF14qXq-VA", "UCSJ4gkVC6NrvII8umztf0Ow"];
    for (const channelId of youtubeChannelIds) {
        try {
            const cachedData = youtubeCache.get(channelId);
            if (!cachedData) {
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&key=${youtubeApiKey}&channelId=${channelId}`;
                const response = await fetch(url);
                const data = await response.json();
                if (!data.error) {
                    youtubeCache.set(channelId, data);
                    console.log(`YouTube data fetched and cached for channel: ${channelId}`);
                } else {
                    console.error('YouTube API error:', data);
                }
            }
        } catch (error) {
            console.error('Error fetching YouTube data:', error);
        }
    }
}

// Function to fetch Twitch live streams
async function fetchTwitchLiveStreams() {
    const twitchUsers = ["krispoissyuh", "rommy1337", "raido_ttv", "ohnePixel", "KuruHS"];
    if (!twitchOAuthToken) {
        twitchOAuthToken = await getTwitchOAuthToken();
    }
    console.log('Using Twitch OAuth token:', twitchOAuthToken);
    try {
        const cachedData = twitchCache.get('twitch-live');
        if (!cachedData) {
            const url = `https://api.twitch.tv/helix/streams?user_login=${twitchUsers.join('&user_login=')}`;
            const response = await fetch(url, {
                headers: {
                    'Client-ID': twitchClientId,
                    'Authorization': `Bearer ${twitchOAuthToken}`
                }
            });
            const data = await response.json();
            if (!data.error) {
                twitchCache.set('twitch-live', data);
                console.log('Twitch data fetched and cached', data);
            } else {
                console.error('Twitch API error:', data);
                console.log('Twitch API response status:', response.status);
                console.log('Twitch API response headers:', JSON.stringify(response.headers.raw()));
            }
        }
    } catch (error) {
        console.error('Error fetching Twitch data:', error);
    }
}

// Schedule periodic fetching every 5 minutes to stay within rate limits
cron.schedule('*/5 * * * *', () => {
    fetchYouTubeLiveStreams();
    fetchTwitchLiveStreams();
});

// API endpoints to serve cached data
app.get('/youtube/live/:channelId', (req, res) => {
    const { channelId } = req.params;
    const cachedResponse = youtubeCache.get(channelId);
    if (cachedResponse) {
        res.json(cachedResponse);
    } else {
        res.status(404).json({ error: 'No data available' });
    }
});

app.get('/twitch/live', (req, res) => {
    const cachedResponse = twitchCache.get('twitch-live');
    if (cachedResponse) {
        res.json(cachedResponse);
    } else {
        res.status(404).json({ error: 'No data available' });
    }
});

// Find an open port and start the server
findOpenPort({ startingPort: defaultPort, endingPort: defaultPort + 100 })
    .then(openPort => {
        app.listen(openPort, () => {
            console.log(`Server running at http://localhost:${openPort}`);
        });
    })
    .catch(error => {
        console.error('Error finding open port:', error);
    });
