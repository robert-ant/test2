document.addEventListener("DOMContentLoaded", function () {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list');
    const toggleSidebarWrapper = document.getElementById('toggleSidebarWrapper');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeSwitch = document.querySelector('.switch'); // whole switch (label)
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;
    const toggleImage = document.getElementById('darkModeImage');

    // --- Twitch users (sidebar + auto-live from Twitch API) ---
    const twitchUsers = [
        { username: "ChukuBala", channelName: "ChukuBala", thumbnail: "assets/pfp/chukupfp.png" },
        { username: "StoTheR", channelName: "StoTheR", thumbnail: "assets/pfp/stother.jpeg" },
        { username: "Carms", channelName: "Carms", thumbnail: "assets/pfp/carms.png" },
        { username: "M6isnik", channelName: "M6isnik", thumbnail: "assets/pfp/mõisnik.png" },
        { username: "qellox1", channelName: "Qellox1", thumbnail: "assets/pfp/qellox1.png" },
        { username: "DeepPepper", channelName: "DeepPepper", thumbnail: "assets/pfp/New_Pepper.png" },
        { username: "Marmormaze", channelName: "Marmormaze", thumbnail: "assets/pfp/marmo.jpg" }
    ];

    // --- Custom/manual users (sidebar + manual live images/URLs) ---
    const customUsers = [
        { username: "Ralf Paldermaa", channelName: "Ralf Paldermaa", url: "https://www.youtube.com/@ismaralf", thumbnail: "assets/pfp/ralf.jpg", liveImage: "assets/landscape/Ralfs.png" },
        { username: "Mariliis Kaer", channelName: "Mariliis Kaer", url: "https://www.tiktok.com/@hundijalavesi", thumbnail: "assets/pfp/mari.jpeg", liveImage: "assets/landscape/marihorizont.jpg" },
        { username: "Kaspar Wang", channelName: "Kaspar Wang", url: "https://www.tiktok.com/@kaspar_in_estonia", thumbnail: "assets/pfp/Kaspar.png", liveImage: "assets/landscape/Kasparhorisont.jpg" },
        { username: "Sebfreiberg", channelName: "Sebfreiberg", url: "https://www.tiktok.com/@sebfreiberg", thumbnail: "assets/pfp/seb.jpg", liveImage: "assets/landscape/Sebhorizont.jpg" },
        { username: "Artjom", channelName: "Artjom", url: "https://www.tiktok.com/@artjomsavitski", thumbnail: "assets/pfp/artjom.jpeg", liveImage: "assets/landscape/artjomhorizont.jpg" },
        { username: "Säm", channelName: "Säm", url: "https://www.tiktok.com/@ainukesam", thumbnail: "assets/pfp/sam.png", liveImage: "assets/landscape/samhorizont.jpg" },
        { username: "Sidni", channelName: "Sidni", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/sidni.jpg", liveImage: "assets/landscape/sidnihorizont.jpg" },
        { username: "Estmagicz", channelName: "Estmagicz", url: "https://www.youtube.com/@estmagicz", thumbnail: "assets/pfp/oliver.jpg", liveImage: "assets/landscape/hollohorizont.jpg" },
        { username: "Kozip Maia", channelName: "Kozip Maia", url: "https://www.youtube.com/@KozipEesti", thumbnail: "assets/pfp/kozip.png", liveImage: "assets/landscape/maia.jpg" },
        { username: "Kozip Mihkel", channelName: "Kozip Mihkel", url: "https://www.tiktok.com/@kozipeesti", thumbnail: "assets/pfp/kozip.png", liveImage: "assets/landscape/mihkel.jpg" },
        { username: "TormTuleb", channelName: "TormTuleb", url: "https://www.youtube.com/@Torm_tuleb", thumbnail: "assets/pfp/torm.jpg", liveImage: "assets/landscape/tormhorizont.jpg" },
        { username: "Gerhard Trolla", channelName: "Gerhard Trolla", url: "https://www.youtube.com/@gerhard.trolla", thumbnail: "assets/pfp/gerhard.jpeg", liveImage: "assets/landscape/gerhardhorizontuus.jpg" },
        { username: "Selgrootu", channelName: "Selgrootu", url: "https://www.tiktok.com/@selgrootu", thumbnail: "assets/pfp/selgrootu.jpg", liveImage: "assets/landscape/selgrootuhorizont.jpg" },
        { username: "Joosep Teeb Asju", channelName: "Joosep Teeb Asju", url: "https://youtube.com/@joosepteebasju", thumbnail: "assets/pfp/joosep.jpg", liveImage: "assets/emoji.png" },
        { username: "Krispoiss", channelName: "Krispoiss", url: "https://www.tiktok.com/@krispoiss", thumbnail: "assets/pfp/kris.png", liveImage: "assets/landscape/krissupissuhorizont.jpg" }
    ];

    // --- Manual page URLs (if they differ from the default "url" above) ---
    const manualUserUrls = {
        "Ralf Paldermaa": "https://www.youtube.com/@ismaralf",
        "Mariliis Kaer": "https://www.tiktok.com/@hundijalavesi/live",
        "Kaspar Wang": "https://www.tiktok.com/@kaspar_in_estonia/live",
        "Sebfreiberg": "https://www.tiktok.com//@sebfreiberg/live",
        "Artjom": "https://www.tiktok.com/@artjomsavitski/live",
        "Säm": "https://www.tiktok.com/@ainukesam/live",
        "Sidni": "https://www.tiktok.com/@bieberismyfather/live",
        "Estmagicz": "https://www.youtube.com/@estmagicz",
        "Kozip Maia": "https://www.youtube.com/@KozipEesti",
        "Kozip Mihkel": "https://www.tiktok.com/@kozipeesti/live",
        "TormTuleb": "https://www.youtube.com/@Torm_tuleb",
        "Gerhard Trolla": "https://www.youtube.com/@gerhard.trolla",
        "Selgrootu": "https://www.tiktok.com/@selgrootu/live",
        "Joosep Teeb Asju": "https://youtube.com/@joosepteebasju",
        "Krispoiss": "https://www.tiktok.com/@krispoiss/live"
    };

    // --- Map server user IDs to display names your UI uses ---
    const ID_TO_NAME = {
        user1: 'Ralf Paldermaa',
        user2: 'Mariliis Kaer',
        user3: 'Kaspar Wang',
        user5: 'Sebfreiberg',
        user6: 'Artjom',
        user7: 'Säm',
        user8: 'Sidni',
        user9: 'Estmagicz',
        user10: 'Kozip Maia',
        user11: 'Kozip Mihkel',
        user12: 'TormTuleb',
        user13: 'Gerhard Trolla',
        user14: 'Krispoiss',
        user15: 'Selgrootu'
        // add more if needed
    };

    // --- Cache handling ---
    let cachedTwitchData = JSON.parse(localStorage.getItem('twitchData')) || null;
    let cachedManualStatus = JSON.parse(localStorage.getItem('manualStatuses')) || {};
    let lastUpdateTimestamp = Number(localStorage.getItem('lastUpdateTimestamp') || 0);

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const isCacheValid = (Date.now() - lastUpdateTimestamp) < CACHE_DURATION;

    // --- Dark mode ---
    function enableDarkMode() {
        body.classList.add('dark-mode');
        if (toggleImage) toggleImage.src = 'assets/muun.png';
        localStorage.setItem('darkMode', 'enabled');
    }
    function disableDarkMode() {
        body.classList.remove('dark-mode');
        if (toggleImage) toggleImage.src = 'assets/son.png';
        localStorage.setItem('darkMode', 'disabled');
    }

    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (window.innerWidth <= 768) {
        if (darkModeSwitch) darkModeSwitch.style.display = 'none';
        if (systemDarkMode) enableDarkMode(); else disableDarkMode();
    } else {
        const stored = localStorage.getItem('darkMode');
        if (stored === 'enabled' || (!stored && systemDarkMode)) {
            enableDarkMode();
            if (darkModeToggle) darkModeToggle.checked = true;
        } else {
            disableDarkMode();
            if (darkModeToggle) darkModeToggle.checked = false;
        }
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                darkModeToggle.checked ? enableDarkMode() : disableDarkMode();
            });
        }
    }

    // --- Sidebar toggle (mobile) ---
    sidebar.classList.remove('visible');
    toggleSidebarWrapper.addEventListener('click', () => {
        sidebar.classList.toggle('visible');
    });

    // --- Helpers ---
    function normalizeManualKeys(obj) {
        // Convert user IDs to display names; keep display names as-is
        const out = {};
        for (const [k, v] of Object.entries(obj || {})) {
            const name = ID_TO_NAME[k] || k; // if 'user1' -> 'Ralf Paldermaa'; else keep k
            out[name] = v;
        }
        return out;
    }

    function loadFromCache() {
        if (cachedTwitchData) {
            const liveUsernames = cachedTwitchData.map(s => (s.user_login || '').toLowerCase());
            updateTwitchElements(liveUsernames, cachedTwitchData);
        }
        if (cachedManualStatus && Object.keys(cachedManualStatus).length > 0) {
            const normalized = normalizeManualKeys(cachedManualStatus);
            updateManualElements(normalized);
        }
    }

    function createStreamerElement(username, channelName, image, url) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online', 'fade-in');
        div.id = username;

        const img = document.createElement('img');
        img.src = image || 'assets/emoji.png';
        img.alt = `${username} live image`;
        img.classList.add('stream-thumbnail');

        const name = document.createElement('span');
        name.innerText = channelName;

        div.appendChild(img);
        div.appendChild(name);

        div.addEventListener('click', () => { window.location.href = url; });

        return div;
    }

    function createSidebarUserElement(username, channelName, url, thumbnail) {
        const li = document.createElement('li');
        li.id = `${username}-sidebar`;

        const img = document.createElement('img');
        img.src = thumbnail || 'assets/emoji.png';
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

    function updateTwitchElements(liveUsernames, streamsData) {
        twitchUsers.forEach(user => {
            const isLive = liveUsernames.includes(user.username.toLowerCase());
            let existingElement = document.getElementById(user.username);

            const streamData = streamsData.find(s => (s.user_login || '').toLowerCase() === user.username.toLowerCase());
            const twitchLiveImage = streamData
                ? streamData.thumbnail_url.replace('{width}', '320').replace('{height}', '180')
                : 'assets/emoji.png';

            const url = `https://www.twitch.tv/${user.username}`;

            if (isLive) {
                if (!existingElement) {
                    const el = createStreamerElement(user.username, user.channelName, twitchLiveImage, url);
                    liveContainer.appendChild(el);
                } else {
                    existingElement.querySelector('img').src = twitchLiveImage;
                    existingElement.querySelector('span').innerText = user.channelName;
                    existingElement.classList.remove('fade-out');
                    existingElement.classList.add('fade-in');
                }
            } else if (existingElement) {
                existingElement.classList.add('fade-out');
                setTimeout(() => {
                    if (existingElement.parentNode) liveContainer.removeChild(existingElement);
                }, 500);
            }
        });

        updateSidebar();
    }

    function updateManualElements(manualStatuses) {
        cachedManualStatus = { ...manualStatuses }; // keep cache aligned with normalized keys

        customUsers.forEach(user => {
            const isManualOn = manualStatuses[user.username] === 'on';
            let existingElement = document.getElementById(user.username);
            const manualUrl = manualUserUrls[user.username] || user.url;

            if (isManualOn) {
                if (!existingElement) {
                    const el = createStreamerElement(user.username, user.channelName, user.liveImage, manualUrl);
                    liveContainer.appendChild(el);
                } else {
                    existingElement.classList.remove('fade-out');
                    existingElement.classList.add('fade-in');
                    existingElement.querySelector('img').src = user.liveImage;
                    // ensure click goes to the manual URL
                    existingElement.onclick = () => { window.location.href = manualUrl; };
                }
            } else if (existingElement) {
                existingElement.classList.add('fade-out');
                setTimeout(() => {
                    if (existingElement.parentNode) liveContainer.removeChild(existingElement);
                }, 500);
            }
        });

        updateSidebar();
    }

    function updateSidebar() {
        sidebarContainer.innerHTML = '';

        // Twitch users
        twitchUsers.forEach(user => {
            const url = `https://www.twitch.tv/${user.username}`;
            const li = createSidebarUserElement(user.username, user.channelName, url, user.thumbnail);
            sidebarContainer.appendChild(li);
        });

        // Custom users
        customUsers.forEach(user => {
            const li = createSidebarUserElement(user.username, user.channelName, user.url, user.thumbnail);
            sidebarContainer.appendChild(li);
        });
    }

    // --- Polling /updates (normalize manual keys to display names) ---
    function pollForUpdates() {
        fetch('/updates', { method: 'GET', cache: 'no-store', headers: { 'accept': 'application/json' } })
            .then(res => res.json())
            .then(data => {
                if (data.twitch && Array.isArray(data.twitch.data)) {
                    const liveUsernames = data.twitch.data.map(s => (s.user_login || '').toLowerCase());
                    updateTwitchElements(liveUsernames, data.twitch.data);
                    localStorage.setItem('twitchData', JSON.stringify(data.twitch.data));
                }

                if (data.manual && typeof data.manual === 'object') {
                    const normalized = normalizeManualKeys(data.manual);
                    updateManualElements(normalized);
                    localStorage.setItem('manualStatuses', JSON.stringify(normalized));
                }

                localStorage.setItem('lastUpdateTimestamp', Date.now().toString());
            })
            .catch(err => console.error('Error fetching updates:', err));
    }

    // Poll every 10s (snappier while testing; you can bump to 120000 later)
    setInterval(pollForUpdates, 10000);

    // Load cache (if valid) or fetch fresh
    if (isCacheValid) {
        loadFromCache();
    } else {
        pollForUpdates();
    }

    updateSidebar();

    // --- Optional: refresh user pages (admin override reflect on toggles) ---
    function refreshUserPages() {
        const userPages = {
            'user1Page': 'Ralf Paldermaa',
            'user2Page': 'Mariliis Kaer',
            'user3Page': 'Kaspar Wang',
            'user5Page': 'Sebfreiberg',
            'user6Page': 'Artjom',
            'user7Page': 'Säm',
            'user8Page': 'Sidni',
            'user9Page': 'Estmagicz',
            'user10Page': 'Kozip Maia',
            'user11Page': 'Kozip Mihkel',
            'user12Page': 'TormTuleb',
            'user13Page': 'Gerhard Trolla',
            'user14Page': 'Krispoiss',
            'user15Page': 'Selgrootu'
        };

        Object.keys(userPages).forEach(page => {
            const user = userPages[page];
            const switchElement = document.getElementById(`${user}-switch`);
            if (!switchElement) return;

            const savedState = localStorage.getItem(`${user}-switch-state`);
            if (savedState) switchElement.checked = savedState === 'on';

            fetch('/updates', { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    const normalized = normalizeManualKeys(data.manual || {});
                    const adminOverrideState = normalized[user];
                    if (adminOverrideState) {
                        const shouldBeChecked = adminOverrideState === 'on';
                        if (shouldBeChecked !== switchElement.checked) {
                            switchElement.checked = shouldBeChecked;
                            localStorage.setItem(`${user}-switch-state`, adminOverrideState);
                            console.log(`Admin override applied for ${user}: ${adminOverrideState}`);
                        }
                    }
                })
                .catch(err => console.error('Error fetching updates:', err));
        });
    }

    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "user1Page.html" || currentPage === "user2Page.html") {
        refreshUserPages();
        setInterval(refreshUserPages, 120000);
    }
});
