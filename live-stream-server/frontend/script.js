document.addEventListener("DOMContentLoaded", function() {
    const twitchUsers = {
        "krispoissyuh": "assets/krispoissyuh-icon.png",
        "rommy1337": "assets/rommy1337-icon.png",
        "raido_ttv": "assets/raido_ttv-icon.png",
        "ohnePixel": "assets/ohnePixel-icon.png",
        "KuruHS": "assets/ohnePixel-icon.png"
    };
    const youtubeUsers = {
        "UCx27Pkk8plpiosF14qXq-VA": "assets/youtube-icon.png",
        "UCSJ4gkVC6NrvII8umztf0Ow": "assets/youtube-icon.png"
    };

    const userList = document.getElementById('user-list');
    const liveSection = document.getElementById('live-section');
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

    // Function to create and append user items
    const appendUserItem = (username, link, icon) => {
        const userItem = document.createElement('li');
        const userLink = document.createElement('a');
        userLink.href = link;
        userLink.innerHTML = `<img src="${icon}" alt="Icon"> ${username}`;
        userItem.appendChild(userLink);
        userList.appendChild(userItem);
    };

    // Add Twitch users to the sidebar
    Object.keys(twitchUsers).forEach(username => {
        appendUserItem(username, `https://twitch.tv/${username}`, twitchUsers[username]);
    });

    // Add YouTube users to the sidebar
    Object.keys(youtubeUsers).forEach(channelId => {
        appendUserItem(`YouTube Channel`, `https://youtube.com/channel/${channelId}`, youtubeUsers[channelId]);
    });

    // Fetch live stream data from the server for Twitch
    fetch('/twitch/live')
        .then(response => response.json())
        .then(data => {
            const liveUsers = new Set(data.data.map(stream => stream.user_name.toLowerCase()));
            Object.keys(twitchUsers).forEach(username => {
                if (liveUsers.has(username.toLowerCase())) {
                    const userDiv = document.createElement('div');
                    userDiv.innerHTML = `
                        <a href="https://twitch.tv/${username}">
                            <img src="https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-440x248.jpg" alt="${username} thumbnail">
                            <p>${username}</p>
                        </a>`;
                    liveSection.appendChild(userDiv);
                }
            });
            if (!liveSection.querySelector('div')) {
                liveSection.innerHTML += "<p>No one is live right now</p>";
            }
        })
        .catch(error => console.error('Error fetching Twitch data:', error));

    // Fetch live stream data from the server for YouTube
    Object.keys(youtubeUsers).forEach(channelId => {
        fetch(`/youtube/live/${channelId}`)
            .then(response => response.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    const username = data.items[0].snippet.channelTitle;
                    const videoId = data.items[0].id.videoId;
                    const userDiv = document.createElement('div');
                    userDiv.innerHTML = `
                        <a href="https://youtube.com/channel/${channelId}">
                            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${username} thumbnail">
                            <p>${username}</p>
                        </a>`;
                    liveSection.appendChild(userDiv);
                }
            })
            .catch(error => console.error('Error fetching YouTube channel data:', error));
    });
});
