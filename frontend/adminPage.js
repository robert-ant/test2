// frontend/adminPage.js
// Drives the admin page table

async function sendUpdate(user, state) {
    try {
      const res = await fetch('/update-user-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user, state, isAdmin: true })
      });
      if (!res.ok) {
        console.error('Update failed for', user, state, res.status);
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  }
  
  async function refresh() {
    try {
      const res = await fetch('/updates', { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
  
      const statuses = data.manual || {};
      document.querySelectorAll('#user-table tbody tr').forEach(tr => {
        const user = tr.dataset.user;
        const state = statuses[user] || 'offline';
        const statusEl = tr.querySelector('.status');
        statusEl.textContent = state;
        statusEl.className = 'status ' + (state === 'on' ? 'online' : 'offline');
      });
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }
  
  function attachEvents() {
    document.querySelectorAll('.force').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = btn.closest('tr').dataset.user;
        const state = btn.dataset.state;
        sendUpdate(user, state).then(refresh);
      });
    });
  }
  
  attachEvents();
  refresh();
  setInterval(refresh, 5000);
  