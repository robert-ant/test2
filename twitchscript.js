const clientId = 'pl2hu83toh8d6havf73susul1lqdri';
const clientSecret = '2htkl1prhlw07750xzjne3a6owdx2p';
const url = 'https://id.twitch.tv/oauth2/token';

const params = new URLSearchParams();
params.append('client_id', clientId);
params.append('client_secret', clientSecret);
params.append('grant_type', 'client_credentials');

fetch(url, {
    method: 'POST',
    body: params
})
.then(response => response.json())
.then(data => console.log('Access Token:', data.access_token))
.catch(error => console.error('Error:', error));