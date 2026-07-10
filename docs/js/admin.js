import { setConfigOverrides, clearConfigOverrides } from './config.js';

const PASS = 'admin';

const loginEl = document.getElementById('login');
const panelEl = document.getElementById('panel');
const passInput = document.getElementById('admin-pass');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const configArea = document.getElementById('config-json');
const menuArea = document.getElementById('menu-json');
const applyBtn = document.getElementById('apply-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');

function showPanel() {
  loginEl.style.display = 'none';
  panelEl.style.display = 'block';
  loadFiles();
}

function hidePanel() {
  loginEl.style.display = 'block';
  panelEl.style.display = 'none';
}

loginBtn.addEventListener('click', () => {
  if (passInput.value === PASS) {
    showPanel();
  } else {
    alert('Niepoprawne hasło');
  }
});

logoutBtn.addEventListener('click', () => {
  hidePanel();
  passInput.value = '';
});

async function loadFiles() {
  try {
    const [cfgRes, menuRes] = await Promise.all([
      fetch('data/config.json', { cache: 'no-store' }),
      fetch('data/menu.json', { cache: 'no-store' })
    ]);

    const cfg = cfgRes.ok ? await cfgRes.json() : {};
    const menu = menuRes.ok ? await menuRes.json() : {};

    configArea.value = JSON.stringify(cfg, null, 2);
    menuArea.value = JSON.stringify(menu, null, 2);
  } catch (err) {
    console.error(err);
    configArea.value = '{}';
    menuArea.value = '{}';
  }
}

applyBtn.addEventListener('click', () => {
  try {
    const site = JSON.parse(configArea.value);
    const menu = JSON.parse(menuArea.value);
    const ok = setConfigOverrides({ site, menu });
    if (ok) alert('Zastosowano zmiany lokalnie. Odśwież stronę aby zobaczyć zmiany.');
    else alert('Błąd zapisu.');
  } catch (err) {
    alert('Błąd w JSON: ' + err.message);
  }
});

downloadBtn.addEventListener('click', () => {
  const cfgBlob = new Blob([configArea.value], { type: 'application/json' });
  const menuBlob = new Blob([menuArea.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(cfgBlob);
  a.download = 'config.json';
  a.click();
  URL.revokeObjectURL(a.href);

  const b = document.createElement('a');
  b.href = URL.createObjectURL(menuBlob);
  b.download = 'menu.json';
  b.click();
  URL.revokeObjectURL(b.href);
});

clearBtn.addEventListener('click', () => {
  if (confirm('Usunąć lokalne nadpisania i przywrócić pliki z repo?')) {
    clearConfigOverrides();
    alert('Lokalne nadpisania usunięte. Odśwież stronę.');
    loadFiles();
  }
});

// Auto-show if already logged in (sessionStorage)
if (sessionStorage.getItem('admin_logged') === '1') {
  showPanel();
}

// remember login for session
loginBtn.addEventListener('click', () => {
  if (passInput.value === PASS) sessionStorage.setItem('admin_logged', '1');
});
