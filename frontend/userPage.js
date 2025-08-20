// Shared logic for userX pages; set window.USER_ID in each HTML before this script.

(function () {
  const statusPill = document.getElementById('status-pill');
  const btnOn      = document.getElementById('btn-on');
  const btnOff     = document.getElementById('btn-off');
  const logEl      = document.getElementById('log');

  const USER = window.USER_ID || '';

  function log(line) {
    if (!logEl) return;
    const t = new Date().toLocaleTimeString();
    logEl.textContent = `[${t}] ${line}\n` + logEl.textContent;
  }

  function paint(state) {
    if (!statusPill) return;
    const on = state === 'on';
    statusPill.textContent = on ? 'Online' : 'Offline';
    statusPill.classList.toggle('is-online', on);
    statusPill.classList.toggle('is-offline', !on);
  }

  async function send(state) {
    try {
      const res = await fetch('/update-user-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user: USER, state, isAdmin: false })
      });
      if (!res.ok) {
        const msg = await res.text().catch(()=> '');
        log(`❌ Failed to update: ${res.status} ${msg}`);
        return false;
      }
      localStorage.setItem(`${USER}-switch-state`, state);
      log(`✔ Set ${USER} -> ${state}`);
      return true;
    } catch (e) {
      log(`❌ Network error: ${e.message}`);
      return false;
    }
  }

  function init() {
    if (!USER) {
      log('❌ USER_ID missing on this page.');
      return;
    }

    // Load cached state immediately
    const saved = localStorage.getItem(`${USER}-switch-state`);
    paint(saved === 'on' ? 'on' : 'off');

    // Wire buttons
    btnOn?.addEventListener('click', async () => {
      if (await send('on')) paint('on');
    });
    btnOff?.addEventListener('click', async () => {
      if (await send('off')) paint('off');
    });

    // Poll for admin/user changes
    async function refresh() {
      try {
        const res = await fetch('/updates', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const manual = data?.manual || {};
        const adminState = manual[USER]; // server stores by userId when we send userId
        if (adminState) {
          paint(adminState);
          localStorage.setItem(`${USER}-switch-state`, adminState);
          log(`ℹ Admin set ${USER} -> ${adminState}`);
        }
      } catch (e) {
        log(`Refresh error: ${e.message}`);
      }
    }

    refresh();
    setInterval(refresh, 5000);
  }

  init();
})();
