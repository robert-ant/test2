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
        { username: "user1", channelName: "Krispoiss", url: "https://www.tiktok.com/@krispoiss/live", thumbnail: "assets/emoji.png" },
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
    function createStreamerElement(username, channelName, thumbnail, url) {
        const div = document.createElement('div');
        div.classList.add('streamer', 'online');
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

    // Function to create sidebar user element
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
            const url = twitchUsers.find(tu => tu.username === user.username) ? `https://www.twitch.tv/${user.username}` : user.url;
            const userLi = createSidebarUserElement(user.username, user.channelName, url);
            sidebarContainer.appendChild(userLi);
        });

        // Apply fade-out class to existing live container
        Array.from(liveContainer.children).forEach(child => {
            child.classList.add('fade-out');
        });

        // Fetch Twitch live streams
        fetch('/twitch/live')
            .then(response => response.json())
            .then(data => {
                console.log('Twitch data:', data);

                // Track live users
                const liveUsernames = data.data ? data.data.map(stream => stream.user_login.toLowerCase()) : [];

                // Update the live container for Twitch users
                twitchUsers.forEach(user => {
                    const sidebarElement = document.getElementById(`${user.username}-sidebar`);

                    if (liveUsernames.includes(user.username.toLowerCase())) {
                        const stream = data.data.find(s => s.user_login.toLowerCase() === user.username.toLowerCase());
                        const thumbnail = stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180');
                        const url = `https://www.twitch.tv/${user.username}`;

                        // Create new element for live container
                        const streamerDiv = createStreamerElement(user.username, user.channelName, thumbnail, url);
                        streamerDiv.classList.add('fade-in');
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
            // Fetch and display user status for custom users
fetch('/user-status')
.then(response => response.json())
.then(userStatuses => {
    customUsers.forEach(user => {
        if (userStatuses[user.username] === 'on') {
            const url = user.url;
            const thumbnail = user.thumbnail;

            // Create new element for live container
            const streamerDiv = createStreamerElement(user.username, user.channelName, thumbnail, url);
            streamerDiv.classList.add('fade-in');
            liveContainer.appendChild(streamerDiv);

            // Highlight live users in the sidebar
            const sidebarElement = document.getElementById(`${user.username}-sidebar`);
            if (sidebarElement) {
                sidebarElement.classList.add('online');
            }
        }
    });

    // Remove fade-out elements after animation
    setTimeout(() => {
        Array.from(liveContainer.children).forEach(child => {
            if (child.classList.contains('fade-out')) {
                liveContainer.removeChild(child);
            }
        });
    }, 500); // Adjust the timeout to match the fade-out animation duration
})
.catch(error => {
    console.error('Error fetching user statuses:', error);
});
}

// Initial load
updateStreamers();

// Set interval to update streamers every minute
setInterval(updateStreamers, 120000); // 60000ms = 1 minute
});
