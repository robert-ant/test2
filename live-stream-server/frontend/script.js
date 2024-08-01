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
        "krispoissyuh": "assets/kp.png",
        "rommy1337": "assets/kp.png",
        "raido_ttv": "assets/kp.png",
        "ohnePixel": "assets/kp.png",
        "KuruHS": "assets/kp.png",
        "Joehills": "assets/kp.png",
        "NickEh30": "assets/kp.png",
        "xChocoBars": "assets/kp.png"
    };

    const allUsers = [
        { username: "krispoissyuh", channelName: "Krispoiss" },
        { username: "rommy1337", channelName: "Rommy1337" },
        { username: "raido_ttv", channelName: "Raido_ttv" },
        { username: "ohnePixel", channelName: "OhnePixel" },
        { username: "KuruHS", channelName: "KuruHS" },
        { username: "Joehills", channelName: "Joehills" },
        { username: "NickEh30", channelName: "NickEh30" },
        { username: "xChocoBars", channelName: "xChocoBars" }
    ];

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
        img.src = thumbnail;
        img.alt = `${username} thumbnail`;
        img.classList.add('stream-thumbnail');

        const name = document.createElement('span');
        name.innerText = `${channelName} (${platform})`;

        div.appendChild(img);
        div.appendChild(name);

        return div;
    }

    // Function to create sidebar user element
    function createSidebarUserElement(username, channelName) {
        const li = document.createElement('li');
        li.id = `${username}-sidebar`;

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

        // Clear existing sidebar container
        sidebarContainer.innerHTML = '';

        // Add all users to the sidebar
        allUsers.forEach(user => {
            const userLi = createSidebarUserElement(user.username, user.channelName);
            sidebarContainer.appendChild(userLi);
        });

        // Clear existing live container
        liveContainer.innerHTML = '';

        // Fetch Twitch live streams
        fetch('/twitch/live')
            .then(response => response.json())
            .then(data => {
                console.log('Twitch data:', data);

                // Track live users
                const liveUsernames = data.data ? data.data.map(stream => stream.user_login.toLowerCase()) : [];

                // Update the live container
                allUsers.forEach(user => {
                    const sidebarElement = document.getElementById(`${user.username}-sidebar`);

                    if (liveUsernames.includes(user.username.toLowerCase())) {
                        const stream = data.data.find(s => s.user_login.toLowerCase() === user.username.toLowerCase());
                        const thumbnail = stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180');
                        const platform = 'Twitch';

                        // Create new element for live container
                        const streamerDiv = createStreamerElement(user.username, user.channelName, thumbnail, platform);
                        liveContainer.appendChild(streamerDiv);

                        // Highlight live users in the sidebar
                        if (sidebarElement) {
                            sidebarElement.classList.add('online');
                        }
                    } else {
                        // Remove online class from sidebar if user is not live
                        if (sidebarElement) {
                            sidebarElement.classList.remove('online');
                        }
                    }
                });
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
