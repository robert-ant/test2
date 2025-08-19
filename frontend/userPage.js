// frontend/userPage.js
// Shared logic for ALL user pages (user1Page.html, user2Page.html, …)
// Uses your existing endpoints: POST /update-user-status and GET /updates

(function () {
    const meta = document.querySelector('meta[name="user-name"]');
    const user = (meta && meta.content) ? meta.content.trim() : '';
    if (!user) {
      console.error('userPage.js: Missing <meta name="user-name" content="...">');
      return;
    }
  
    const switchEl = document.getElementById('presence-switch');
    const logEl = document.getElementById('log'); // optional <pre id="log"></pre>
  
    function log(line) {
      if (!logEl) return;
      const t = new Date().toLocaleTimeString();
      logEl.textContent = `[${t}] ${line}\n` + logEl.textContent;
    }
  
    // Load cached state into the UI (so it feels snappy on reload)
    const saved = localStorage.getItem(`${user}-switch-state`);
    if (saved) {
      switchEl.checked = saved === 'on';
    }
  
    // Send change to the backend (manual, not admin)
    async function send(state) {
      try {
        const res = await fetch('/update-user-status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ user, state, isAdmin: false })
        });
        if (!res.ok) {
          const msg = await res.text().catch(()=>'');
          log(`❌ Failed to update: ${res.status} ${msg}`);
          return;
        }
        localStorage.setItem(`${user}-switch-state`, state);
        log(`✔ Set ${user} -> ${state}`);
      } catch (e) {
        log(`❌ Network error: ${e.message}`);
      }
    }
  
    // When the user flips the switch
    switchEl.addEventListener('change', () => {
      const state = switchEl.checked ? 'on' : 'off';
      send(state);
    });
  
    // Poll /updates for admin overrides and other changes
    // Your server merges userStatuses + adminOverrides → data.manual
    async function refresh() {
      try {
        const res = await fetch('/updates', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
  
        const manual = data?.manual || {};
        const adminState = manual[user]; // 'on' | 'off' | undefined
  
        if (adminState) {
          const shouldBeChecked = adminState === 'on';
          if (switchEl.checked !== shouldBeChecked) {
            // Reflect admin override in UI and cache
            switchEl.checked = shouldBeChecked;
            localStorage.setItem(`${user}-switch-state`, adminState);
            log(`ℹ Admin override: ${user} -> ${adminState}`);
          }
        }
      } catch (e) {
        log(`Refresh error: ${e.message}`);
      }
    }
  
    // Initial refresh and periodic polling
    refresh();
    // Keep this reasonably quick so multiple admins / user tabs stay in sync
    setInterval(refresh, 5000);
  })();
  