document.addEventListener("DOMContentLoaded", function() {
    const liveContainer = document.getElementById('live-container');
    const sidebarContainer = document.getElementById('user-list');
    const sidebar = document.querySelector('.sidebar');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logo = document.getElementById('logo');
    const toggleImage = document.getElementById('toggleImage');
    const toggleSidebarWrapper = document.getElementById('toggleSidebarWrapper');
    const unfoldImage = document.getElementById('unfold');

    const darkModeLogo = 'assets/LOGOversionNIGHT.png';
    const lightModeLogo = 'assets/LOGOversionBASIC.png';
    const lightModeImage = 'assets/son.png';
    const darkModeImage = 'assets/muun.png';
    const lightModeUnfold = 'assets/unfold.png';
    const darkModeUnfold = 'assets/unfolddark.png';

    const customLogos = {
        "SidneyEweka": "assets/kp.jpg",
        "fl0m": "assets/kp.jpg",
        "ohnePixel": "assets/kp.jpg",
        "Ranger": "assets/kp.jpg",
        "jasontheween": "assets/kp.jpg",
        "BLASTPremier": "assets/kp.jpg",
        "trausi": "assets/kp.jpg",
        "Fibii": "assets/kp.jpg",
        "PRXf0rsakeN": "assets/kp.jpg",
        "Dashy": "assets/kp.jpg",
        "s0mcs": "assets/kp.jpg",
        "d0cc_tv": "assets/kp.jpg",
        "Smacko": "assets/kp.jpg",
        "user1": "assets/kp.jpg",
        "user2": "assets/kp.jpg",
        "user3": "assets/kp.jpg",
        "user4": "assets/kp.jpg",
        "user5": "assets/kp.jpg",
        "user6": "assets/kp.jpg",
        "user7": "assets/kp.jpg",
        "user8": "assets/kp.jpg",
        "user9": "assets/kp.jpg",
        "user10": "assets/kp.jpg",
        "user11": "assets/kp.jpg",
        "user12": "assets/kp.jpg"
    };

    const twitchUsers = [
        { username: "SidneyEweka", channelName: "SidneyEweka" },
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
        { username: "user1", channelName: "user1", url: "https://www.tiktok.com/@eviltheevilresidentevil/live", thumbnail: "assets/emoji.png" },
        { username: "user2", channelName: "User2", url: "customPage2.html", thumbnail: "assets/emoji.png" },
        { username: "user3", channelName: "User3", url: "customPage3.html", thumbnail: "assets/emoji.png" },
        { username: "user4", channelName: "User4", url: "customPage4.html", thumbnail: "assets/emoji.png" },
        { username: "user5", channelName: "User5", url: "customPage5.html", thumbnail: "assets/emoji.png" },
        { username: "user6", channelName: "User6", url: "customPage6.html", thumbnail: "assets/emoji.png" },
        { username: "user7", channelName: "User7", url: "customPage7.html", thumbnail: "assets/emoji.png" },
        { username: "user8", channelName: "User8", url: "customPage8.html", thumbnail: "assets/emoji.png" },
        { username: "user9", channelName: "User9", url: "customPage9.html", thumbnail: "assets/emoji.png" },
        { username: "user10", channelName: "User10", url: "customPage10.html", thumbnail: "assets/emoji.png" },
        { username: "user11", channelName: "User11", url: "customPage11.html", thumbnail: "assets/emoji.png" },
        { username: "user12", channelName: "User12", url: "customPage12.html", thumbnail: "assets/emoji.png" }
    ];

    const allUsers = [...twitchUsers, ...customUsers];

    function applyDarkMode() {
        document.body.classList.add('dark-mode');
        logo.src = darkModeLogo;
        toggleImage.src = darkModeImage;
        unfoldImage.src = darkModeUnfold;
        document.body.style.backgroundImage = "url('assets/2024-07-14_18.17.57.jpg')";
    }

    function applyLightMode() {
        document.body.classList.remove('dark-mode');
        logo.src = lightModeLogo;
        toggleImage.src = lightModeImage;
        unfoldImage.src = lightModeUnfold;
        document.body.style.backgroundImage = "url('assets/2024-07-14_18.17.44.jpg')";
    }

    function initializeDarkMode() {
        if (window.matchMedia("(max-width: 768px)").matches) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyDarkMode();
            } else {
                applyLightMode();
            }

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                if (event.matches) {
                    applyDarkMode();
                } else {
                    applyLightMode();
                }
            });

            if (darkModeToggle) {
                darkModeToggle.parentElement.style.display = 'none';
            }
        } else {
            if (localStorage.getItem('darkMode') === 'enabled') {
                applyDarkMode();
                darkModeToggle.checked = true;
            } else {
                applyLightMode();
                darkModeToggle.checked = false;
            }

            darkModeToggle.addEventListener('change', () => {
                if (darkModeToggle.checked) {
                    localStorage.setItem('darkMode', 'enabled');
                    applyDarkMode();
                } else {
                    localStorage.setItem('darkMode', 'disabled');
                    applyLightMode();
                }
            });
        }
    }

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

    function createSidebarUserElement(username, channelName, url) {
        const li = document.createElement('li');
        li.id = `${username}-sidebar`;

        const img = document.createElement('img');
        img.src = customLogos[username] || 'assets/default_logo.png';
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

    function updateStreamerElements(users, liveUsernames, streamsData) {
        users.forEach(user => {
            const isLive = liveUsernames.includes(user.username.toLowerCase());
            const existingElement = document.getElementById(user.username);

            if (isLive) {
                const stream = streamsData.find(s => s.user_login.toLowerCase() === user.username.toLowerCase());
                const thumbnail = stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180');
                const url = `https://www.twitch.tv/${user.username}`;

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
                setTimeout(() => {
                    liveContainer.removeChild(existingElement);
                }, 500);
            }
        });
    }

    function updateStreamers() {
        if (!liveContainer || !sidebarContainer) {
            console.error('Containers not found.');
            return;
        }

        sidebarContainer.innerHTML = '';

        allUsers.forEach(user => {
            const url = twitchUsers.find(tu => tu.username === user.username) ? `https://www.twitch.tv/${user.username}` : user.url;
            const userLi = createSidebarUserElement(user.username, user.channelName, url);
            sidebarContainer.appendChild(userLi);
        });

        fetch('/twitch/live')
            .then(response => response.json())
            .then(data => {
                console.log('Twitch data:', data);
                const liveUsernames = data.data ? data.data.map(stream => stream.user_login.toLowerCase()) : [];
                updateStreamerElements(twitchUsers, liveUsernames, data.data);
            })
            .catch(error => {
                console.error('Error fetching Twitch data:', error);
            });

        fetch('/user-status')
            .then(response => response.json())
            .then(userStatuses => {
                const liveUsernames = Object.keys(userStatuses).filter(username => userStatuses[username] === 'on');
                updateStreamerElements(customUsers, liveUsernames, []);
            })
            .catch(error => {
                console.error('Error fetching user statuses:', error);
            });
    }

    initializeDarkMode();
    updateStreamers();
    setInterval(updateStreamers, 120000);

    if (window.matchMedia("(max-width: 768px)").matches) {
        toggleSidebarWrapper.addEventListener('click', () => {
            sidebar.classList.toggle('visible');
        });
    }
});
