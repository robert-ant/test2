document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list'); // Sidebar element
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    const twitchUsers = [
        { username: "LeekBeats", channelName: "LeekBeats" },
        { username: "fl0m", channelName: "fl0m" },
        { username: "ohnePixel", channelName: "OhnePixel" },
        { username: "Ranger", channelName: "Ranger" },
        { username: "jasontheween", channelName: "jasontheween" },
        { username: "BLASTPremier", channelName: "BLASTPremier" },
        { username: "trausi", channelName: "trausi" },
        { username: "Fibii", channelName: "Fibii" },
        { username: "PRXf0rsakeN", channelName: "PRXf0rsakeN" },
        { username: "Dashy", channelName: "Dashy" },
        { username: "s0mcs", channelName: "s0mcs" },
        { username: "d0cc_tv", channelName: "d0cc_tv" },
        { username: "Smacko", channelName: "Smacko" }
    ];

    const customUsers = [
        { username: "user1", channelName: "user1", url: "https://www.tiktok.com/", thumbnail: "assets/emoji.png" },
        { username: "user2", channelName: "user2", url: "customPage2.html", thumbnail: "assets/emoji.png" },
        { username: "user3", channelName: "user3", url: "customPage3.html", thumbnail: "assets/emoji.png" },
        { username: "user4", channelName: "user4", url: "customPage4.html", thumbnail: "assets/emoji.png" },
        { username: "user5", channelName: "user5", url: "customPage5.html", thumbnail: "assets/emoji.png" },
    ];

    let cachedTwitchData = null;
    let cachedManualStatus = {};

    // Dark mode functionality
    function enableDarkMode() {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
        localStorage.setItem('darkMode', 'enabled');
    }

    function disableDarkMode() {
        body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
        localStorage.setItem('darkMode', 'disabled');
    }

    // Check system preference for dark mode
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (localStorage.getItem('darkMode') === 'enabled' || (systemDarkMode && !localStorage.getItem('darkMode'))) {
        enableDarkMode();
    }

    // Toggle dark mode on switch change
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

    // Create streamer elements for the live container
    function createStreamerElement(username, channelName, thumbnail, url) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online', 'fade-in');
        div.id = username;

        const img = document.createElement('img');
        img.src = thumbnail;
        img.alt = `${username} thumbnail`;
        img.classList.add('stream-thumbnail');

        const name = document.createElement('span');
        name.innerText = channelName;

        div.appendChild(img);
        div.appendChild(name);

        div.addEventListener('click', () => {
            window.location.href = url;
        });

        return div;
    }

    // Create sidebar user elements
    function createSidebarUserElement(username, channelName, url) {
        const li = document.createElement('li');
        li.id = `${username}-sidebar`;

        const img = document.createElement('img');
        img.src = 'assets/emoji.png';
        img.alt = `${username} logo`;
        img.classList.add('sidebar-logo');

        const name = document.createElement('a');
        name.href = url;
        name.innerText = channelName || username;
        name.classList.add('sidebar-text');

        li.appendChild(img);
        li.appendChild(name);

        return li;
    }

    // Update Twitch elements in the live container
    function updateTwitchElements(liveUsernames, streamsData) {
        if (!streamsData || streamsData.length === 0) {
            console.log('No Twitch users are live.');
            return;
        }

        console.log('Live Twitch usernames:', liveUsernames);
        console.log('Streams data:', streamsData);

        if (JSON.stringify(liveUsernames) === JSON.stringify(cachedTwitchData)) {
            return;
        }

        cachedTwitchData = [...liveUsernames];

        twitchUsers.forEach(user => {
            const isLive = liveUsernames.includes(user.username.toLowerCase());
            let existingElement = document.getElementById(user.username);

            if (isLive) {
                let thumbnail = 'assets/emoji.png';
                let url = `https://www.twitch.tv/${user.username}`;

                const stream = streamsData.find(s => s.user_login.toLowerCase() === user.username.toLowerCase());
                if (stream) {
                    thumbnail = stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180');
                }

                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, thumbnail, url);
                    liveContainer.appendChild(newElement);
                } else {
                    existingElement.querySelector('img').src = thumbnail;
                    existingElement.querySelector('span').innerText = user.channelName;
                    existingElement.classList.remove('fade-out');
                    existingElement.classList.add('fade-in');
                }
            } else if (existingElement) {
                existingElement.classList.add('fade-out');
                setTimeout(() => liveContainer.removeChild(existingElement), 500);
            }
        });

        updateSidebar();
    }

    // Update manual elements in the live container
    function updateManualElements(manualStatuses) {
        console.log('Manual statuses:', manualStatuses);

        if (JSON.stringify(manualStatuses) === JSON.stringify(cachedManualStatus)) {
            return;
        }

        cachedManualStatus = { ...manualStatuses };

        customUsers.forEach(user => {
            const isManualOn = manualStatuses[user.username] === 'on';
            let existingElement = document.getElementById(user.username);

            if (isManualOn) {
                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, user.thumbnail, user.url);
                    liveContainer.appendChild(newElement);
                } else {
                    existingElement.classList.remove('fade-out');
                    existingElement.classList.add('fade-in');
                }
            } else if (existingElement) {
                existingElement.classList.add('fade-out');
                setTimeout(() => liveContainer.removeChild(existingElement), 500);
            }
        });

        updateSidebar();
    }

    // Function to update the sidebar
    function updateSidebar() {
        sidebarContainer.innerHTML = '';

        [...twitchUsers, ...customUsers].forEach(user => {
            const url = twitchUsers.find(tu => tu.username === user.username) ? `https://www.twitch.tv/${user.username}` : user.url;
            const userLi = createSidebarUserElement(user.username, user.channelName, url);
            sidebarContainer.appendChild(userLi);
        });
    }

    // Poll the server every 2 minutes
    function pollForUpdates() {
        fetch('/updates')
            .then(response => response.json())
            .then(data => {
                if (data.twitch && data.twitch.data) {
                    const liveUsernames = data.twitch.data.map(stream => stream.user_login.toLowerCase());
                    updateTwitchElements(liveUsernames, data.twitch.data);
                } else {
                    console.log('No Twitch data found.');
                }

                if (data.manual) {
                    updateManualElements(data.manual);
                } else {
                    console.log('No manual statuses found.');
                }
            })
            .catch(error => console.error('Error fetching updates:', error));
    }

    setInterval(pollForUpdates, 120000);
    pollForUpdates();

    updateSidebar();
});
