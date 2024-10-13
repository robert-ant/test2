document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Twitch users fetched from Twitch API
    const twitchUsers = [
        { username: "StoTheR", channelName: "StoTheR" },
        { username: "freq_k", channelName: "freq_k" },
        { username: "Carms", channelName: "carms" },
        { username: "M6isnik", channelName: "m6isnik" },
        { username: "qellox", channelName: "qellox1" },
        { username: "DeepPepper", channelName: "DeepPepper" },
    ];

    const customUsers = [
        { username: "RalfYT", channelName: "RalfYT", url: "https://www.youtube.com/@ismaralf", thumbnail: "assets/emoji.png" },
        { username: "Mariliiskaer", channelName: "Mariliiskaer", url: "https://www.tiktok.com/@hundijalavesi?lang=en", thumbnail: "assets/emoji.png" },
        { username: "Kaspar Wang", channelName: "Kaspar Wang", url: "https://www.tiktok.com/@kaspar_in_estonia", thumbnail: "assets/emoji.png" },
        { username: "MARMORMAZE", channelName: "MARMORMAZE", url: "https://www.tiktok.com/@marmormaze", thumbnail: "assets/emoji.png" },
        { username: "sebfreiberg", channelName: "sebfreiberg", url: "https://www.tiktok.com/@sebfreiberg", thumbnail: "assets/emoji.png" },
        { username: "Artjom", channelName: "Artjom", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Lu0fn", channelName: "Lu0fn", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Säm", channelName: "Säm", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Sidni", channelName: "Sidni", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Estmagicz", channelName: "Estmagicz", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Kozip Maia", channelName: "Kozip Maia", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Kozip Mihkel", channelName: "Kozip Mihkel", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "TormTuleb", channelName: "TormTuleb", url: "https://www.tiktok.com/@bieberismyfather/live", thumbnail: "assets/emoji.png" },
        { username: "Gerhard Trolla", channelName: "Gerhard Trolla", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" },
        { username: "Krispoiss", channelName: "Krispoiss", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/emoji.png" }
        
    ];

    // Load cached data from localStorage
    let cachedTwitchData = JSON.parse(localStorage.getItem('twitchData')) || null;
    let cachedManualStatus = JSON.parse(localStorage.getItem('manualStatuses')) || {};
    let lastUpdateTimestamp = localStorage.getItem('lastUpdateTimestamp') || 0;

    // Check if cache is still valid (within 5 minutes)
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isCacheValid = (Date.now() - lastUpdateTimestamp) < CACHE_DURATION;

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
                setTimeout(() => liveContainer.removeChild(existingElement), 500); // Fade out and remove
            }
        });

        updateSidebar();
    }

    // Update manual elements in the live container
    function updateManualElements(manualStatuses) {
        console.log('Updating manual elements:', manualStatuses);
        cachedManualStatus = { ...manualStatuses };

        customUsers.forEach(user => {
            const isManualOn = manualStatuses[user.username] === 'on';

            let existingElement = document.getElementById(user.username);
            if (isManualOn) {
                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, user.thumbnail, user.url);
                    liveContainer.appendChild(newElement);
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

        // Add Twitch users and custom users to the sidebar
        [...twitchUsers, ...customUsers].forEach(user => {
            const url = twitchUsers.find(tu => tu.username === user.username) ? `https://www.twitch.tv/${user.username}` : user.url;
            const userLi = createSidebarUserElement(user.username, user.channelName, url);
            sidebarContainer.appendChild(userLi);
        });
    }

    // Poll the server every 2 minutes, but only if cache is invalid
    function pollForUpdates() {
        if (isCacheValid) {
            console.log('Cache is valid, using cached data.');
            return;
        }

        console.log('Fetching data from backend...');
        fetch('/updates')
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched from backend:", data);  // Log data fetched from backend
                if (data.twitch && data.twitch.data) {
                    const liveUsernames = data.twitch.data.map(stream => stream.user_login.toLowerCase());
                    updateTwitchElements(liveUsernames, data.twitch.data);
                    localStorage.setItem('twitchData', JSON.stringify(data.twitch.data));  // Cache Twitch data
                }

                if (data.manual) {
                    updateManualElements(data.manual);
                    localStorage.setItem('manualStatuses', JSON.stringify(data.manual));  // Cache manual statuses
                }

                // Update the last update timestamp
                localStorage.setItem('lastUpdateTimestamp', Date.now().toString());
            })
            .catch(error => console.error('Error fetching updates:', error));
    }

    // Refresh logic for user1Page, user2Page, etc.
    function refreshUserPages() {
        const userPages = {
            'user1Page': 'RalfYT',
            'user2Page': 'hundijalavesi'
        };

        Object.keys(userPages).forEach(page => {
            const user = userPages[page];
            let switchElement = document.getElementById(`${user}-switch`);

            // Check if the switch element exists before proceeding
            if (!switchElement) {
                console.warn(`Switch element not found for user: ${user}`);
                return; // Exit if the element doesn't exist
            }

            const savedState = localStorage.getItem(`${user}-switch-state`);
            if (savedState) {
                switchElement.checked = savedState === 'on';
            }

            // Poll the backend every 2 minutes to check for admin overrides
            fetch('/updates')
                .then(response => response.json())
                .then(data => {
                    const adminOverrideState = data.manual[user];
                    if (adminOverrideState) {
                        // If the admin override differs from the local state, update the switch
                        if (adminOverrideState !== (switchElement.checked ? 'on' : 'off')) {
                            switchElement.checked = adminOverrideState === 'on';
                            localStorage.setItem(`${user}-switch-state`, adminOverrideState);  // Update cached state
                            console.log(`Admin override applied: ${adminOverrideState}`);
                        }
                    }
                })
                .catch(error => console.error('Error fetching updates:', error));
        });
    }

    // Page-specific logic: run refreshUserPages only on user pages
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "user1Page.html" || currentPage === "user2Page.html") {
        refreshUserPages();
        setInterval(refreshUserPages, 120000);  // Poll every 2 minutes for user page updates
    }

    // Poll for updates in general (this can be run on all pages)
    pollForUpdates();
    setInterval(pollForUpdates, 120000);  // Poll every 2 minutes for live updates

    updateSidebar(); // Update sidebar immediately
});
