// display name -> userId
const NAME_TO_ID = {
  'Ralf Paldermaa': 'user1',
  'Mariliis Kaer': 'user2',
  'Kaspar Wang': 'user3',
  'Sebfreiberg': 'user5',
  'Artjom': 'user6',
  'Säm': 'user7',
  'Sidni': 'user8',
  'Estmagicz': 'user9',
  'Kozip Maia': 'user10',
  'Kozip Mihkel': 'user11',
  'TormTuleb': 'user12',
  'Gerhard Trolla': 'user13',
  'Krispoiss': 'user14',
  'Selgrootu': 'user15',
};

function setRowState(row, state) {
  const pill = row.querySelector('.status-pill');
  row.classList.toggle('is-online', state === 'on');
  row.classList.toggle('is-offline', state === 'off');
  if (pill) pill.textContent = state === 'on' ? 'Online' : 'Offline';
}

function normalizeManual(manual) {
  const out = {};
  for (const [k, v] of Object.entries(manual || {})) {
    // map userId -> display name when needed
    const display = Object.keys(NAME_TO_ID).find(n => NAME_TO_ID[n] === k) || k;
    out[display] = v;
  }
  return out;
}

async function refresh() {
  try {
    const res = await fetch('/updates', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const manual = normalizeManual(data.manual || {});

    document.querySelectorAll('.row[data-name]').forEach(row => {
      const name = row.dataset.name;
      const state = manual[name] === 'on' ? 'on' : 'off';
      setRowState(row, state);
    });
  } catch (e) {
    console.warn('Admin refresh failed:', e.message);
  }
}

async function send(displayName, state) {
  const user = NAME_TO_ID[displayName] || displayName; // server accepts both
  const body = { user, state, isAdmin: true };
  const row = document.querySelector(`.row[data-name="${displayName}"]`);
  try {
    const res = await fetch('/update-user-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Update failed for ${displayName} on ${res.status}`);
      return;
    }
    if (row) setRowState(row, state); // optimistic
    refresh();                        // confirm
  } catch (e) {
    console.error('Network error:', e);
  }
}

document.addEventListener('click', (e) => {
  const row = e.target.closest('.row[data-name]');
  if (!row) return;
  const name = row.dataset.name;
  if (e.target.closest('.btn-on'))  send(name, 'on');
  if (e.target.closest('.btn-off')) send(name, 'off');
});

refresh();
setInterval(refresh, 5000);
