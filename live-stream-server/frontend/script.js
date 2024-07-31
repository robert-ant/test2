document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logo = document.getElementById('logo');
    const toggleImage = document.getElementById('toggleImage');

    const darkModeLogo = 'assets/LOGOversionNIGHT.png';
    const lightModeLogo = 'assets/LOGOversionBASIC.png';
    const lightModeImage = 'assets/son.png';
    const darkModeImage = 'assets/muun.png';

    const customLogos = {
        "krispoissyuh": "assets/krispoissyuh_logo.png",
        "rommy1337": "assets/rommy1337_logo.png",
        "raido_ttv": "assets/raido_ttv_logo.png",
        "ohnePixel": "assets/ohnePixel_logo.png",
        "KuruHS": "assets/KuruHS_logo.png",
        "Joehills": "assets/Joehills_logo.png"
    };

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

    // Function to create streamer element for live section
    function createStreamerElement(username, channelName, thumbnail, platform) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online');
        div.id = username;

        const img = document.createElement('img');
        img.src = thumbnail.replace('{width}', '320').replace('{height}', '180');
        img.alt = `${username} thumbnail`;

        const name = document.createElement('span');
        name.innerText = `${channelName} (${platform})`;

        div.appendChild(img);
        div.appendChild(name);

        return div;
    }

    // Function to create sidebar user element
    function createSidebarUserElement(username, channelName) {
        const li = document.createElement('li');
        li.id = username;

        const img = document.createElement('img');
        img.src = customLogos[username] || 'assets/default_logo.png';
        img.alt = `${username} logo`;
        img.classList.add('sidebar-logo');

        const name = document.createElement('span');
        name.innerText = channelName || username;
        name.classList.add('sidebar-text');

        li.appendChild(img);
        li.appendChild(name);

        return li;
    }

    // Function to update the streamers
    function updateStreamers() {
        // Ensure containers exist
        if (!liveContainer || !sidebarContainer) {
            console.error('Containers not found.');
            return;
        }

        // Clear existing live container
        liveContainer.innerHTML = '';

        // Clear existing sidebar container
        sidebarContainer.innerHTML = '';

        // Fetch Twitch live streams
        fetch('/twitch/live')
            .then(response => response.json())
            .then(data => {
                console.log('Twitch data:', data);
                if (data.data && data.data.length > 0) {
                    const liveUsers = data.data.map(stream => ({
                        username: stream.user_login.toLowerCase(),
                        channelName: stream.user_name,
                        thumbnail: stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
                        platform: 'Twitch'
                    }));

                    liveUsers.forEach(user => {
                        const streamerDiv = createStreamerElement(user.username, user.channelName, user.thumbnail, user.platform);
                        liveContainer.appendChild(streamerDiv);

                        const userLi = createSidebarUserElement(user.username, user.channelName);
                        sidebarContainer.appendChild(userLi);
                    });
                } else {
                    console.log('No live Twitch streams found.');
                }
            })
            .catch(error => {
                console.error('Error fetching Twitch data:', error);
            });
    }

    // Initial load
    updateStreamers();

    // Set interval to update streamers every minute
    setInterval(updateStreamers, 60000); // 60000ms = 1 minute
});
