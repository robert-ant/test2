document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Twitch users with only thumbnails (no live images for Twitch users)
    const twitchUsers = [
        { username: "StoTheR", channelName: "StoTheR", thumbnail: "assets/pfp/stother.jpeg" },
        { username: "Freq_k", channelName: "Freq_k", thumbnail: "assets/pfp/freq.jpg" },
        { username: "Carms", channelName: "Carms", thumbnail: "assets/pfp/carms.png" },
        { username: "M6isnik", channelName: "M6isnik", thumbnail: "assets/pfp/mõisnik.png" },
        { username: "Qellox", channelName: "Qellox1", thumbnail: "assets/pfp/qellox.png" },
        { username: "DeepPepper", channelName: "DeepPepper", thumbnail: "assets/pfp/New_Pepper.png" }
    ];

    // Custom users with thumbnails and live images
    const customUsers = [
        { username: "RalfYT", channelName: "RalfYT", url: "https://www.youtube.com/@ismaralf", thumbnail: "assets/pfp/ralf.jpg", liveImage: "assets/live/ralf-live.jpg" },
        { username: "Mariliiskaer", channelName: "Mariliiskaer", url: "https://www.tiktok.com/@hundijalavesi?lang=en", thumbnail: "assets/pfp/mari.jpeg", liveImage: "assets/live/mari-live.jpg" },
        { username: "Kaspar Wang", channelName: "Kaspar Wang", url: "https://www.tiktok.com/@kaspar_in_estonia", thumbnail: "assets/pfp/Kaspar.png", liveImage: "assets/live/kaspar-live.jpg" },
        { username: "MARMORMAZE", channelName: "MARMORMAZE", url: "https://www.tiktok.com/@marmormaze", thumbnail: "assets/pfp/marmo.jpg", liveImage: "assets/live/marmo-live.jpg" },
        { username: "Sebfreiberg", channelName: "Sebfreiberg", url: "https://www.tiktok.com/@sebfreiberg", thumbnail: "assets/pfp/seb.jpg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Artjom", channelName: "Artjom", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/artjom.jpeg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Lu0fn", channelName: "Lu0fn", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/luo.jpeg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Säm", channelName: "Säm", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/sam.png", liveImage: "assets/live/seb-live.jpg" },
        { username: "Sidni", channelName: "Sidni", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/sidni.jpg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Estmagicz", channelName: "Estmagicz", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/oliver.jpg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Kozip Maia", channelName: "Kozip Maia", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/kozip.png", liveImage: "assets/live/seb-live.jpg" },
        { username: "Kozip Mihkel", channelName: "Kozip Mihkel", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/kozip.png", liveImage: "assets/live/seb-live.jpg" },
        { username: "TormTuleb", channelName: "TormTuleb", url: "https://www.tiktok.com/@bieberismyfather/live", thumbnail: "assets/pfp/torm.jpg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Roosabanaanike", channelName: "Roosabanaanike", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/roosa.png", liveImage: "assets/live/seb-live.jpg" },
        { username: "Gerhard Trolla", channelName: "Gerhard Trolla", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/gerhard.jpeg", liveImage: "assets/live/seb-live.jpg" },
        { username: "Krispoiss", channelName: "Krispoiss", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/kris.png", liveImage: "assets/live/seb-live.jpg" }
    ];

    // Load cached data from localStorage
    let cachedTwitchData = JSON.parse(localStorage.getItem('twitchData')) || null;
    let cachedManualStatus = JSON.parse(localStorage.getItem('manualStatuses')) || {};
    let lastUpdateTimestamp = localStorage.getItem('lastUpdateTimestamp') || 0;

    const CACHE_DURATION = 5 * 60 * 1000; // Cache for 5 minutes (in milliseconds)
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

    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (localStorage.getItem('darkMode') === 'enabled' || (systemDarkMode && !localStorage.getItem('darkMode'))) {
        enableDarkMode();
    }

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

    // Create streamer elements for the live container (use `liveImage` only for custom users)
    function createStreamerElement(username, channelName, image, url) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online', 'fade-in');
        div.id = username;

        const img = document.createElement('img');
        img.src = image || 'assets/emoji.png';  // Use liveImage for custom users, thumbnail for Twitch users
        img.alt = `${username} live image`;
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

    // Create sidebar user elements (use `thumbnail` for sidebar)
    function createSidebarUserElement(username, channelName, url, thumbnail) {
        const li = document.createElement('li');
        li.id = `${username}-sidebar`;

        const img = document.createElement('img');
        img.src = thumbnail || 'assets/emoji.png';  // Use thumbnail for sidebar
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

    // Update Twitch elements in the live container (use thumbnail, no live image for Twitch users)
    function updateTwitchElements(liveUsernames, streamsData) {
        twitchUsers.forEach(user => {
            const isLive = liveUsernames.includes(user.username.toLowerCase());
            let existingElement = document.getElementById(user.username);

            let streamData = streamsData.find(s => s.user_login.toLowerCase() === user.username.toLowerCase());
            let image = user.thumbnail || (streamData ? streamData.thumbnail_url.replace('{width}', '320').replace('{height}', '180') : 'assets/emoji.png'); // Use thumbnail for live image

            let url = `https://www.twitch.tv/${user.username}`;

            if (isLive) {
                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, image, url);
                    liveContainer.appendChild(newElement);
                } else {
                    existingElement.querySelector('img').src = image;
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

    // Update custom user elements in the live container (use `liveImage` for custom users)
    function updateManualElements(manualStatuses) {
        console.log('Updating manual elements:', manualStatuses);
        cachedManualStatus = { ...manualStatuses };

        customUsers.forEach(user => {
            const isManualOn = manualStatuses[user.username] === 'on';

            let existingElement = document.getElementById(user.username);
            if (isManualOn) {
                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, user.liveImage, user.url);
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

        // Add Twitch users to the sidebar
        twitchUsers.forEach(user => {
            let url = `https://www.twitch.tv/${user.username}`;
            let imgSrc = user.thumbnail; // Use thumbnail for sidebar

            const userLi = createSidebarUserElement(user.username, user.channelName, url, imgSrc);
            sidebarContainer.appendChild(userLi);
        });

        // Add custom users to the sidebar
        customUsers.forEach(user => {
            const userLi = createSidebarUserElement(user.username, user.channelName, user.url, user.thumbnail);
            sidebarContainer.appendChild(userLi);
        });
    }

    // Poll the server every 2 minutes
    function pollForUpdates() {
        if (isCacheValid) {
            console.log('Cache is valid, using cached data.');
            return;
        }

        console.log('Fetching data from backend...');
        fetch('/updates')
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched from backend:", data);
                if (data.twitch && data.twitch.data) {
                    const liveUsernames = data.twitch.data.map(stream => stream.user_login.toLowerCase());
                    updateTwitchElements(liveUsernames, data.twitch.data);
                    localStorage.setItem('twitchData', JSON.stringify(data.twitch.data));
                }

                if (data.manual) {
                    updateManualElements(data.manual);
                    localStorage.setItem('manualStatuses', JSON.stringify(data.manual));
                }

                localStorage.setItem('lastUpdateTimestamp', Date.now().toString());
            })
            .catch(error => console.error('Error fetching updates:', error));
    }

    function refreshUserPages() {
        const userPages = {
            'user1Page': 'RalfYT',
            'user2Page': 'hundijalavesi'
        };

        Object.keys(userPages).forEach(page => {
            const user = userPages[page];
            let switchElement = document.getElementById(`${user}-switch`);

            if (!switchElement) {
                console.warn(`Switch element not found for user: ${user}`);
                return;
            }

            const savedState = localStorage.getItem(`${user}-switch-state`);
            if (savedState) {
                switchElement.checked = savedState === 'on';
            }

            fetch('/updates')
                .then(response => response.json())
                .then(data => {
                    const adminOverrideState = data.manual[user];
                    if (adminOverrideState) {
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

    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "user1Page.html" || currentPage === "user2Page.html") {
        refreshUserPages();
        setInterval(refreshUserPages, 120000);
    }

    pollForUpdates();
    setInterval(pollForUpdates, 120000);

    updateSidebar(); // Update sidebar immediately
});
