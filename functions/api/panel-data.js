// Proxy server-side a Postiz API — /api/panel-data
// No expone API key al browser

const COOKIE_NAME = 'panel_auth';
const COOKIE_VALUE = 'sss_panel_2026';
const POSTIZ_BASE = 'https://postiz.salsasoulstudio.com/api/public/v1';

const BRANDS = [
  'Salsa Soul Studio',
  'Ivan & Ingrid Dancers',
  'NY2Cali Social',
  'Alma Latina Boutique',
  'Fenix Kids Academy',
  'La Casona Lafuente',
  'Mamba Basket Academy',
];

// Mapeo de estado Postiz → estado del dashboard
function mapState(post) {
  const group = (post.group || '').toLowerCase();
  const state = (post.state || post.status || '').toLowerCase();

  // Por carpeta/grupo
  if (group.includes('inbox') || group.includes('1_inbox')) return 'inbox';
  if (group.includes('produccion') || group.includes('2_en_produccion')) return 'prod';
  if (group.includes('programado') || group.includes('3_programado')) return 'prog';
  if (group.includes('publicado') || group.includes('4_publicado')) return 'pub';

  // Por estado del post
  if (state === 'error' || state === 'failed') return 'err';
  if (state === 'published' || state === 'completed') return 'pub';
  if (state === 'scheduled') return 'prog';
  if (state === 'draft') return 'inbox';
  if (state === 'queue') return 'prog';

  return 'inbox';
}

// Detectar marca del post por nombre de integración/canal
function detectBrand(post, integrations) {
  // Buscar en la integración asociada
  const intId = post.integrationId || post.integration?.id;
  if (intId && integrations) {
    const integration = integrations.find(i => i.id === intId);
    if (integration) {
      const name = (integration.name || integration.providerIdentifier || '').toLowerCase();
      for (const brand of BRANDS) {
        if (name.includes(brand.toLowerCase().split(' ')[0])) return brand;
      }
      // Buscar por profile/identifier
      const profile = (integration.profile || integration.identifier || '').toLowerCase();
      for (const brand of BRANDS) {
        const words = brand.toLowerCase().split(' ');
        if (words.some(w => w.length > 3 && profile.includes(w))) return brand;
      }
    }
  }

  // Fallback: buscar en contenido/título del post
  const content = ((post.content || '') + ' ' + (post.title || '')).toLowerCase();
  for (const brand of BRANDS) {
    const words = brand.toLowerCase().split(' ');
    if (words.some(w => w.length > 3 && content.includes(w))) return brand;
  }

  return 'Sin marca';
}

// Obtener redes del post
function getNetworks(post, integrations) {
  const networks = [];
  const intId = post.integrationId || post.integration?.id;
  if (intId && integrations) {
    const integration = integrations.find(i => i.id === intId);
    if (integration) {
      const provider = (integration.providerIdentifier || integration.provider || integration.type || '').toLowerCase();
      if (provider.includes('instagram')) networks.push('IG');
      else if (provider.includes('facebook')) networks.push('FB');
      else if (provider.includes('tiktok')) networks.push('TK');
      else if (provider.includes('youtube')) networks.push('YT');
      else if (provider.includes('twitter') || provider.includes('x')) networks.push('X');
      else if (provider.includes('linkedin')) networks.push('LI');
      else if (provider) networks.push(provider.slice(0, 4).toUpperCase());
    }
  }
  return networks.length ? networks : ['—'];
}

export async function onRequestGet(context) {
  // Verificar autenticación
  const cookie = context.request.headers.get('Cookie') || '';
  if (!cookie.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const apiKey = context.env.POSTIZ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'POSTIZ_API_KEY no configurada en Cloudflare' }, { status: 500 });
  }

  const headers = {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  };

  try {
    // Fechas: últimos 30 días
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    const [postsRes, integrationsRes] = await Promise.all([
      fetch(`${POSTIZ_BASE}/posts?startDate=${start.toISOString()}&endDate=${now.toISOString()}`, { headers }),
      fetch(`${POSTIZ_BASE}/integrations`, { headers }),
    ]);

    if (!postsRes.ok) {
      const errText = await postsRes.text().catch(() => '');
      return Response.json({
        error: `Postiz respondió ${postsRes.status}: ${errText.slice(0, 200)}`,
      }, { status: 502 });
    }

    const postsData = await postsRes.json();
    const integrationsData = integrationsRes.ok ? await integrationsRes.json() : [];

    // Normalizar: Postiz puede devolver array directo o { data: [...] }
    const rawPosts = Array.isArray(postsData) ? postsData : (postsData.data || postsData.posts || []);
    const integrations = Array.isArray(integrationsData) ? integrationsData : (integrationsData.data || []);

    // Hoy en PY (UTC-3)
    const todayPY = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Procesar posts
    const posts = rawPosts.map(p => {
      const state = mapState(p);
      const brand = detectBrand(p, integrations);
      const networks = getNetworks(p, integrations);
      return {
        id: p.id,
        name: p.content?.slice(0, 80) || p.title || 'Sin título',
        state,
        brand,
        networks,
        scheduledDate: p.publishDate || p.scheduledDate || p.releaseURL || null,
      };
    });

    // Métricas
    const metrics = { inbox: 0, prod: 0, prog: 0, pub: 0 };
    posts.forEach(p => {
      if (p.state === 'inbox') metrics.inbox++;
      else if (p.state === 'prod') metrics.prod++;
      else if (p.state === 'prog') metrics.prog++;
      else if (p.state === 'pub') {
        // Solo contar publicados HOY
        const pubDate = p.scheduledDate ? new Date(new Date(p.scheduledDate).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10) : null;
        if (pubDate === todayPY) metrics.pub++;
      }
    });

    // Brands breakdown
    const brandStats = BRANDS.map(name => {
      const brandPosts = posts.filter(p => p.brand === name);
      return {
        name,
        inbox: brandPosts.filter(p => p.state === 'inbox').length,
        prod: brandPosts.filter(p => p.state === 'prod').length,
        prog: brandPosts.filter(p => p.state === 'prog').length,
        pub: brandPosts.filter(p => p.state === 'pub').length,
        err: brandPosts.filter(p => p.state === 'err').length,
      };
    });

    // Ordenar posts: errores primero, después por fecha desc
    posts.sort((a, b) => {
      if (a.state === 'err' && b.state !== 'err') return -1;
      if (b.state === 'err' && a.state !== 'err') return 1;
      const da = a.scheduledDate || '';
      const db = b.scheduledDate || '';
      return db.localeCompare(da);
    });

    return Response.json({ metrics, brands: brandStats, posts });
  } catch (e) {
    return Response.json({
      error: 'Error conectando con Postiz: ' + e.message,
    }, { status: 502 });
  }
}
