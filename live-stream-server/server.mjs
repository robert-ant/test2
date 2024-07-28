import express from 'express';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import findOpenPort from 'find-open-port';
import path from 'path';
import { fileURLToPath } from 'url';

// Required to resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const defaultPort = process.env.PORT || 3001;

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;
let twitchOAuthToken;

const youtubeCache = new NodeCache({ stdTTL: 9 }); // Cache for 9 seconds
const twitchCache = new NodeCache({ stdTTL: 9 }); // Cache for 9 seconds

console.log("YouTube API Key:", youtubeApiKey);
console.log("Twitch Client ID:", twitchClientId);
console.log("Twitch Client Secret:", twitchClientSecret);

app.use(express.static('frontend')); // Serve static files from the 'frontend' directory

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
            twitchOAuthToken = data.access_token;
            console.log('Twitch Access Token:', twitchOAuthToken);
        } else {
            console.error('Error obtaining Twitch Access Token:', data);
        }
    } catch (error) {
        console.error('Error fetching Twitch OAuth token:', error);
    }
}

// Call function to get token on startup
getTwitchOAuthToken();

app.get('/youtube/live/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const cachedResponse = youtubeCache.get(channelId);

    if (cachedResponse) {
        return res.json(cachedResponse);
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&key=${youtubeApiKey}&channelId=${channelId}`;
        console.log(`Fetching YouTube data from URL: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error('YouTube API error:', data);
            return res.status(data.error.code).json({ message: data.error.message, errors: data.error.errors });
        }

        youtubeCache.set(channelId, data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        res.status(500).json({ error: 'Error fetching YouTube data', details: error });
    }
});

app.get('/twitch/live', async (req, res) => {
    const cachedResponse = twitchCache.get('twitch-live');

    if (cachedResponse) {
        return res.json(cachedResponse);
    }

    if (!twitchOAuthToken) {
        await getTwitchOAuthToken();
    }

    try {
        const url = `https://api.twitch.tv/helix/streams?user_login=krispoissyuh&user_login=rommy1337&user_login=raido_ttv&user_login=ohnePixel&user_login=KuruHS`;
        console.log(`Fetching Twitch data from URL: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Client-ID': twitchClientId,
                'Authorization': `Bearer ${twitchOAuthToken}`
            }
        });
        
        if (!response.ok) {
            console.error('Twitch API request failed:', response.statusText);
            return res.status(response.status).json({ error: response.statusText });
        }

        const data = await response.json();
        
        if (data.error) {
            console.error('Twitch API error:', data);
            return res.status(data.status).json({ message: data.message, errors: data.errors });
        }

        console.log('Twitch API response:', data);

        twitchCache.set('twitch-live', data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching Twitch data:', error);
        res.status(500).json({ error: 'Error fetching Twitch data', details: error });
    }
});

// Find an open port and start the server
findOpenPort({ startPort: defaultPort }).then(port => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch(error => {
    console.error('Error finding open port:', error);
});
