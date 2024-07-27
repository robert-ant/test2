document.addEventListener("DOMContentLoaded", function() {
    const twitchClientId = 'pl2hu83toh8d6havf73susul1lqdri';
    const twitchOAuthToken = 'ws30nb814vja12aufnvecscxs4pgt4';
    const youtubeApiKey = 'AIzaSyDna8MsiQrvWZ0GY2b2ZKIDKIRbk6UvRRw';
    const twitchUsers = {
        "krispoissyuh": "assets/krispoissyuh-icon.png",
        "rommy1337": "assets/rommy1337-icon.png",
        "raido_ttv": "assets/raido_ttv-icon.png",
        "ohnePixel": "assets/ohnePixel-icon.png",
        "KuruHS": "assets/ohnePixel-icon.png"
    };
    const youtubeUsers = {
        "UCx27Pkk8plpiosF14qXq-VA": "assets/youtube-icon.png"
    };
    const tiktokUsers = {
        "wasu_59q": "assets/tiktok-icon.png",
        "anotheruser": "assets/tiktok-icon.png"
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

    // Add YouTube users to the sidebar and check if they are live
    Object.keys(youtubeUsers).forEach(channelId => {
        fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${youtubeApiKey}`)
            .then(response => response.json())
            .then(data => {
                const username = data.items[0].snippet.title;
                appendUserItem(username, `https://youtube.com/channel/${channelId}`, youtubeUsers[channelId]);
                checkIfLiveOnYouTube(channelId, username);
            })
            .catch(error => console.error('Error fetching YouTube channel data:', error));
            if (!liveSection.querySelector('div')) {
                liveSection.innerHTML += "";
            }
    });

    // Fetch Twitch streams and update live section
    fetch(`https://api.twitch.tv/helix/streams?${Object.keys(twitchUsers).map(user => `user_login=${user}`).join('&')}`, {
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${twitchOAuthToken}`
        }
    })
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
                liveSection.innerHTML += "";
            }
        })
        .catch(error => console.error('Error fetching Twitch data:', error));

    // Check if YouTube users are live
    const checkIfLiveOnYouTube = (channelId, username) => {
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&key=${youtubeApiKey}&channelId=${channelId}`)
            .then(response => response.json())
            .then(data => {
                const liveChannels = data.items.map(item => item.snippet.channelId);
                if (liveChannels.includes(channelId)) {
                    const videoId = data.items.find(item => item.snippet.channelId === channelId).id.videoId;
                    const userDiv = document.createElement('div');
                    userDiv.innerHTML = `
                        <a href="https://youtube.com/channel/${channelId}">
                            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${username} thumbnail">
                            <p>${username}</p>
                        </a>`;
                    liveSection.appendChild(userDiv);
                }
                if (!liveSection.querySelector('div')) {
                    liveSection.innerHTML += "<p>Kedagi pole praegu lives</p>";
                }
            })
            .catch(error => console.error('Error fetching YouTube live status:', error));
    };

    // Add TikTok users to the sidebar and check if they are live
    Object.keys(tiktokUsers).forEach(username => {
        const url = `https://www.tiktok.com/@${username}/live`;
        appendUserItem(username, url, tiktokUsers[username]);
        fetch(`/tiktok-status-check?url=${encodeURIComponent(url)}`)
            .then(response => response.json())
            .then(data => {
                if (data.is_live) {
                    const userDiv = document.createElement('div');
                    userDiv.innerHTML = `
                        <a href="${url}">
                            <img src="https://www.tiktok.com/@${username}/live-thumbnail.jpg" alt="${username} thumbnail">
                            <p>${username}</p>
                        </a>`;
                    liveSection.appendChild(userDiv);
                }
            })
            .catch(error => console.error('Error fetching TikTok live status:', error));
    });
});
