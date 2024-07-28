document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logo = document.getElementById('logo');
    const toggleImage = document.getElementById('toggleImage');

    const darkModeLogo = 'assets/LOGOversionNIGHT.png';
    const lightModeLogo = 'assets/LOGOversionBASIC.png';
    const lightModeImage = 'assets/son.png';
    const darkModeImage = 'assets/muun.png';

    // Initialize the toggle image and mode from localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
        logo.src = darkModeLogo;
        toggleImage.src = darkModeImage;
        document.body.style.backgroundImage = "url('assets/2024-07-14_18.17.57.jpg')";
    } else {
        logo.src = lightModeLogo;
        toggleImage.src = lightModeImage;
        document.body.style.backgroundImage = "url('assets/2024-07-14_18.17.44.jpg')";
    }

    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        if (darkModeToggle.checked) {
            localStorage.setItem('darkMode', 'enabled');
            logo.style.opacity = '0';
            setTimeout(() => {
                logo.src = darkModeLogo;
                toggleImage.src = darkModeImage;
                document.body.style.backgroundImage = "url('assets/2024-07-14_18.17.57.jpg')";
                logo.style.opacity = '1';
            }, 250);
        } else {
            localStorage.setItem('darkMode', 'disabled');
            logo.style.opacity = '0';
            setTimeout(() => {
                logo.src = lightModeLogo;
                toggleImage.src = lightModeImage;
                document.body.style.backgroundImage = "url('assets/2024-07-14_18.17.44.jpg')";
                logo.style.opacity = '1';
            }, 250);
        }
    });

    // Function to create streamer element
    function createStreamerElement(username, thumbnail, platform) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online');
        div.id = username;

        const img = document.createElement('img');
        img.src = thumbnail;
        img.alt = `${username} thumbnail`;

        const name = document.createElement('span');
        name.innerText = `${username} (${platform})`;

        div.appendChild(img);
        div.appendChild(name);

        return div;
    }

    // Function to update the streamers
    function updateStreamers() {
        // Ensure containers exist
        if (!liveContainer) {
            console.error('Live container not found.');
            return;
        }

        // Clear existing live container
        liveContainer.innerHTML = '';

        // Fetch Twitch live streams
        fetch('http://localhost:3001/twitch/live')  // Ensure this matches the port your server is running on
            .then(response => response.json())
            .then(data => {
                if (data.data && data.data.length > 0) {
                    const liveUsers = data.data.map(stream => ({
                        username: stream.user_login.toLowerCase(),
                        thumbnail: stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
                        platform: 'Twitch'
                    }));

                    liveUsers.forEach(user => {
                        const streamerDiv = createStreamerElement(user.username, user.thumbnail, user.platform);
                        liveContainer.appendChild(streamerDiv);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching Twitch data:', error);
            });

        // Fetch YouTube live streams for each channel
        const youtubeChannelIds = [
            "UCx27Pkk8plpiosF14qXq-VA",
            "UCSJ4gkVC6NrvII8umztf0Ow"
        ];

        youtubeChannelIds.forEach(channelId => {
            fetch(`/youtube/live/${channelId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.items && data.items.length > 0) {
                        const stream = data.items[0];
                        const username = stream.snippet.channelTitle.toLowerCase();
                        const thumbnail = stream.snippet.thumbnails.medium.url;
                        const streamerDiv = createStreamerElement(username, thumbnail, 'YouTube');
                        liveContainer.appendChild(streamerDiv);
                    }
                })
                .catch(error => {
                    console.error('Error fetching YouTube data:', error);
                });
        });
    }

    // Initial load
    updateStreamers();

    // Set interval to update streamers every minute
    setInterval(updateStreamers, 60000); // 60000ms = 1 minute
});
