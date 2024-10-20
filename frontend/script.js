document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list');
    const toggleSidebarWrapper = document.getElementById('toggleSidebarWrapper');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeSwitch = document.querySelector('.switch'); // The whole switch element (label)
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;
    const toggleImage = document.getElementById('darkModeImage'); // Assuming there's an image element to indicate dark mode

    // Twitch users with only thumbnails for the sidebar
    const twitchUsers = [
        { username: "StoTheR", channelName: "StoTheR", thumbnail: "assets/pfp/stother.jpeg" },
        { username: "Freq_k", channelName: "Freq_k", thumbnail: "assets/pfp/freq.jpg" },
        { username: "Carms", channelName: "Carms", thumbnail: "assets/pfp/carms.png" },
        { username: "M6isnik", channelName: "M6isnik", thumbnail: "assets/pfp/mõisnik.png" },
        { username: "qellox1", channelName: "Qellox1", thumbnail: "assets/pfp/qellox1.png" },
        { username: "DeepPepper", channelName: "DeepPepper", thumbnail: "assets/pfp/New_Pepper.png" },
        { username: "Lu0fn", channelName: "Lu0fn", thumbnail: "assets/pfp/luo.jpeg" }   
    ];

    // Custom users with thumbnails and live images
    const customUsers = [
        { username: "Ralf Paldermaa", channelName: "Ralf Paldermaa", url: "https://www.youtube.com/@ismaralf", thumbnail: "assets/pfp/ralf.jpg", liveImage: "assets/landscape/Ralfs.png" },
        { username: "Mariliis Kaer", channelName: "Mariliis Kaer", url: "https://www.tiktok.com/@hundijalavesi?lang=en", thumbnail: "assets/pfp/mari.jpeg", liveImage: "assets/landscape/marihorizont.jpg" },
        { username: "Kaspar Wang", channelName: "Kaspar Wang", url: "https://www.tiktok.com/@kaspar_in_estonia", thumbnail: "assets/pfp/Kaspar.png", liveImage: "assets/landscape/Kasparhorisont.jpg" },
        { username: "Marmormaze", channelName: "Marmormaze", url: "https://www.tiktok.com/@marmormaze", thumbnail: "assets/pfp/marmo.jpg", liveImage: "assets/landscape/marmorhorizont.jpg" },
        { username: "Sebfreiberg", channelName: "Sebfreiberg", url: "https://www.tiktok.com/@sebfreiberg", thumbnail: "assets/pfp/seb.jpg", liveImage: "assets/landscape/Sebhorizont.jpg" },
        { username: "Artjom", channelName: "Artjom", url: "https://www.tiktok.com/@artjomsavitski", thumbnail: "assets/pfp/artjom.jpeg", liveImage: "assets/landscape/artjomhorizont.jpg" },
        { username: "Säm", channelName: "Säm", url: "https://www.tiktok.com/@ainukesam", thumbnail: "assets/pfp/sam.png", liveImage: "assets/landscape/samhorizont.jpg" },
        { username: "Sidni", channelName: "Sidni", url: "https://www.tiktok.com/@bieberismyfather", thumbnail: "assets/pfp/sidni.jpg", liveImage: "assets/landscape/sidnihorizont.jpg" },
        { username: "Estmagicz", channelName: "Estmagicz", url: "https://www.youtube.com/@estmagicz", thumbnail: "assets/pfp/oliver.jpg", liveImage: "assets/landscape/hollohorizont.jpg" },
        { username: "Kozip Maia", channelName: "Kozip Maia", url: "https://www.tiktok.com/@kozipeesti", thumbnail: "assets/pfp/kozip.png", liveImage: "assets/landscape/maia.jpg" },
        { username: "Kozip Mihkel", channelName: "Kozip Mihkel", url: "https://www.youtube.com/@KozipEesti", thumbnail: "assets/pfp/kozip.png", liveImage: "assets/landscape/mihkel.jpg" },
        { username: "TormTuleb", channelName: "TormTuleb", url: "https://www.youtube.com/@Torm_tuleb", thumbnail: "assets/pfp/torm.jpg", liveImage: "assets/landscape/tormhorizont.jpg" },
        { username: "Gerhard Trolla", channelName: "Gerhard Trolla", url: "https://www.youtube.com/@gerhard.trolla", thumbnail: "assets/pfp/gerhard.jpeg", liveImage: "assets/landscape/Gerhardhorizont.jpg" },
        { username: "Joosep Teeb Asju", channelName: "Joosep Teeb Asju", url: "https://youtube.com/@joosepteebasju", thumbnail: "assets/pfp/joosep.jpg", liveImage: "assets/emoji.png" },
        { username: "Krispoiss", channelName: "Krispoiss", url: "https://www.tiktok.com/@krispoiss", thumbnail: "assets/pfp/kris.png", liveImage: "assets/landscape/krissupissuhorizont.jpg" }
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
        if (toggleImage) {
            toggleImage.src = 'assets/muun.png'; // Change to moon image when dark mode is enabled
        }
        localStorage.setItem('darkMode', 'enabled');
    }

    function disableDarkMode() {
        body.classList.remove('dark-mode');
        if (toggleImage) {
            toggleImage.src = 'assets/son.png'; // Change to sun image when dark mode is disabled
        }
        localStorage.setItem('darkMode', 'disabled');
    }

    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply dark mode based on system preference on mobile and hide toggle
    if (window.innerWidth <= 768) {
        if (darkModeSwitch) {
            darkModeSwitch.style.display = 'none'; // Hide the entire dark mode switch on mobile
        }
        if (systemDarkMode) {
            enableDarkMode(); // Apply system dark mode if enabled
        } else {
            disableDarkMode(); // Disable dark mode if system preference is light
        }
    } else {

      // On desktop, allow users to toggle dark mode and respect their stored preference
      if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
        darkModeToggle.checked = true;
    } else if (localStorage.getItem('darkMode') === 'disabled') {
        disableDarkMode();
        darkModeToggle.checked = false;
    } else if (systemDarkMode) {
        enableDarkMode();
        darkModeToggle.checked = true;
    }

    // Event listener for the dark mode toggle switch on desktop
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        });
    }
}

    // Initially hide the sidebar on mobile by ensuring it doesn't have the 'visible' class
    sidebar.classList.remove('visible');

    // Toggle sidebar visibility on mobile when clicking the wrapper
    toggleSidebarWrapper.addEventListener('click', function() {
        sidebar.classList.toggle('visible'); // Toggle the 'visible' class
    });

    // Helper function to load data from cache
    function loadFromCache() {
        if (cachedTwitchData) {
            const liveUsernames = cachedTwitchData.map(stream => stream.user_login.toLowerCase());
            updateTwitchElements(liveUsernames, cachedTwitchData);
        }
        
        if (Object.keys(cachedManualStatus).length > 0) {
            updateManualElements(cachedManualStatus);
        }
    }

    // Create streamer elements for the live container (use `liveImage` only for custom users, Twitch API live screenshot for Twitch users)
    function createStreamerElement(username, channelName, image, url) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online', 'fade-in');
        div.id = username;

        const img = document.createElement('img');
        img.src = image || 'assets/emoji.png';  // Use liveImage for custom users, Twitch API screenshot for Twitch users
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

    // Update Twitch elements in the live container (use Twitch API thumbnail as live image)
    function updateTwitchElements(liveUsernames, streamsData) {
        twitchUsers.forEach(user => {
            const isLive = liveUsernames.includes(user.username.toLowerCase());
            let existingElement = document.getElementById(user.username);
    
            let streamData = streamsData.find(s => s.user_login.toLowerCase() === user.username.toLowerCase());
            let twitchLiveImage = streamData ? streamData.thumbnail_url.replace('{width}', '320').replace('{height}', '180') : 'assets/emoji.png'; // Twitch live image
    
            let url = `https://www.twitch.tv/${user.username}`;
    
            if (isLive) {
                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, twitchLiveImage, url);
                    liveContainer.appendChild(newElement);
                } else {
                    existingElement.querySelector('img').src = twitchLiveImage;
                    existingElement.querySelector('span').innerText = user.channelName;
                    existingElement.classList.remove('fade-out');
                    existingElement.classList.add('fade-in');
                }
            } else if (existingElement) {
                existingElement.classList.add('fade-out');
                setTimeout(() => {
                    if (existingElement.parentNode) {
                        liveContainer.removeChild(existingElement);
                    }
                }, 500); // Fade out and remove
            }
        });
    
        updateSidebar();
    }

    // Update custom user elements in the live container (use `liveImage` for custom users)
    function updateManualElements(manualStatuses) {
        cachedManualStatus = { ...manualStatuses };

        customUsers.forEach(user => {
            const isManualOn = manualStatuses[user.username] === 'on';
            let existingElement = document.getElementById(user.username);
            if (isManualOn) {
                if (!existingElement) {
                    const newElement = createStreamerElement(user.username, user.channelName, user.liveImage, user.url);
                    liveContainer.appendChild(newElement);
                } else {
                    existingElement.classList.remove('fade-out');
                    existingElement.classList.add('fade-in');
                }
            } else if (existingElement) {
                existingElement.classList.add('fade-out');
                setTimeout(() => {
                    if (existingElement.parentNode) {
                        liveContainer.removeChild(existingElement);
                    }
                }, 500); // Wait for fade-out animation to complete
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

    // Poll the server every 2 minutes for updates and refresh liveContainer elements
    function pollForUpdates() {
        fetch('/updates')
            .then(response => response.json())
            .then(data => {
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

    // Poll for updates every 2 minutes and update live streamer elements dynamically
    setInterval(pollForUpdates, 120000); // Poll every 2 minutes

    // Load from cache if available and valid, otherwise poll for updates
    if (isCacheValid) {
        loadFromCache();
    } else {
        pollForUpdates();
    }

    updateSidebar(); // Update sidebar immediately

    // Refresh user pages based on their specific switches
    function refreshUserPages() {
        const userPages = {
            'user1Page': 'Ralf Paldermaa',
            'user2Page': 'Mariliis Kaer',
            'user3Page': 'Kaspar Wang',
            'user4Page': 'Marmormaze',
            'user5Page': 'Sebfreiberg',
            'user6Page': 'Artjom',
            'user7Page': 'Säm',
            'user8Page': 'Sidni',
            'user9Page': 'Estmagicz',
            'user10Page': 'Kozip Maia',
            'user11Page': 'Kozip Mihkel',
            'user12Page': 'TormTuleb',
            'user13Page': 'Gerhard Trolla',
            'user14Page': 'Krispoiss'
        };

        Object.keys(userPages).forEach(page => {
            const user = userPages[page];
            let switchElement = document.getElementById(`${user}-switch`);

            if (!switchElement) {
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
});