// Dashboard de monitoreo de redes sociales — /panel
// Cloudflare Pages Function

const COOKIE_NAME = 'panel_auth';
const COOKIE_VALUE = 'sss_panel_2026';
const PASSWORD = '0912';

function isAuthenticated(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`);
}

export async function onRequestGet(context) {
  if (!isAuthenticated(context.request)) {
    return new Response(loginHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return new Response(dashboardHTML(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  const formData = await context.request.formData();
  const password = formData.get('password');

  if (password === PASSWORD) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/panel',
        'Set-Cookie': `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      },
    });
  }

  return new Response(loginHTML('Password incorrecto'), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function loginHTML(error = '') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel — Salsa Soul Studio</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0a0a; color: #e0e0e0;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
  }
  .login-box {
    background: #1a1a1a; border: 1px solid #333; border-radius: 12px;
    padding: 40px; width: 340px; text-align: center;
  }
  .login-box h1 { color: #c9a84c; font-size: 1.4rem; margin-bottom: 8px; }
  .login-box p { color: #888; font-size: 0.85rem; margin-bottom: 24px; }
  .login-box input {
    width: 100%; padding: 12px 16px; background: #111; border: 1px solid #333;
    border-radius: 8px; color: #fff; font-size: 1rem; text-align: center;
    letter-spacing: 8px; margin-bottom: 16px;
  }
  .login-box input:focus { outline: none; border-color: #c9a84c; }
  .login-box button {
    width: 100%; padding: 12px; background: #c9a84c; color: #0a0a0a;
    border: none; border-radius: 8px; font-size: 1rem; font-weight: 600;
    cursor: pointer;
  }
  .login-box button:hover { background: #d4b45c; }
  .error { color: #e74c3c; font-size: 0.85rem; margin-bottom: 12px; }
</style>
</head>
<body>
<form class="login-box" method="POST" action="/panel">
  <h1>Salsa Soul Studio</h1>
  <p>Panel de Redes Sociales</p>
  ${error ? `<div class="error">${error}</div>` : ''}
  <input type="password" name="password" placeholder="PIN" maxlength="4" autofocus>
  <button type="submit">Entrar</button>
</form>
</body>
</html>`;
}

function dashboardHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel Redes — Salsa Soul Studio</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0a0a; color: #e0e0e0; line-height: 1.5;
  }

  /* Header */
  .header {
    background: #111; border-bottom: 1px solid #222;
    padding: 16px 24px; display: flex; align-items: center;
    justify-content: space-between;
  }
  .header h1 { color: #c9a84c; font-size: 1.2rem; }
  .header .meta { color: #666; font-size: 0.8rem; }
  .header .logout {
    color: #888; text-decoration: none; font-size: 0.8rem;
    border: 1px solid #333; padding: 4px 12px; border-radius: 6px;
  }
  .header .logout:hover { border-color: #c9a84c; color: #c9a84c; }

  /* Container */
  .container { max-width: 1200px; margin: 0 auto; padding: 24px; }

  /* Métricas */
  .metrics {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    margin-bottom: 32px;
  }
  .metric-card {
    background: #1a1a1a; border: 1px solid #222; border-radius: 10px;
    padding: 20px; text-align: center;
  }
  .metric-card .value {
    font-size: 2rem; font-weight: 700; color: #fff;
    margin-bottom: 4px;
  }
  .metric-card .label { color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
  .metric-card.inbox .value { color: #3498db; }
  .metric-card.prod .value { color: #f39c12; }
  .metric-card.prog .value { color: #9b59b6; }
  .metric-card.pub .value { color: #2ecc71; }

  /* Marcas */
  .section-title {
    color: #c9a84c; font-size: 1rem; font-weight: 600;
    margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;
  }
  .brands {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px; margin-bottom: 32px;
  }
  .brand-card {
    background: #1a1a1a; border: 1px solid #222; border-radius: 10px;
    padding: 20px;
  }
  .brand-card h3 { font-size: 0.95rem; margin-bottom: 12px; color: #fff; }
  .brand-bars { display: flex; flex-direction: column; gap: 6px; }
  .brand-bar {
    display: flex; align-items: center; gap: 8px;
  }
  .brand-bar .bar-label {
    font-size: 0.7rem; color: #888; width: 70px; text-align: right;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .brand-bar .bar-track {
    flex: 1; height: 8px; background: #222; border-radius: 4px; overflow: hidden;
  }
  .brand-bar .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
  .brand-bar .bar-count { font-size: 0.75rem; color: #aaa; width: 24px; }
  .bar-inbox { background: #3498db; }
  .bar-prod { background: #f39c12; }
  .bar-prog { background: #9b59b6; }
  .bar-pub { background: #2ecc71; }
  .bar-err { background: #e74c3c; }

  /* Posts recientes */
  .filters {
    display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
  }
  .filter-btn {
    padding: 6px 16px; background: #1a1a1a; border: 1px solid #333;
    border-radius: 20px; color: #aaa; font-size: 0.8rem; cursor: pointer;
  }
  .filter-btn:hover { border-color: #c9a84c; color: #c9a84c; }
  .filter-btn.active { background: #c9a84c; color: #0a0a0a; border-color: #c9a84c; }

  .posts-list { display: flex; flex-direction: column; gap: 8px; }
  .post-row {
    background: #1a1a1a; border: 1px solid #222; border-radius: 8px;
    padding: 14px 20px; display: flex; align-items: center; gap: 16px;
  }
  .post-status {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }
  .post-status.inbox { background: #3498db; }
  .post-status.prod { background: #f39c12; }
  .post-status.prog { background: #9b59b6; }
  .post-status.pub { background: #2ecc71; }
  .post-status.err { background: #e74c3c; }
  .post-info { flex: 1; min-width: 0; }
  .post-name {
    font-size: 0.9rem; color: #fff; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .post-meta { font-size: 0.75rem; color: #666; margin-top: 2px; }
  .post-brand {
    font-size: 0.7rem; color: #c9a84c; background: #1f1a0e;
    padding: 2px 8px; border-radius: 4px; white-space: nowrap;
  }
  .post-networks { display: flex; gap: 4px; }
  .post-network {
    font-size: 0.65rem; color: #888; background: #222;
    padding: 2px 6px; border-radius: 3px;
  }
  .post-date { font-size: 0.75rem; color: #666; white-space: nowrap; }

  /* Loading / Error */
  .loading {
    text-align: center; padding: 60px; color: #666;
  }
  .loading .spinner {
    width: 32px; height: 32px; border: 3px solid #222;
    border-top-color: #c9a84c; border-radius: 50%;
    animation: spin 0.8s linear infinite; margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-msg {
    background: #1a0a0a; border: 1px solid #3a1a1a; border-radius: 8px;
    padding: 16px; color: #e74c3c; text-align: center;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .metrics { grid-template-columns: repeat(2, 1fr); }
    .brands { grid-template-columns: 1fr; }
    .post-row { flex-wrap: wrap; gap: 8px; }
  }
  @media (max-width: 480px) {
    .container { padding: 16px; }
    .header { padding: 12px 16px; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Panel de Redes Sociales</h1>
    <span class="meta" id="lastUpdate"></span>
  </div>
  <a href="/panel/logout" class="logout">Salir</a>
</div>

<div class="container">
  <!-- Métricas -->
  <div class="metrics" id="metrics">
    <div class="metric-card inbox"><div class="value" id="m-inbox">—</div><div class="label">Inbox</div></div>
    <div class="metric-card prod"><div class="value" id="m-prod">—</div><div class="label">En Producción</div></div>
    <div class="metric-card prog"><div class="value" id="m-prog">—</div><div class="label">Programados</div></div>
    <div class="metric-card pub"><div class="value" id="m-pub">—</div><div class="label">Publicados Hoy</div></div>
  </div>

  <!-- Marcas -->
  <div class="section-title">Marcas</div>
  <div class="brands" id="brands">
    <div class="loading"><div class="spinner"></div>Cargando marcas...</div>
  </div>

  <!-- Posts recientes -->
  <div class="section-title" style="margin-top:16px">Posts Recientes</div>
  <div class="filters" id="filters">
    <button class="filter-btn active" data-filter="all">Todos</button>
    <button class="filter-btn" data-filter="inbox">Inbox</button>
    <button class="filter-btn" data-filter="prod">En Producción</button>
    <button class="filter-btn" data-filter="prog">Programados</button>
    <button class="filter-btn" data-filter="pub">Publicados</button>
    <button class="filter-btn" data-filter="err">Errores</button>
  </div>
  <div class="posts-list" id="posts">
    <div class="loading"><div class="spinner"></div>Cargando posts...</div>
  </div>
</div>

<script>
const BRANDS = [
  'Salsa Soul Studio',
  'Ivan & Ingrid Dancers',
  'NY2Cali Social',
  'Alma Latina Boutique',
  'Fenix Kids Academy',
  'La Casona Lafuente',
  'Mamba Basket Academy'
];

const STATE_MAP = {
  inbox: { label: 'Inbox', cls: 'inbox' },
  prod: { label: 'En Producción', cls: 'prod' },
  prog: { label: 'Programado', cls: 'prog' },
  pub: { label: 'Publicado', cls: 'pub' },
  err: { label: 'Error', cls: 'err' }
};

let allPosts = [];

async function loadData() {
  try {
    const res = await fetch('/api/panel-data');
    if (res.status === 401) {
      window.location.href = '/panel';
      return;
    }
    if (!res.ok) throw new Error('Error ' + res.status);
    const data = await res.json();

    if (data.error) {
      showError(data.error);
      return;
    }

    allPosts = data.posts || [];
    renderMetrics(data.metrics);
    renderBrands(data.brands);
    renderPosts(allPosts);
    document.getElementById('lastUpdate').textContent =
      'Actualizado: ' + new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' });
  } catch (e) {
    showError('No se pudo conectar con Postiz: ' + e.message);
  }
}

function showError(msg) {
  document.getElementById('brands').innerHTML = '<div class="error-msg">' + msg + '</div>';
  document.getElementById('posts').innerHTML = '';
}

function renderMetrics(m) {
  if (!m) return;
  document.getElementById('m-inbox').textContent = m.inbox || 0;
  document.getElementById('m-prod').textContent = m.prod || 0;
  document.getElementById('m-prog').textContent = m.prog || 0;
  document.getElementById('m-pub').textContent = m.pub || 0;
}

function renderBrands(brands) {
  if (!brands || !brands.length) {
    document.getElementById('brands').innerHTML = '<div class="error-msg">No hay datos de marcas</div>';
    return;
  }
  const maxCount = Math.max(1, ...brands.flatMap(b => [b.inbox, b.prod, b.prog, b.pub, b.err]));
  document.getElementById('brands').innerHTML = brands.map(b => {
    const bars = ['inbox', 'prod', 'prog', 'pub', 'err'].map(key => {
      const count = b[key] || 0;
      const pct = (count / maxCount) * 100;
      return '<div class="brand-bar">' +
        '<span class="bar-label">' + STATE_MAP[key].label + '</span>' +
        '<div class="bar-track"><div class="bar-fill bar-' + key + '" style="width:' + pct + '%"></div></div>' +
        '<span class="bar-count">' + count + '</span>' +
      '</div>';
    }).join('');
    return '<div class="brand-card"><h3>' + b.name + '</h3><div class="brand-bars">' + bars + '</div></div>';
  }).join('');
}

function renderPosts(posts) {
  if (!posts || !posts.length) {
    document.getElementById('posts').innerHTML = '<div class="error-msg">No hay posts</div>';
    return;
  }
  document.getElementById('posts').innerHTML = posts.map(p => {
    const state = STATE_MAP[p.state] || STATE_MAP.inbox;
    const networks = (p.networks || []).map(n =>
      '<span class="post-network">' + n + '</span>'
    ).join('');
    const date = p.scheduledDate
      ? new Date(p.scheduledDate).toLocaleDateString('es-PY', {
          timeZone: 'America/Asuncion', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        })
      : '';
    return '<div class="post-row" data-state="' + p.state + '">' +
      '<div class="post-status ' + state.cls + '"></div>' +
      '<div class="post-info">' +
        '<div class="post-name">' + escapeHtml(p.name || 'Sin título') + '</div>' +
        '<div class="post-meta">' + state.label + (date ? ' · ' + date : '') + '</div>' +
      '</div>' +
      '<span class="post-brand">' + escapeHtml(p.brand || '') + '</span>' +
      '<div class="post-networks">' + networks + '</div>' +
    '</div>';
  }).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// Filtros
document.getElementById('filters').addEventListener('click', e => {
  if (!e.target.classList.contains('filter-btn')) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  const filter = e.target.dataset.filter;
  if (filter === 'all') {
    renderPosts(allPosts);
  } else {
    renderPosts(allPosts.filter(p => p.state === filter));
  }
});

loadData();
// Refrescar cada 5 minutos
setInterval(loadData, 300000);
</script>

</body>
</html>`;
}
